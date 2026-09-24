from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Any
from pydantic import BaseModel

from app.db.database import get_db
from app.db import models
from app.ml.task_eta import predict_task_eta
from app.ml.machine_anomaly import detect_machine_anomalies
from app.ml.fuel_anomaly import detect_fuel_anomaly
from app.ml.safety_risk import calculate_safety_risk

router = APIRouter()

class TaskEtaRequest(BaseModel):
    task_id: str

@router.post("/task-eta")
def get_task_eta(req: TaskEtaRequest, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.task_id == req.task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return predict_task_eta(task, db)

@router.get("/fuel/{machine_id}")
def get_fuel_anomaly(machine_id: str, db: Session = Depends(get_db)):
    machine = db.query(models.Machine).filter(models.Machine.machine_id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
        
    return detect_fuel_anomaly(machine_id, db)

@router.get("/safety/{operator_id}")
def get_safety_risk(operator_id: str, db: Session = Depends(get_db)):
    operator = db.query(models.Operator).filter(models.Operator.operator_id == operator_id).first()
    if not operator:
        raise HTTPException(status_code=404, detail="Operator not found")
        
    return calculate_safety_risk(operator_id, db)

@router.get("/operator/{operator_id}")
def get_unified_operator_intelligence(operator_id: str, db: Session = Depends(get_db)):
    operator = db.query(models.Operator).filter(models.Operator.operator_id == operator_id).first()
    if not operator:
        raise HTTPException(status_code=404, detail="Operator not found")
        
    # Get active task
    task = db.query(models.Task).filter(
        models.Task.operator_id == operator_id,
        models.Task.task_status != "Completed"
    ).first()
    
    task_eta = None
    machine_health = None
    fuel = None
    
    if task:
        task_eta = predict_task_eta(task, db)
        
        # Machine anomaly
        telemetry = db.query(models.Telemetry).filter(
            models.Telemetry.machine_id == task.machine_id
        ).order_by(models.Telemetry.timestamp.desc()).limit(1).all()
        machine_health = detect_machine_anomalies(telemetry)
        if machine_health:
            machine_health['machine_id'] = task.machine_id
            
        fuel = detect_fuel_anomaly(task.machine_id, db)
        
    safety = calculate_safety_risk(operator_id, db)
    
    # Generate Insights
    insights = []
    
    if task_eta:
        if task_eta['status'] == 'likely_delayed':
            insights.append({
                "severity": "high",
                "message": f"Task '{task.task_type}' is trending {task_eta['delay_minutes']} minutes behind schedule."
            })
        elif task_eta['status'] == 'likely_early':
            insights.append({
                "severity": "low",
                "message": f"Task '{task.task_type}' is trending ahead of schedule."
            })
            
    if machine_health and machine_health['status'] != 'Normal':
        reasons_str = ", ".join(machine_health.get('reasons', []))
        insights.append({
            "severity": "high",
            "message": f"Machine {task.machine_id} requires attention: {reasons_str}."
        })
        
    if fuel and fuel['status'] != 'normal':
        severity = "high" if fuel['status'] == 'high' else "medium"
        insights.append({
            "severity": severity,
            "message": f"Fuel consumption is {fuel['deviation_percent']}% above expected for this operation."
        })
        
    if safety['risk_level'] in ['high', 'critical']:
        insights.append({
            "severity": "high",
            "message": safety['recommendation']
        })
        
    return {
        "operator_id": operator_id,
        "task_eta": task_eta,
        "machine": machine_health,
        "fuel": fuel,
        "safety": safety,
        "insights": insights
    }
