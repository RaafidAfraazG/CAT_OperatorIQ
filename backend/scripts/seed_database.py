import os
import sys
import pandas as pd
import numpy as np
from datetime import datetime, date

# Add backend root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import SessionLocal
from app.db.models import (
    Site, Operator, Machine, Task, TaskHistory, Telemetry,
    SafetyEvent, Incident, FuelUsage, OperatorBehavior, Environment,
    TrainingModule, TrainingProgress, DailyTask, Alert
)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "generated")

def clean_row(row_dict):
    """Clean NaN/None/nat values in dictionary to None or proper python primitives."""
    cleaned = {}
    for k, v in row_dict.items():
        if pd.isna(v) or v is np.nan or v is None:
            cleaned[k] = None
        elif isinstance(v, (np.integer, np.int64, np.int32)):
            cleaned[k] = int(v)
        elif isinstance(v, (np.floating, np.float64, np.float32)):
            cleaned[k] = float(v)
        elif isinstance(v, (np.bool_, bool)):
            cleaned[k] = bool(v)
        else:
            cleaned[k] = v
    return cleaned

def parse_datetime(val):
    if pd.isna(val) or val is None or str(val).strip() == "":
        return None
    if isinstance(val, (datetime, pd.Timestamp)):
        return val.to_pydatetime()
    return pd.to_datetime(val).to_pydatetime()

def parse_date(val):
    if pd.isna(val) or val is None or str(val).strip() == "":
        return None
    if isinstance(val, date) and not isinstance(val, datetime):
        return val
    if isinstance(val, (datetime, pd.Timestamp)):
        return val.date()
    return pd.to_datetime(val).date()

def seed_database():
    print("=== STARTING FAST BULK SEEDING FROM CSV FILES ===", flush=True)
    print(f"Reading CSV dataset from: {DATA_DIR}\n", flush=True)

    db = SessionLocal()

    try:
        # 1. Sites
        sites_df = pd.read_csv(os.path.join(DATA_DIR, "sites.csv"))
        site_dicts = [clean_row(r) for r in sites_df.to_dict(orient="records")]
        db.bulk_insert_mappings(Site, site_dicts)
        db.commit()
        print(f"[LOADED] sites.csv -> {len(site_dicts)} rows", flush=True)

        # 2. Operators
        ops_df = pd.read_csv(os.path.join(DATA_DIR, "operators.csv"))
        op_dicts = [clean_row(r) for r in ops_df.to_dict(orient="records")]
        db.bulk_insert_mappings(Operator, op_dicts)
        db.commit()
        print(f"[LOADED] operators.csv -> {len(op_dicts)} rows", flush=True)

        # 3. Training Modules
        tm_df = pd.read_csv(os.path.join(DATA_DIR, "training_modules.csv"))
        tm_dicts = [clean_row(r) for r in tm_df.to_dict(orient="records")]
        db.bulk_insert_mappings(TrainingModule, tm_dicts)
        db.commit()
        print(f"[LOADED] training_modules.csv -> {len(tm_dicts)} rows", flush=True)

        # 4. Machines
        m_df = pd.read_csv(os.path.join(DATA_DIR, "machines.csv"))
        m_dicts = [clean_row(r) for r in m_df.to_dict(orient="records")]
        db.bulk_insert_mappings(Machine, m_dicts)
        db.commit()
        print(f"[LOADED] machines.csv -> {len(m_dicts)} rows", flush=True)

        # 5. Tasks
        t_df = pd.read_csv(os.path.join(DATA_DIR, "tasks.csv"))
        t_records = t_df.to_dict(orient="records")
        valid_task_ids = set(t_df['task_id'].dropna().unique())
        for r in t_records:
            r['scheduled_start'] = parse_datetime(r['scheduled_start'])
            r['scheduled_end'] = parse_datetime(r['scheduled_end'])
        t_dicts = [clean_row(r) for r in t_records]
        db.bulk_insert_mappings(Task, t_dicts)
        db.commit()
        print(f"[LOADED] tasks.csv -> {len(t_dicts)} rows", flush=True)

        # 6. Task History
        th_df = pd.read_csv(os.path.join(DATA_DIR, "task_history.csv"))
        th_dicts = [clean_row(r) for r in th_df.to_dict(orient="records")]
        db.bulk_insert_mappings(TaskHistory, th_dicts)
        db.commit()
        print(f"[LOADED] task_history.csv -> {len(th_dicts)} rows", flush=True)

        # 7. Environment
        env_df = pd.read_csv(os.path.join(DATA_DIR, "environment.csv"))
        env_records = env_df.to_dict(orient="records")
        for r in env_records:
            r['timestamp'] = parse_datetime(r['timestamp'])
        env_dicts = [clean_row(r) for r in env_records]
        db.bulk_insert_mappings(Environment, env_dicts)
        db.commit()
        print(f"[LOADED] environment.csv -> {len(env_dicts)} rows", flush=True)

        # 8. Telemetry
        telem_df = pd.read_csv(os.path.join(DATA_DIR, "telemetry.csv"))
        telem_records = telem_df.to_dict(orient="records")
        total_telem = len(telem_records)
        batch_size = 20000
        for i in range(0, total_telem, batch_size):
            batch = telem_records[i:i + batch_size]
            for r in batch:
                r['timestamp'] = parse_datetime(r['timestamp'])
            batch_dicts = [clean_row(r) for r in batch]
            db.bulk_insert_mappings(Telemetry, batch_dicts)
            db.commit()
            print(f"   - telemetry inserted {min(i + batch_size, total_telem)} / {total_telem} rows...", flush=True)
        print(f"[LOADED] telemetry.csv -> {total_telem} rows", flush=True)

        # 9. Safety Events
        se_df = pd.read_csv(os.path.join(DATA_DIR, "safety_events.csv"))
        se_records = se_df.to_dict(orient="records")
        for r in se_records:
            r['timestamp'] = parse_datetime(r['timestamp'])
        se_dicts = [clean_row(r) for r in se_records]
        db.bulk_insert_mappings(SafetyEvent, se_dicts)
        db.commit()
        print(f"[LOADED] safety_events.csv -> {len(se_dicts)} rows", flush=True)

        # 10. Incidents
        inc_df = pd.read_csv(os.path.join(DATA_DIR, "incidents.csv"))
        inc_records = inc_df.to_dict(orient="records")
        for r in inc_records:
            r['timestamp'] = parse_datetime(r['timestamp'])
        inc_dicts = [clean_row(r) for r in inc_records]
        db.bulk_insert_mappings(Incident, inc_dicts)
        db.commit()
        print(f"[LOADED] incidents.csv -> {len(inc_dicts)} rows", flush=True)

        # 11. Fuel Usage
        fu_df = pd.read_csv(os.path.join(DATA_DIR, "fuel_usage.csv"))
        fu_records = fu_df.to_dict(orient="records")
        for r in fu_records:
            r['timestamp'] = parse_datetime(r['timestamp'])
        fu_dicts = [clean_row(r) for r in fu_records]
        db.bulk_insert_mappings(FuelUsage, fu_dicts)
        db.commit()
        print(f"[LOADED] fuel_usage.csv -> {len(fu_dicts)} rows", flush=True)

        # 12. Operator Behavior
        ob_df = pd.read_csv(os.path.join(DATA_DIR, "operator_behavior.csv"))
        ob_records = ob_df.to_dict(orient="records")
        for r in ob_records:
            r['timestamp'] = parse_datetime(r['timestamp'])
        ob_dicts = [clean_row(r) for r in ob_records]
        db.bulk_insert_mappings(OperatorBehavior, ob_dicts)
        db.commit()
        print(f"[LOADED] operator_behavior.csv -> {len(ob_dicts)} rows", flush=True)

        # 13. Training Progress
        tp_df = pd.read_csv(os.path.join(DATA_DIR, "training_progress.csv"))
        tp_records = tp_df.to_dict(orient="records")
        for r in tp_records:
            r['assigned_date'] = parse_date(r['assigned_date'])
            r['completion_date'] = parse_date(r['completion_date'])
        tp_dicts = [clean_row(r) for r in tp_records]
        db.bulk_insert_mappings(TrainingProgress, tp_dicts)
        db.commit()
        print(f"[LOADED] training_progress.csv -> {len(tp_dicts)} rows", flush=True)

        # 14. Daily Tasks (200 standalone dispatches have DT... IDs not in tasks.csv -> set task_id to None for FK safety)
        dt_df = pd.read_csv(os.path.join(DATA_DIR, "daily_tasks.csv"))
        dt_records = dt_df.to_dict(orient="records")
        for r in dt_records:
            r['date'] = parse_date(r['date'])
            r['scheduled_start'] = parse_datetime(r['scheduled_start'])
            r['scheduled_end'] = parse_datetime(r['scheduled_end'])
            if r.get('task_id') not in valid_task_ids:
                r['task_id'] = None
        dt_dicts = [clean_row(r) for r in dt_records]
        db.bulk_insert_mappings(DailyTask, dt_dicts)
        db.commit()
        print(f"[LOADED] daily_tasks.csv -> {len(dt_dicts)} rows", flush=True)

        # 15. Alerts
        al_df = pd.read_csv(os.path.join(DATA_DIR, "alerts.csv"))
        al_records = al_df.to_dict(orient="records")
        for r in al_records:
            r['timestamp'] = parse_datetime(r['timestamp'])
            if r.get('task_id') not in valid_task_ids:
                r['task_id'] = None
        al_dicts = [clean_row(r) for r in al_records]
        db.bulk_insert_mappings(Alert, al_dicts)
        db.commit()
        print(f"[LOADED] alerts.csv -> {len(al_dicts)} rows", flush=True)

        print("\n=== DATABASE SEEDING COMPLETED SUCCESSFULLY ===", flush=True)

    except Exception as e:
        db.rollback()
        print(f"\n[ERROR DURING SEEDING] {e}", flush=True)
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
