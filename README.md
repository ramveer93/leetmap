# LeetMap



https://github.com/user-attachments/assets/16a6fe4f-471a-46cb-a422-827405b7f069




A web application designed to help software engineers prepare for technical interviews by cataloging, analyzing, and filtering LeetCode problems encountered in interviews at top tech companies. 

The application parses real interview frequency data and displays it in a clean, interactive dashboard. Users can filter by company (Google, Meta, Netflix, Amazon, ByteDance, J.P. Morgan, etc.), difficulty levels, time ranges, and search keywords. It also supports tracking custom interview questions.

---

## 🏗️ Architecture

The project is structured as a clean, standalone monorepo:

```
leetmap/
├── backend/                  # FastAPI Python Backend
│   ├── app.py                # Main API entrypoint
│   ├── parser.py             # Data parser for CSV data-sources
│   ├── database/             # Generated database JSON files
│   └── requirements.txt      # Python dependencies
│
├── frontend/                 # React + TypeScript Frontend (TanStack Start / Vite)
│   ├── src/                  # Components, hooks, routes, and views
│   ├── public/               # Static assets
│   ├── package.json          # Node dependencies & npm scripts
│   └── vite.config.ts        # Vite configuration
│
├── data-sources/             # Raw interview frequency CSV files
│   ├── repo1/                # Source repositories per company
│   └── repo2/                # Additional CSV sources
│
└── start.sh                  # Orchestration script to run both servers
```

---

## ✨ Features

- **Company Filtering**: Select from major tech companies with normalized representations (e.g., Meta/Facebook, Google, Netflix, Amazon, ByteDance).
- **Timeframe Analysis**: View questions based on when they were asked (30 days, 3 months, 6 months, all-time).
- **Custom Question Registry**: Create, edit, and keep track of custom questions encountered during actual interviews.
- **Topics & Tags**: Filter questions dynamically by data structures or algorithms (e.g., Graphs, Arrays, Dynamic Programming).
- **Seamless Local Launcher**: Launch both the frontend and backend servers with a single bash command.

---

## 🚀 Getting Started

### Prerequisites

- **Python**: `python3` (v3.9 or higher recommended)
- **Node.js & npm**: Node.js (v18 or higher recommended) and `npm` (or `bun`)

### Quick Start (One Command)

You can launch both the frontend and backend servers using the helper script in the root directory:

```bash
chmod +x start.sh
./start.sh
```

This will automatically:
1. Start the FastAPI backend on `http://localhost:5001`.
2. Start the Vite React development server.
3. Open your terminal logs, prompting you to navigate to the client URL (usually `http://localhost:5173` or `http://localhost:8080`).

---

## 🛠️ Manual Configuration & Scripts

### 1. Backend setup

If you prefer to run the backend manually, navigate to the `backend/` directory:

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run the parser to generate the database from data-sources
python3 -c "import parser; parser.run_parser()"

# Start the FastAPI dev server
python3 -m uvicorn app:app --port 5001 --host 0.0.0.0
```

### 2. Frontend Setup

To run the React web client manually, navigate to the `frontend/` directory:

```bash
cd frontend

# Install dependencies (if not already done)
npm install

# Start the Vite development server
npm run dev

# Build the client for production
npm run build
```

---

## 📊 How the Data Parser Works

The backend includes a data parsing module (`backend/parser.py`) that aggregates company-specific LeetCode spreadsheets. 
- It reads CSV files (e.g., `1. Thirty Days.csv`, `2. Three Months.csv`, `3. Six Months.csv`, etc.) located inside the root `data-sources/` folder.
- It normalizes company names, maps problem links to slugs, and outputs a consolidated JSON database to `backend/database/leetcode_db.json`.
- The FastAPI server serves this aggregated data via the `/api/problems` endpoint.
