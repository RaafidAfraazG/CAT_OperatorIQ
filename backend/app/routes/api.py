from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.db.database import get_db
from app.db import models
from app.schemas import core as schemas

router = APIRouter()

# --- Dashboard ---
@router.get("/dashboard/summary", response_model=schemas.DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    active_machines = db.query(models.Machine).count()
    active_operators = db.query(models.Operator).count()
    pending_tasks = db.query(models.Task).filter(models.Task.task_status != "Completed").count()
    active_alerts = db.query(models.Alert).filter(models.Alert.resolved == False).count()
    
    return {
        "active_machines": active_machines,
        "active_operators": active_operators,
        "pending_tasks": pending_tasks,
        "active_alerts": active_alerts
    }

@router.get("/operator/{operator_id}/dashboard")
def get_operator_dashboard(operator_id: str, db: Session = Depends(get_db)):
    operator = db.query(models.Operator).filter(models.Operator.operator_id == operator_id).first()
    if not operator:
        raise HTTPException(status_code=404, detail="Operator not found")
        
    tasks = db.query(models.Task).filter(models.Task.operator_id == operator_id).all()
    events = db.query(models.SafetyEvent).filter(models.SafetyEvent.operator_id == operator_id).all()
    training = db.query(models.TrainingProgress).filter(models.TrainingProgress.operator_id == operator_id).all()
    
    return {
        "operator": operator,
        "tasks": tasks,
        "safety_events": events,
        "training_progress": training
    }

# --- Machines ---
@router.get("/machines", response_model=List[schemas.Machine])
def get_machines(db: Session = Depends(get_db)):
    return db.query(models.Machine).all()

@router.get("/machines/{machine_id}", response_model=schemas.Machine)
def get_machine(machine_id: str, db: Session = Depends(get_db)):
    machine = db.query(models.Machine).filter(models.Machine.machine_id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    return machine

# --- Operators ---
@router.get("/operators", response_model=List[schemas.Operator])
def get_operators(db: Session = Depends(get_db)):
    return db.query(models.Operator).all()

@router.get("/operators/{operator_id}", response_model=schemas.Operator)
def get_operator(operator_id: str, db: Session = Depends(get_db)):
    operator = db.query(models.Operator).filter(models.Operator.operator_id == operator_id).first()
    if not operator:
        raise HTTPException(status_code=404, detail="Operator not found")
    return operator

# --- Tasks ---
@router.get("/tasks", response_model=List[schemas.Task])
def get_tasks(
    status: Optional[str] = None,
    machine_id: Optional[str] = None,
    operator_id: Optional[str] = None,
    site_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Task)
    if status:
        query = query.filter(models.Task.task_status == status)
    if machine_id:
        query = query.filter(models.Task.machine_id == machine_id)
    if operator_id:
        query = query.filter(models.Task.operator_id == operator_id)
    if site_id:
        query = query.filter(models.Task.site_id == site_id)
    return query.all()

@router.get("/tasks/{task_id}", response_model=schemas.Task)
def get_task(task_id: str, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.task_id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.get("/daily-tasks", response_model=List[schemas.DailyTask])
def get_daily_tasks(db: Session = Depends(get_db)):
    return db.query(models.DailyTask).all()

# --- Safety Events ---
@router.get("/safety/events", response_model=List[schemas.SafetyEvent])
def get_safety_events(
    machine_id: Optional[str] = None,
    operator_id: Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.SafetyEvent)
    if machine_id:
        query = query.filter(models.SafetyEvent.machine_id == machine_id)
    if operator_id:
        query = query.filter(models.SafetyEvent.operator_id == operator_id)
    if severity:
        query = query.filter(models.SafetyEvent.severity == severity)
    return query.all()

# --- Telemetry & Fuel ---
@router.get("/telemetry/{machine_id}", response_model=List[schemas.Telemetry])
def get_telemetry(machine_id: str, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Telemetry).filter(models.Telemetry.machine_id == machine_id).order_by(models.Telemetry.timestamp.desc()).limit(limit).all()

@router.get("/fuel/{machine_id}", response_model=List[schemas.FuelUsage])
def get_fuel(machine_id: str, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.FuelUsage).filter(models.FuelUsage.machine_id == machine_id).order_by(models.FuelUsage.timestamp.desc()).limit(limit).all()

# --- Alerts ---
@router.get("/alerts", response_model=List[schemas.Alert])
def get_alerts(
    resolved: Optional[bool] = None,
    machine_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Alert)
    if resolved is not None:
        query = query.filter(models.Alert.resolved == resolved)
    if machine_id:
        query = query.filter(models.Alert.machine_id == machine_id)
    return query.order_by(models.Alert.timestamp.desc()).limit(100).all()

# --- Training ---
@router.get("/training/modules", response_model=List[schemas.TrainingModule])
def get_training_modules(db: Session = Depends(get_db)):
    return db.query(models.TrainingModule).all()

@router.get("/training/progress/{operator_id}")
def get_training_progress(operator_id: str, db: Session = Depends(get_db)):
    progress_records = db.query(models.TrainingProgress).filter(models.TrainingProgress.operator_id == operator_id).all()
    operator = db.query(models.Operator).filter(models.Operator.operator_id == operator_id).first()
    
    completed_modules = []
    recommended_modules = []
    
    for record in progress_records:
        module = db.query(models.TrainingModule).filter(models.TrainingModule.training_id == record.training_id).first()
        if not module:
            continue
            
        if record.status == "Completed":
            completed_modules.append({
                "module_name": module.title,
                "completed_at": record.completion_date,
                "score": record.score
            })
        else:
            recommended_modules.append({
                "module_name": module.title,
                "priority_score": 90 if module.difficulty == "Advanced" else 50,
                "reason": record.reason_recommended or "Recommended based on recent performance"
            })
            
    # Sort completed by date descending (handle None dates safely)
    completed_modules.sort(key=lambda x: str(x["completed_at"]) if x["completed_at"] else "", reverse=True)
    
    certifications_held = []
    if operator and operator.certification_level:
        certifications_held.append(operator.certification_level)
        if operator.certification_level == "Level 3":
            certifications_held.extend(["Level 2", "Level 1"])
        elif operator.certification_level == "Level 2":
            certifications_held.append("Level 1")
            
    # Deduplicate certs while preserving order
    certifications_held = list(dict.fromkeys(certifications_held))

    return {
        "current_skill_progress": operator.training_score if operator else 0,
        "completed_modules": completed_modules,
        "recommended_modules": recommended_modules,
        "certifications_held": certifications_held
    }
