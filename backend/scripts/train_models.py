import os
import sys
from pathlib import Path
import joblib
import pandas as pd
from sqlalchemy.orm import Session
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score

# Add backend to path so we can import app modules
sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.db.database import SessionLocal
from app.db import models

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def train_task_duration_model(db: Session, models_dir: Path):
    print("Training Task Duration Model...")
    
    tasks = db.query(models.TaskHistory).filter(
        models.TaskHistory.actual_duration_min.isnot(None)
    ).all()
    
    if not tasks:
        print("No historical tasks found.")
        return
        
    df = pd.DataFrame([t.__dict__ for t in tasks])
    
    # Select simple robust features
    features = ['task_type', 'machine_type', 'operator_skill_level', 'target_quantity', 'estimated_duration_min']
    df = df.dropna(subset=features + ['actual_duration_min'])
    
    X = df[features].copy()
    y = df['actual_duration_min']
    
    # Encode categorical variables safely
    encoders = {}
    for col in ['task_type', 'machine_type', 'operator_skill_level']:
        le = LabelEncoder()
        # Ensure we handle unseen categories gracefully in inference, but fit normal here
        X[col] = le.fit_transform(X[col])
        encoders[col] = le
        
    model = RandomForestRegressor(n_estimators=50, random_state=42)
    model.fit(X, y)
    
    y_pred = model.predict(X)
    print(f"Task Duration Model - MAE: {mean_absolute_error(y, y_pred):.2f}, R2: {r2_score(y, y_pred):.2f}")
    
    joblib.dump({'model': model, 'encoders': encoders, 'features': features}, models_dir / "task_duration_model.joblib")

def train_machine_anomaly_model(db: Session, models_dir: Path):
    print("Training Machine Anomaly Model...")
    
    # Limit telemetry records used for training as per MVP instructions to save memory/time
    telemetry = db.query(models.Telemetry).limit(25000).all()
    if not telemetry:
        print("No telemetry data found.")
        return
        
    df = pd.DataFrame([t.__dict__ for t in telemetry])
    
    features = ['engine_rpm', 'engine_load_percent', 'machine_speed_kmh', 'fuel_rate_lph']
    df = df.dropna(subset=features)
    
    X = df[features]
    
    model = IsolationForest(contamination=0.05, random_state=42)
    model.fit(X)
    
    preds = model.predict(X)
    anomalies = (preds == -1).sum()
    print(f"Machine Anomaly Model - Training rows: {len(X)}, Anomalies detected: {anomalies}")
    
    joblib.dump({'model': model, 'features': features}, models_dir / "machine_anomaly_model.joblib")

def main():
    models_dir = Path(__file__).resolve().parents[1] / "models"
    models_dir.mkdir(exist_ok=True)
    
    db = next(get_db())
    train_task_duration_model(db, models_dir)
    train_machine_anomaly_model(db, models_dir)
    print("Models saved successfully.")
    
if __name__ == "__main__":
    main()
