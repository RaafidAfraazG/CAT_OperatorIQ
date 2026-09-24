from app.db import models
from sqlalchemy.orm import Session
from sqlalchemy import func

def calculate_safety_risk(operator_id: str, db: Session):
    """
    Deterministically calculates a safety risk score based on recent events and operator behavior.
    """
    events = db.query(models.SafetyEvent).filter(
        models.SafetyEvent.operator_id == operator_id
    ).order_by(models.SafetyEvent.timestamp.desc()).limit(50).all()
    
    behavior = db.query(models.OperatorBehavior).filter(
        models.OperatorBehavior.operator_id == operator_id
    ).order_by(models.OperatorBehavior.timestamp.desc()).first()
    
    score = 15 # Base risk
    factors = []
    
    proximity_count = sum(1 for e in events if 'Proximity' in e.event_type)
    seatbelt_count = sum(1 for e in events if 'Seatbelt' in e.event_type)
    
    if proximity_count > 5:
        score += 30
        factors.append({"factor": "Frequent proximity events", "impact": "high"})
    elif proximity_count > 0:
        score += 15
        factors.append({"factor": "Recent proximity events", "impact": "medium"})
        
    if seatbelt_count > 2:
        score += 25
        factors.append({"factor": "Repeated seatbelt violations", "impact": "high"})
    elif seatbelt_count > 0:
        score += 10
        factors.append({"factor": "Recent seatbelt violation", "impact": "medium"})
        
    if behavior:
        if (behavior.hard_braking_count or 0) > 3:
            score += 15
            factors.append({"factor": "Hard braking behavior", "impact": "medium"})
        if (behavior.rapid_acceleration_count or 0) > 3:
            score += 15
            factors.append({"factor": "Rapid acceleration", "impact": "medium"})
            
    # Normalize 0-100
    score = min(100, max(0, score))
    
    risk_level = "low"
    rec = "Operating safely. Keep up the good work."
    
    if score >= 81:
        risk_level = "critical"
        rec = "Immediate safety review recommended due to critical operating violations."
    elif score >= 61:
        risk_level = "high"
        rec = "Maintain greater clearance and adhere strictly to site safety protocols."
    elif score >= 31:
        risk_level = "moderate"
        rec = "Review recent warnings and ensure smooth machine operation."
        
    if not factors:
        factors.append({"factor": "No recent major incidents", "impact": "low"})
        
    return {
        "operator_id": operator_id,
        "risk_score": score,
        "risk_level": risk_level,
        "factors": factors,
        "recommendation": rec
    }
