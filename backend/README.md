# OperatorIQ Backend

PostgreSQL database & FastAPI foundation for OperatorIQ companion system.

## Setup Instructions

### 1. Database Setup
Ensure PostgreSQL is running locally and database `operatoriq` exists:
```bash
psql -U postgres -c "CREATE DATABASE operatoriq;"
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and set your credentials:
```env
DATABASE_URL=postgresql+psycopg://postgres@127.0.0.1/operatoriq
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Create Tables
```bash
python scripts/create_tables.py
```

### 5. Seed Dataset
```bash
python scripts/seed_database.py
```

### 6. Validate Database
```bash
python scripts/validate_database.py
```

### 7. Run FastAPI Server
```bash
uvicorn app.main:app --reload --port 8000
```
Health Check: `http://localhost:8000/health`
