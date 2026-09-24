# 🚧 CAT OperatorIQ

**OperatorIQ** is a Next-Generation Smart Operator Assistant designed for Caterpillar heavy machinery. It bridges the gap between human operators and machine telemetry by providing a unified, AI-driven dashboard that enhances safety, efficiency, and task management.

Built as a high-fidelity MVP, OperatorIQ integrates modern web technologies with predictive machine learning and a conversational AI assistant.

![OperatorIQ Dashboard Preview](src/assets/hero.png) *(Note: Add hero screenshot here)*

---

## ✨ Core Capabilities & HMI Domains

OperatorIQ features a cohesive embedded heavy-equipment HMI structured across five core domains:

- **DRIVE:** Current operating awareness, active shift metrics, and machine readiness.
- **WORK:** Task execution, dispatch queues, progress tracking, and ETA prediction.
- **MACHINE:** Telemetry, health monitoring, and fuel intelligence (anomalies/burn rates).
- **SAFETY:** Proximity/hazard awareness (360° sensor visualization), safety state, and active alerts.
- **ASSIST:** Contextual AI responses, operator training, and shift debrief intelligence.

### Machine Learning Intelligence Layer
- ⏱️ **Task ETA Prediction:** Estimates task completion times based on historical performance.
- ⚙️ **Machine Anomaly Detection:** Flags unusual telemetry (e.g., extreme temperatures or pressures).
- ⛽ **Fuel Anomaly Detection:** Monitors fuel burn rates against expected baselines.
- 🛡️ **Safety Risk Scoring:** Generates dynamic safety scores based on proximity sensors and seatbelt compliance.

### AI Operator Assistant
A contextual, voice-enabled AI assistant powered by Groq. It intercepts live machine context (fuel, rpm, safety, tasks) to provide factual, contextual answers to operator questions hands-free.

---

## 🛠️ Technology Stack

**Frontend:**
- React 18
- TypeScript
- Vite
- TailwindCSS (Custom Industrial Dark Theme)
- Lucide React (Icons)
- React Router DOM
- Recharts (Data Visualization)

**Backend:**
- Python 3.12+
- FastAPI
- SQLAlchemy (ORM)
- PostgreSQL
- Scikit-Learn (ML Models)
- Groq API (LLM Integration for Assistant)

---

## 🚀 Getting Started

Follow these instructions to run the OperatorIQ stack locally.

### 1. Database Setup
Ensure you have **PostgreSQL** installed and running. Create a database named `operatoriq`.

### 2. Backend Setup
Navigate to the `backend` directory and set up the Python environment:

```bash
cd backend
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate
# Activate virtual environment (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env to add your DATABASE_URL and XAI_API_KEY (Groq API Key)

# Initialize the database and seed with synthetic data
python scripts/create_tables.py
python scripts/seed_database.py

# Run the FastAPI server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
Open a new terminal window, navigate to the root directory, and start the Vite development server:

```bash
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend API documentation at `http://localhost:8000/docs`.

---

## 🏗️ Project Architecture (Phases)

This project was built iteratively:
1. **Frontend Foundation:** React UI with a bespoke industrial dark theme.
2. **Backend & Database:** FastAPI, PostgreSQL schemas, and synthetic data generation.
3. **Integration:** Wiring the React frontend to the FastAPI backend endpoints.
4. **ML Intelligence MVP:** Implementing predictive models for ETAs, fuel, safety, and machine health.
5. **AI Assistant:** Groq-powered chat and voice integration for hands-free operator assistance.
6. **Industrial HMI Redesign:** Complete transition to a strict 5-domain in-cab HMI (Drive, Work, Machine, Safety, Assist) featuring responsive real-time safety radar, fixed viewports, and context-aware AI.

---

## 📜 License
This project was built as a Hackathon MVP. 
