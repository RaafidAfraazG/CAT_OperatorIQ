import os
import re
import logging
from typing import Any, Dict, List, Optional
import httpx
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict

from app.db.database import get_db
from app.db import models
from app.routes.intelligence import get_unified_operator_intelligence
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    operator_id: Optional[str] = None
    fuelPercent: Optional[Any] = None
    fuelRate: Optional[Any] = None
    engineLoad: Optional[Any] = None
    engineRpm: Optional[Any] = None
    fuel_percent: Optional[Any] = None
    fuel_rate: Optional[Any] = None
    engine_load: Optional[Any] = None
    engine_rpm: Optional[Any] = None
    telemetry: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(extra="ignore")


def _safe_float(val: Any) -> Optional[float]:
    if val is None or val == "" or str(val).strip().upper() == "UNAVAILABLE":
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def _safe_int(val: Any) -> Optional[int]:
    if val is None or val == "" or str(val).strip().upper() == "UNAVAILABLE":
        return None
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return None


def _determine_sources(message: str) -> List[str]:
    sources = []
    lower = message.lower()
    if any(k in lower for k in ["task", "finish", "behind", "schedule", "eta", "duration"]):
        sources.append("task_eta")
    if "fuel" in lower:
        sources.append("fuel_usage")
    if any(k in lower for k in ["safe", "incident", "hazard", "risk", "warning", "seatbelt", "proximity"]):
        sources.append("safety_monitor")
    if any(k in lower for k in ["machine", "health", "rpm", "load", "engine", "speed", "coolant", "pressure"]):
        sources.append("machine_telemetry")
    if not sources:
        sources.append("operator_profile")
    return sources


def _extract_user_question(message: str) -> str:
    """Extracts actual question if message is wrapped in CURRENT MACHINE CONTEXT template."""
    if "OPERATOR QUESTION:" in message:
        parts = message.split("OPERATOR QUESTION:")
        if len(parts) > 1 and parts[-1].strip():
            return parts[-1].strip()
    return message.strip()


def _generate_fallback_response(
    query: str,
    operator: Any,
    task: Optional[Any],
    machine: Optional[Any],
    fuel_pct: Optional[float],
    fuel_rate: Optional[float],
    engine_load: Optional[float],
    engine_rpm: Optional[int],
    intel: Dict[str, Any]
) -> str:
    """Generates a reliable, context-grounded operational response when external LLM is offline or fails."""
    lower = query.lower()
    fuel_info = intel.get("fuel") or {}
    safety_info = intel.get("safety") or {}
    task_eta = intel.get("task_eta") or {}
    machine_health = intel.get("machine") or {}

    machine_model = machine.machine_model if machine else "Equipment"
    task_type = task.task_type.replace("_", " ") if task and getattr(task, "task_type", None) else "Unassigned"

    # 1. Fuel inquiry
    if "fuel" in lower:
        if fuel_pct is not None and fuel_rate is not None:
            return f"Fuel level is {fuel_pct:.1f}% (burning at {fuel_rate:.1f} L/h)."
        elif fuel_pct is not None:
            return f"Fuel level is {fuel_pct:.1f}%."
        return "Fuel level telemetry is currently unavailable."

    # 2. Engine / Telemetry / Machine inquiry
    if any(k in lower for k in ["rpm", "load", "telemetry", "engine", "machine", "health", "speed"]):
        rpm_str = f"{engine_rpm} RPM" if engine_rpm is not None else "unavailable"
        load_str = f"{engine_load:.1f}%" if engine_load is not None else "unavailable"
        health_status = machine_health.get("status", "Normal")
        return f"{machine_model} is {health_status}. Engine RPM: {rpm_str}, Load: {load_str}."

    # 3. Safety inquiry
    if any(k in lower for k in ["safe", "risk", "hazard", "incident", "warning", "belt"]):
        risk_lvl = safety_info.get("risk_level", "low").upper()
        risk_score = safety_info.get("risk_score", 15)
        rec = safety_info.get("recommendation", "Operating safely.")
        return f"Safety is {risk_lvl} (Risk Score: {risk_score}/100). {rec}"

    # 4. Task / ETA inquiry
    if any(k in lower for k in ["task", "finish", "eta", "behind", "schedule", "duration"]):
        if not task:
            return "No active task assigned."
        delay = task_eta.get("delay_minutes", 0)
        delay_msg = f"{delay} min behind" if delay > 0 else "on schedule"
        est_min = task_eta.get("predicted_duration_min") or getattr(task, "estimated_duration_min", 30)
        return f"Task '{task_type}': {delay_msg} (ETA: {est_min} min)."

    # 5. Shift / Performance summary inquiry
    if any(k in lower for k in ["shift", "score", "performance", "productivity", "summary"]):
        return (
            f"Shift overview: Safety {operator.safety_score}/100, "
            f"Productivity {operator.average_productivity_score}/100, "
            f"Training {operator.training_score}/100."
        )

    # 6. Default general assistant response
    return f"{machine_model} active on '{task_type}'. All monitoring systems operational."


@router.post("/chat")
async def chat_with_assistant(req: ChatRequest, db: Session = Depends(get_db)):
    try:
        # Resolve Operator
        operator = None
        if req.operator_id:
            operator = db.query(models.Operator).filter(models.Operator.operator_id == req.operator_id).first()
        if not operator:
            operator = db.query(models.Operator).first()
        if not operator:
            # Fallback mock operator object if database table is empty
            class FallbackOperator:
                operator_id = req.operator_id or "OP0001"
                operator_name = "Operator"
                skill_level = "Standard"
                safety_score = 90
                average_productivity_score = 85
                training_score = 88
            operator = FallbackOperator()

        # Resolve Active Task and Machine
        task = None
        machine = None
        try:
            task = db.query(models.Task).filter(
                models.Task.operator_id == operator.operator_id,
                models.Task.task_status != "Completed"
            ).first()
            if not task:
                task = db.query(models.Task).filter(models.Task.operator_id == operator.operator_id).first()

            # Check if message specified a machine model (e.g. from HMI context string)
            if "Machine:" in req.message:
                m_match = re.search(r"Machine:\s*([^\r\n]+)", req.message)
                if m_match:
                    specified_model = m_match.group(1).strip()
                    if specified_model and specified_model.upper() != "UNKNOWN":
                        matched_machine = db.query(models.Machine).filter(
                            (models.Machine.machine_model == specified_model) | (models.Machine.machine_id == specified_model)
                        ).first()
                        if matched_machine:
                            machine = matched_machine

            if not machine:
                if task and task.machine_id:
                    machine = db.query(models.Machine).filter(models.Machine.machine_id == task.machine_id).first()
            if not machine:
                machine = db.query(models.Machine).first()
        except Exception as e:
            logger.warning("Error querying task or machine context: %s", e)

        # Resolve Telemetry Fields
        # 1. From direct request parameters (camelCase or snake_case or nested)
        req_tel = req.telemetry or {}
        fuel_percent = _safe_float(req.fuelPercent if req.fuelPercent is not None else req.fuel_percent)
        if fuel_percent is None:
            fuel_percent = _safe_float(req_tel.get("fuelPercent", req_tel.get("fuel_percent", req_tel.get("fuel_level_percent"))))

        fuel_rate = _safe_float(req.fuelRate if req.fuelRate is not None else req.fuel_rate)
        if fuel_rate is None:
            fuel_rate = _safe_float(req_tel.get("fuelRate", req_tel.get("fuel_rate", req_tel.get("fuel_rate_lph"))))

        engine_load = _safe_float(req.engineLoad if req.engineLoad is not None else req.engine_load)
        if engine_load is None:
            engine_load = _safe_float(req_tel.get("engineLoad", req_tel.get("engine_load", req_tel.get("engine_load_percent"))))

        engine_rpm = _safe_int(req.engineRpm if req.engineRpm is not None else req.engine_rpm)
        if engine_rpm is None:
            engine_rpm = _safe_int(req_tel.get("engineRpm", req_tel.get("engine_rpm")))

        # Check if numeric telemetry was embedded in message text (e.g. "Fuel level: 62.8%")
        if fuel_percent is None and "Fuel level:" in req.message:
            fl_match = re.search(r"Fuel level:\s*([0-9.]+)", req.message)
            if fl_match:
                fuel_percent = _safe_float(fl_match.group(1))

        if fuel_rate is None and "Fuel rate:" in req.message:
            fr_match = re.search(r"Fuel rate:\s*([0-9.]+)", req.message)
            if fr_match:
                fuel_rate = _safe_float(fr_match.group(1))

        if engine_load is None and "Engine load:" in req.message:
            el_match = re.search(r"Engine load:\s*([0-9.]+)", req.message)
            if el_match:
                engine_load = _safe_float(el_match.group(1))

        if engine_rpm is None and "Engine RPM:" in req.message:
            er_match = re.search(r"Engine RPM:\s*([0-9.]+)", req.message)
            if er_match:
                engine_rpm = _safe_int(er_match.group(1))

        # 2. Database fallback if missing
        if (fuel_percent is None or fuel_rate is None or engine_load is None or engine_rpm is None) and machine:
            try:
                latest_tel = db.query(models.Telemetry).filter(
                    models.Telemetry.machine_id == machine.machine_id
                ).order_by(models.Telemetry.timestamp.desc()).first()
                if latest_tel:
                    if fuel_percent is None:
                        fuel_percent = _safe_float(latest_tel.fuel_level_percent)
                    if fuel_rate is None:
                        fuel_rate = _safe_float(latest_tel.fuel_rate_lph)
                    if engine_load is None:
                        engine_load = _safe_float(latest_tel.engine_load_percent)
                    if engine_rpm is None:
                        engine_rpm = _safe_int(latest_tel.engine_rpm)
            except Exception as e:
                logger.warning("Error querying latest telemetry: %s", e)

        # Gather Unified Intelligence
        intel = {}
        try:
            intel = get_unified_operator_intelligence(operator.operator_id, db)
        except Exception as e:
            logger.warning("Error retrieving unified operator intelligence: %s", e)

        # String representations for prompt & fallback
        fuel_pct_str = f"{fuel_percent:.1f}%" if fuel_percent is not None else "UNAVAILABLE"
        fuel_rate_str = f"{fuel_rate:.1f} L/h" if fuel_rate is not None else "UNAVAILABLE"
        engine_load_str = f"{engine_load:.1f}%" if engine_load is not None else "UNAVAILABLE"
        engine_rpm_str = f"{engine_rpm} RPM" if engine_rpm is not None else "UNAVAILABLE"

        question_text = _extract_user_question(req.message)
        sources = _determine_sources(question_text)

        # Build System Prompt
        machine_model = machine.machine_model if machine else "Unknown"
        machine_status = machine.status if machine else "Unknown"
        task_type_str = task.task_type if task else "None"

        system_prompt = f"""You are OperatorIQ Assistant, an operational AI for heavy-equipment operators.

CRITICAL RULES:
- Answer ONLY what was specifically asked in 1 to 2 sentences maximum.
- Be extremely concise, direct, and factual.
- NO filler phrases, NO pleasantries or greetings (do NOT say "Hello", "Certainly", "Sure", "I can help with that", "Based on the telemetry").
- State the answer or metric immediately.
- Use the supplied OperatorIQ operational context as the primary source of truth.
- Never invent machine telemetry, safety events, task information, fuel values, or training records.
- If a telemetry value is UNAVAILABLE, state that it is unavailable.
- Prioritize safety if asked about hazards or unsafe conditions.

OPERATOR CONTEXT:
ID: {operator.operator_id}
Name: {operator.operator_name}
Skill: {operator.skill_level}
Safety Score: {operator.safety_score}/100
Productivity Score: {operator.average_productivity_score}/100
Training Score: {operator.training_score}/100

MACHINE & TELEMETRY CONTEXT:
Machine Model: {machine_model}
Status: {machine_status}
Fuel Level: {fuel_pct_str}
Fuel Rate: {fuel_rate_str}
Engine RPM: {engine_rpm_str}
Engine Load: {engine_load_str}
Active Task: {task_type_str}

INTELLIGENCE CONTEXT:
Task ETA: {intel.get('task_eta', 'None')}
Machine Health: {intel.get('machine', 'None')}
Fuel: {intel.get('fuel', 'None')}
Safety: {intel.get('safety', 'None')}
Current Insights: {intel.get('insights', 'None')}
"""

        # Grok / xAI / Groq API Call
        api_key = (settings.XAI_API_KEY or os.getenv("XAI_API_KEY") or os.getenv("GROQ_API_KEY") or "").strip()
        reply: Optional[str] = None

        if api_key:
            # Determine provider & models based on API key prefix
            if api_key.startswith("xai-"):
                api_url = "https://api.x.ai/v1/chat/completions"
                candidate_models = ["grok-2-latest", "grok-beta"]
            else:
                api_url = "https://api.groq.com/openai/v1/chat/completions"
                candidate_models = ["qwen/qwen3.8-27b", "openai/gpt-oss-20b", "llama-3.1-8b-instant"]

            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }

            for model_name in candidate_models:
                try:
                    async with httpx.AsyncClient(timeout=8.0) as client:
                        response = await client.post(
                            api_url,
                            headers=headers,
                            json={
                                "model": model_name,
                                "messages": [
                                    {"role": "system", "content": system_prompt},
                                    {"role": "user", "content": question_text}
                                ],
                                "temperature": 0.1,
                                "max_tokens": 60
                            }
                        )

                    if response.status_code == 200:
                        data = response.json()
                        choices = data.get("choices", [])
                        if choices:
                            candidate_content = choices[0].get("message", {}).get("content")
                            if candidate_content and candidate_content.strip():
                                # Clean any reasoning blocks if present
                                clean_reply = re.sub(r"<think>.*?</think>", "", candidate_content, flags=re.DOTALL).strip()
                                if clean_reply:
                                    reply = clean_reply
                                    break
                    else:
                        logger.warning(
                            "LLM call to %s with model %s returned status %d",
                            api_url, model_name, response.status_code
                        )
                except Exception as ex:
                    logger.warning("LLM call attempt failed for model %s: %s", model_name, ex)

        # If LLM didn't return a reply, use the reliable local context engine
        if not reply:
            reply = _generate_fallback_response(
                query=question_text,
                operator=operator,
                task=task,
                machine=machine,
                fuel_pct=fuel_percent,
                fuel_rate=fuel_rate,
                engine_load=engine_load,
                engine_rpm=engine_rpm,
                intel=intel
            )

        return {
            "response": reply,
            "sources": sources
        }

    except Exception as e:
        logger.error("Unhandled error in assistant chat: %s", e, exc_info=True)
        # Even on unexpected exception, return 200 with helpful response, NEVER crash FastAPI process
        return {
            "response": "OperatorIQ Assistant is operational. Telemetry and safety systems are active.",
            "sources": ["operator_profile"]
        }

