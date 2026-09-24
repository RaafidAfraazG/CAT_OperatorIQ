from app.db import models
from sqlalchemy.orm import Session
from sqlalchemy import func

def detect_fuel_anomaly(machine_id: str, db: Session):
    """
    Deterministically compares current machine fuel rate with historical expected rates.
    """
    # Get latest fuel usage
    latest = db.query(models.FuelUsage).filter(
        models.FuelUsage.machine_id == machine_id
    ).order_by(models.FuelUsage.timestamp.desc()).first()
    
    if not latest:
        return {
            "machine_id": machine_id,
            "actual_fuel_rate": 0,
            "expected_fuel_rate": 0,
            "deviation_percent": 0,
            "status": "normal",
            "idle_fuel": 0
        }
        
    actual = latest.fuel_rate_lph or 0
    
    # Calculate historical median for this machine
    # For MVP we can just use the expected_fuel_rate_lph if it exists in DB, 
    # or calculate average of history
    avg_hist = db.query(func.avg(models.FuelUsage.fuel_rate_lph)).filter(
        models.FuelUsage.machine_id == machine_id
    ).scalar()
    
    expected = latest.expected_fuel_rate_lph or avg_hist or 20.0
    expected = round(expected, 1)
    actual = round(actual, 1)
    
    deviation = ((actual - expected) / expected * 100) if expected > 0 else 0
    deviation = round(deviation, 1)
    
    status = "normal"
    if deviation > 20:
        status = "high"
    elif deviation > 10:
        status = "elevated"
        
    return {
        "machine_id": machine_id,
        "actual_fuel_rate": actual,
        "expected_fuel_rate": expected,
        "deviation_percent": deviation,
        "status": status,
        "idle_fuel": latest.idle_fuel_l or 0
    }
