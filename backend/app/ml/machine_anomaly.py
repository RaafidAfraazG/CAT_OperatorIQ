import joblib
import pandas as pd
from pathlib import Path

MODELS_DIR = Path(__file__).resolve().parents[2] / "models"
MODEL_PATH = MODELS_DIR / "machine_anomaly_model.joblib"

_model_cache = None

def get_anomaly_model():
    global _model_cache
    if _model_cache is None:
        if MODEL_PATH.exists():
            _model_cache = joblib.load(MODEL_PATH)
    return _model_cache

def detect_machine_anomalies(telemetry_records):
    """
    Evaluates recent telemetry records and returns an anomaly status.
    Uses IsolationForest to find anomalies.
    """
    model_data = get_anomaly_model()
    if not model_data or not telemetry_records:
        return {
            "anomaly_score": 0.0,
            "status": "Normal",
            "reasons": []
        }
        
    model = model_data['model']
    features = model_data['features']
    
    # Take the most recent telemetry point
    latest = telemetry_records[0]
    
    df = pd.DataFrame([{
        'engine_rpm': latest.engine_rpm or 0,
        'engine_load_percent': latest.engine_load_percent or 0,
        'machine_speed_kmh': latest.machine_speed_kmh or 0,
        'fuel_rate_lph': latest.fuel_rate_lph or 0
    }])
    
    # Predict (-1 is anomaly, 1 is normal in IsolationForest)
    prediction = model.predict(df[features])[0]
    
    # Determine anomaly score (pseudo-probability for UI, IsolationForest gives decision_function)
    score = model.decision_function(df[features])[0]
    
    # Normalize score for UI roughly between 0 and 1, lower decision function means more anomalous
    # Normally score < 0 is anomaly. Let's map it:
    # If prediction == -1, map score from [-0.5, 0] to [0.5, 1.0] anomaly score
    # If prediction == 1, map score from [0, 0.5] to [0, 0.5] anomaly score
    anomaly_ui_score = round(max(0, 0.5 - score), 2)
    
    status = "Attention" if prediction == -1 else "Normal"
    reasons = []
    
    if prediction == -1:
        if df['engine_load_percent'][0] > 85:
            reasons.append("High engine load detected")
        if df['engine_rpm'][0] > 2200:
            reasons.append("Unusually high RPM")
        if df['fuel_rate_lph'][0] > 40:
            reasons.append("Elevated fuel rate")
        if not reasons:
            reasons.append("Abnormal operating pattern detected")
            
    return {
        "anomaly_score": anomaly_ui_score,
        "status": status,
        "reasons": reasons
    }
