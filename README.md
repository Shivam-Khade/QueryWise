# QueryWise — Intelligent Database Query Optimizer & Index Advisor

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg?style=flat&logo=React&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5+-646CFF.svg?style=flat&logo=Vite&logoColor=white)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1.svg?style=flat&logo=PostgreSQL&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3+-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**QueryWise** is a developer tool built for teams without a dedicated DBA. It helps detect slow SQL queries, understand execution plans in plain English, and receive safe, explainable index recommendations—without risking production data or modifying existing schemas.

It connects to a realistic **12-table PostgreSQL e-commerce database** and turns raw `EXPLAIN` / `EXPLAIN ANALYZE` outputs into visual insights, AI-powered breakdowns, and index simulations.

---

## Key Features

- **Query Health Score (0–100)**: Instant rating evaluating sequential scans, heavy sorts, expensive nested loops, and disk spills.
- **Visual Plan Tree**: Interactive node-by-node execution plan with cost percentages, timing stats, and operation warnings.
- **Index Advisor**: Identifies unindexed `WHERE`, `JOIN`, `ORDER BY`, and `GROUP BY` columns while avoiding redundant or duplicate indexes.
- **What-If Index Simulator**: Estimates cost reduction for proposed indexes using hypothetical execution models without executing DDL changes.
- **Database Explorer**: Interactive schema viewer displaying tables, column data types, foreign keys, and active indexes.
- **AI Query Assistant**: Integrated conversational assistant powered by Google Gemini (or OpenAI) to translate plans into plain English and suggest optimizations.
- **Query History & Dashboard**: Tracks analyzed queries, execution metrics, and table analysis frequencies over time.

---

## Architecture

```
┌────────────────────────────────┐
│   React Frontend (Vite)        │   Port: 5173
│   Tailwind CSS + Recharts      │
└───────────────┬────────────────┘
                │ HTTP / REST
┌───────────────▼────────────────┐
│   FastAPI Backend (Python)     │   Port: 8000
│   SQLAlchemy + psycopg2 + AI   │
└───────────────┬────────────────┘
                │
┌───────────────▼────────────────┐
│   PostgreSQL Database          │   Port: 5432
│   - Target DB: 12-table demo   │
│   - App DB: Query history/logs │
└────────────────────────────────┘
```

### The 12-Table Demo Schema

The included sample dataset simulates a realistic retail ecosystem with intentionally unindexed filter columns to test query optimization:
- `departments`, `employees`
- `customers`, `addresses`
- `categories`, `suppliers`, `products`
- `orders`, `order_items`, `payments`, `shipments`, `reviews`

---

## Project Structure

```
SmartQueryAnalyzer/
├── .gitignore
├── README.md
└── querywise/
    ├── render.yaml              # Render deployment blueprint
    ├── docker-compose.yml       # 1-command local container orchestration
    │
    ├── database/
    │   ├── schema.sql           # 12-table target database DDL
    │   ├── seed.sql             # Realistic sample seed records
    │   └── app_schema.sql       # QueryWise history & metadata tables
    │
    ├── backend/
    │   ├── app/
    │   │   ├── main.py          # FastAPI application & CORS configuration
    │   │   ├── database.py      # Database connections (SQLAlchemy & psycopg2)
    │   │   ├── scheduler.py     # Background slow query scanning
    │   │   ├── api/             # API routes (analyze, history, explorer, chat)
    │   │   ├── services/        # Query analysis, index advisor, AI generator
    │   │   ├── models/          # SQLAlchemy ORM models
    │   │   └── schemas/         # Pydantic schemas
    │   ├── requirements.txt
    │   └── .env.example
    │
    └── frontend/
        ├── src/
        │   ├── pages/           # Dashboard, Analyzer, Explorer, History, Chat
        │   ├── components/      # PlanTree, Sidebar, Card, HealthBadge
        │   └── services/api.js  # Axios API client
        ├── package.json
        ├── vercel.json          # Vercel SPA routing configuration
        └── .env.example
```

---

## Getting Started Locally

### Option A: Run with Docker Compose (Recommended)

Requires Docker Desktop installed and running:

```bash
cd querywise
docker compose up --build
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **To Stop**: Press `Ctrl + C`, then run `docker compose down`.

---

### Option B: Run Locally Without Docker

#### 1. Setup PostgreSQL Database
Ensure PostgreSQL is running locally on port 5432:

```bash
cd querywise

# Create database
psql -U postgres -c "CREATE DATABASE querywise_demo;"

# Load schema, seed data, and application tables
psql -U postgres -d querywise_demo -f database/schema.sql
psql -U postgres -d querywise_demo -f database/seed.sql
psql -U postgres -d querywise_demo -f database/app_schema.sql
```

#### 2. Start Backend (FastAPI)

```bash
cd querywise/backend

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Start server
uvicorn app.main:app --reload --port 8000
```

#### 3. Start Frontend (React + Vite)

In a new terminal:

```bash
cd querywise/frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Deployment (Free Cloud Tiers)

QueryWise is pre-configured for free cloud deployment:

### 1. Database (Neon or Supabase)
1. Create a free PostgreSQL project on [Neon](https://neon.tech) or [Supabase](https://supabase.com).
2. Open the SQL Editor in the web console and execute:
   - `querywise/database/schema.sql`
   - `querywise/database/seed.sql`
   - `querywise/database/app_schema.sql`
3. Copy your database connection string.

### 2. Backend (Render)
1. Create a free Web Service on [Render](https://render.com) connected to your GitHub repository.
2. Set **Root Directory** to `querywise/backend`.
3. Set **Build Command** to `pip install -r requirements.txt`.
4. Set **Start Command** to `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
5. Set environment variables:
   - `TARGET_DATABASE_URL`: Your Neon/Supabase connection string
   - `APP_DATABASE_URL`: Your Neon/Supabase connection string
   - `AI_PROVIDER`: `gemini`
   - `GEMINI_API_KEY`: Your Google AI Gemini API key
   - `FRONTEND_ORIGIN`: Your frontend URL (e.g., `https://your-app.vercel.app`)

### 3. Frontend (Vercel)
1. Import your repository into [Vercel](https://vercel.com).
2. Set **Root Directory** to `querywise/frontend`.
3. Add Environment Variable:
   - `VITE_API_URL`: Your deployed Render backend URL (e.g., `https://querywise-backend.onrender.com`).
4. Deploy! `frontend/vercel.json` ensures all client-side routes redirect properly.

---

## License

MIT License. Feel free to use and adapt QueryWise for your database optimization workflows.
