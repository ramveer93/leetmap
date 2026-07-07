# LeetMap

https://github.com/user-attachments/assets/16a6fe4f-471a-46cb-a422-827405b7f069

![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![Turso](https://img.shields.io/badge/Turso-000000?style=flat&logo=sqlite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=flat&logo=render&logoColor=white)

A web application designed to help software engineers prepare for technical interviews by cataloging, analyzing, and filtering LeetCode problems encountered in interviews at top tech companies. 

The application parses real interview frequency data, stores it in a **Turso / SQLite** database, and displays it in a clean, interactive dashboard. Users can filter by company (Google, Meta, Netflix, Amazon, ByteDance, J.P. Morgan, etc.), difficulty levels, time ranges, and search keywords. It also supports tracking custom interview questions in a dedicated portal.

---

## 🏗️ Architecture

The project is structured as a clean, standalone monorepo:

```text
leetmap/
├── backend/                  # FastAPI Python Backend
│   ├── app.py                # Main API routes (serves data from Turso/SQLite)
│   ├── parser.py             # Parses CSV sources and batch-syncs to Database
│   ├── database/             
│   │   ├── connection.py     # Database connection manager (Turso / SQLite fallback)
│   │   └── leetmap.db        # Local fallback SQLite database file (git-ignored)
│   ├── .env                  # Environment secrets for Turso (git-ignored)
│   ├── runtime.txt           # Python version pin (3.12.3) for Render deployment
│   ├── .python-version       # Python version pin for local environment manager
│   └── requirements.txt      # Python dependencies (libsql-client, python-dotenv, etc.)
│
├── frontend/                 # React + TypeScript Frontend (TanStack Start / Vite)
│   ├── src/                  # Components, hooks, routes, and views
│   │   └── routes/
│   │       ├── index.tsx     # Explorer dashboard view with skeleton loading UI
│   │       └── portal.tsx    # Custom interview registry with skeleton loading UI
│   ├── .env                  # Stores VITE_API_URL pointing to backend
│   ├── package.json          # Node dependencies & npm scripts
│   └── vite.config.ts        # Vite/Vinxi configuration
│
├── data-sources/             # Raw interview frequency CSV files
│   ├── repo1/                # Source repositories per company
│   └── repo2/                # Additional CSV sources
│
└── start.sh                  # Orchestration script to run both servers
```

---

## ✨ Features

- **Hybrid Database Layer**: Native support for **Turso Cloud Database** in production and local SQLite fallback (`leetmap.db`) for offline development.
- **Batch Processing Sync**: Parser aggregates CSV files and bulk-uploads all 3,000+ entries into Turso in efficient transaction batches.
- **Dynamic Loading Skeletons**: Responsive, shimmering placeholder cards on both pages to handle API request latencies gracefully.
- **Company Filtering**: Select from major tech companies with normalized representations (e.g., Meta/Facebook, Google, Netflix, Amazon, ByteDance).
- **Timeframe Analysis**: View questions based on when they were asked (30 days, 3 months, 6 months, all-time).
- **Custom Question Registry**: Create, edit, and keep track of custom questions encountered during actual interviews.
- **Topics & Tags**: Filter questions dynamically by data structures or algorithms (e.g., Graphs, Arrays, Dynamic Programming).
- **Seamless Local Launcher**: Launch both the frontend and backend servers with a single bash command.

---

## 🛠️ Database Setup & Configuration

The application uses `libsql-client` to manage database connections. By default, it runs in **Local Fallback Mode**.

### 1. Local Fallback Mode (No setup required)
If no environment variables are specified, the database connects to a local SQLite file at `backend/database/leetmap.db`. When you run the parser or launch the app, this file is automatically created and populated.

### 2. Cloud Turso Mode
To connect both your local and production environments to a cloud Turso database:
1. Create a database named `leetmap` in your **[Turso Console](https://turso.tech/)**.
2. Create a file named `.env` in the `backend/` directory:
   ```env
   TURSO_DATABASE_URL=https://your-database-name.turso.io
   TURSO_AUTH_TOKEN=your-jwt-auth-token
   ```
   *Note: Use the `https://` protocol prefix for secure cloud connection.*
3. Run the parser to sync your data up to the cloud:
   ```bash
   cd backend
   python3 parser.py
   ```

---

## 🚀 Getting Started Locally

### Quick Start (One Command)
Launch both servers using the helper script in the root directory:
```bash
chmod +x start.sh
./start.sh
```

This will automatically:
1. Start the FastAPI backend on `http://localhost:5001`.
2. Start the Vite React development server on `http://localhost:8081`.

---

## ☁️ Deployment

### 1. Backend Deployment (Render)
1. Set up a new **Web Service** on Render pointing to your repository.
2. Configure settings:
   * **Root Directory:** `backend`
   * **Language:** `Python`
   * **Build Command:** `pip install -r requirements.txt`
   * **Start Command:** `uvicorn app:app --host 0.0.0.0 --port $PORT`
3. Under **Environment**, add the following environment variables:
   * `TURSO_DATABASE_URL` = *(your database URL)*
   * `TURSO_AUTH_TOKEN` = *(your auth token)*
4. Deploy. Render will automatically read `runtime.txt` and use Python `3.12.3`.

### 2. Frontend Deployment (Vercel)
Vercel has native support for TanStack Start (Vinxi) SSR applications.
1. Connect your project to Vercel (e.g., using GitHub integration or the Vercel CLI).
2. Configure settings:
   * **Root Directory:** `frontend`
3. Add the following **Environment Variable**:
   * `VITE_API_URL` = `https://your-render-backend-url.onrender.com/api`
4. Deploy!
