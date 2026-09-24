import os
import sys
import pandas as pd
from sqlalchemy import text

# Add backend root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import SessionLocal

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "generated")

tables_map = [
    ("sites", "sites.csv", "site_id"),
    ("operators", "operators.csv", "operator_id"),
    ("training_modules", "training_modules.csv", "training_id"),
    ("machines", "machines.csv", "machine_id"),
    ("tasks", "tasks.csv", "task_id"),
    ("task_history", "task_history.csv", "task_id"),
    ("environment", "environment.csv", "env_id"),
    ("telemetry", "telemetry.csv", "telemetry_id"),
    ("safety_events", "safety_events.csv", "event_id"),
    ("incidents", "incidents.csv", "incident_id"),
    ("fuel_usage", "fuel_usage.csv", "fuel_record_id"),
    ("operator_behavior", "operator_behavior.csv", "behavior_id"),
    ("training_progress", "training_progress.csv", "progress_id"),
    ("daily_tasks", "daily_tasks.csv", "daily_task_id"),
    ("alerts", "alerts.csv", "alert_id"),
]

fk_relationships = [
    ("machines", "site_id", "sites", "site_id", False),
    ("tasks", "machine_id", "machines", "machine_id", False),
    ("tasks", "operator_id", "operators", "operator_id", False),
    ("tasks", "site_id", "sites", "site_id", False),
    ("task_history", "source_task_id", "tasks", "task_id", True),
    ("telemetry", "machine_id", "machines", "machine_id", False),
    ("telemetry", "operator_id", "operators", "operator_id", False),
    ("telemetry", "task_id", "tasks", "task_id", False),
    ("telemetry", "site_id", "sites", "site_id", False),
    ("safety_events", "machine_id", "machines", "machine_id", False),
    ("safety_events", "operator_id", "operators", "operator_id", False),
    ("safety_events", "task_id", "tasks", "task_id", False),
    ("safety_events", "site_id", "sites", "site_id", False),
    ("incidents", "machine_id", "machines", "machine_id", False),
    ("incidents", "operator_id", "operators", "operator_id", False),
    ("incidents", "task_id", "tasks", "task_id", False),
    ("incidents", "site_id", "sites", "site_id", False),
    ("fuel_usage", "machine_id", "machines", "machine_id", False),
    ("fuel_usage", "operator_id", "operators", "operator_id", False),
    ("fuel_usage", "task_id", "tasks", "task_id", False),
    ("operator_behavior", "operator_id", "operators", "operator_id", False),
    ("operator_behavior", "machine_id", "machines", "machine_id", False),
    ("operator_behavior", "task_id", "tasks", "task_id", True),
    ("environment", "site_id", "sites", "site_id", False),
    ("training_progress", "operator_id", "operators", "operator_id", False),
    ("training_progress", "training_id", "training_modules", "training_id", False),
    ("daily_tasks", "machine_id", "machines", "machine_id", False),
    ("daily_tasks", "operator_id", "operators", "operator_id", False),
    ("daily_tasks", "task_id", "tasks", "task_id", True),
    ("alerts", "machine_id", "machines", "machine_id", False),
    ("alerts", "operator_id", "operators", "operator_id", True),
    ("alerts", "task_id", "tasks", "task_id", True),
]

def validate_database():
    print("=== POSTGRESQL DATABASE VALIDATION ===", flush=True)
    db = SessionLocal()
    all_passed = True

    try:
        # 1. Row Count Validation
        print("\n--- 1. ROW COUNT COMPARISON ---", flush=True)
        for tbl, csv_file, pk in tables_map:
            csv_path = os.path.join(DATA_DIR, csv_file)
            csv_rows = len(pd.read_csv(csv_path))
            db_rows = db.execute(text(f"SELECT COUNT(*) FROM {tbl}")).scalar()
            match = csv_rows == db_rows
            if not match:
                all_passed = False
            status = "MATCH" if match else "MISMATCH"
            print(f"Table: {tbl:<20} | CSV: {csv_rows:>7} | DB: {db_rows:>7} | Status: {status}", flush=True)

        # 2. Primary Key Uniqueness Check
        print("\n--- 2. PRIMARY KEY UNIQUENESS CHECK ---", flush=True)
        for tbl, _, pk in tables_map:
            dup_query = text(f"SELECT COUNT(*) FROM (SELECT {pk}, COUNT(*) FROM {tbl} GROUP BY {pk} HAVING COUNT(*) > 1) AS dups")
            dups = db.execute(dup_query).scalar()
            if dups > 0:
                all_passed = False
                print(f"[FAIL] {tbl}.{pk}: {dups} duplicate PK values found!", flush=True)
            else:
                print(f"[PASS] {tbl}.{pk}: 100% unique primary key", flush=True)

        # 3. Foreign Key Integrity Check
        print("\n--- 3. FOREIGN KEY INTEGRITY CHECK ---", flush=True)
        for c_tbl, c_col, p_tbl, p_col, nullable in fk_relationships:
            orphan_query = text(f"""
                SELECT COUNT(*) FROM {c_tbl} c
                LEFT JOIN {p_tbl} p ON c.{c_col} = p.{p_col}
                WHERE c.{c_col} IS NOT NULL AND p.{p_col} IS NULL
            """)
            orphans = db.execute(orphan_query).scalar()
            if orphans > 0:
                all_passed = False
                print(f"[FAIL] FK {c_tbl}.{c_col} -> {p_tbl}.{p_col}: {orphans} orphan records!", flush=True)
            else:
                null_note = " (nullable)" if nullable else ""
                print(f"[PASS] FK {c_tbl}.{c_col} -> {p_tbl}.{p_col}{null_note}: 0 orphans", flush=True)

        print("\n==========================================", flush=True)
        if all_passed:
            print("OVERALL DATABASE VALIDATION: PASSED", flush=True)
        else:
            print("OVERALL DATABASE VALIDATION: FAILED", flush=True)
        print("==========================================", flush=True)

    finally:
        db.close()

if __name__ == "__main__":
    validate_database()
