import joblib
import pandas as pd
from pathlib import Path
from sqlalchemy.orm import Session
from app.db import models

MODELS_DIR = Path(__file__).resolve().parents[2] / "models"
MODEL_PATH = MODELS_DIR / "task_duration_model.joblib"

_model_cache = None

def get_task_model():
    global _model_cache
    if _model_cache is None:
        if MODEL_PATH.exists():
            _model_cache = joblib.load(MODEL_PATH)
    return _model_cache

def predict_task_eta(task: models.Task, db: Session):
    model_data = get_task_model()
    if not model_data:
        return {
            "task_id": task.task_id,
            "estimated_duration_min": task.estimated_duration_min,
            "predicted_duration_min": task.estimated_duration_min,
            "delay_minutes": 0,
            "status": "model_not_available"
        }
        
    model = model_data['model']
    encoders = model_data['encoders']
    features = model_data['features']
    
    # Construct feature vector
    machine = db.query(models.Machine).filter(models.Machine.machine_id == task.machine_id).first()
    operator = db.query(models.Operator).filter(models.Operator.operator_id == task.operator_id).first()
    
    machine_type = machine.machine_type if machine else "Unknown"
    operator_skill = operator.skill_level if operator else "Unknown"
    
    def safe_encode(col_name, val):
        le = encoders[col_name]
        if val in le.classes_:
            return le.transform([val])[0]
        # fallback to 0 if unseen category
        return 0
        
    df = pd.DataFrame([{
        'task_type': safe_encode('task_type', task.task_type),
        'machine_type': safe_encode('machine_type', machine_type),
        'operator_skill_level': safe_encode('operator_skill_level', operator_skill),
        'target_quantity': task.target_quantity or 0,
        'estimated_duration_min': task.estimated_duration_min or 0
    }])
    
    pred_duration = model.predict(df[features])[0]
    pred_duration = round(pred_duration)
    
    est = task.estimated_duration_min or pred_duration
    delay = pred_duration - est
    
    status = "on_time"
    if delay > 15:
        status = "likely_delayed"
    elif delay < -15:
        status = "likely_early"
        
    return {
        "task_id": task.task_id,
        "estimated_duration_min": est,
        "predicted_duration_min": pred_duration,
        "delay_minutes": delay,
        "status": status
    }
