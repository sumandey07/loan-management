# Loan Management System

A full-stack mortgage and loan management application with a FastAPI backend and a React + Vite frontend. It supports customer onboarding, eligibility checks, KYC/document verification, loan application tracking, offers, and admin review.

## Features

- Customer registration and login
- Eligibility screening for loan requests
- Loan application creation and updates
- Document upload and KYC verification flow
- Offer generation and application review
- Admin dashboard for customer and application management
- SQLite-based persistence for local development
- LLM-powered risk/offer assessment hooks

## Project structure

- `backend/` — FastAPI API server, database models, routes, and services
- `frontend/` — React app for customer and admin web experience
- `run-local.ps1` — quick local startup helper for both backend and frontend

## Tech stack

- Backend: Python, FastAPI, SQLModel, SQLAlchemy
- Frontend: React, Vite, JavaScript
- Database: SQLite by default for local development
- AI: LangChain + Google Generative AI (Gemini) integration in backend

## Prerequisites

Before running locally, install:

- Python 3.11+
- Node.js 18+
- npm
- Git

## Setup

1. Open a terminal in the project root.
2. Create and activate a backend virtual environment:

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

3. Install frontend dependencies:

```powershell
cd ..\frontend
npm install
```

4. Add environment variables for the backend if needed. Create a `.env` file inside `backend/` with the following minimum settings:

```env
DATABASE_URL=sqlite:///mortgage.db
GOOGLE_API_KEY=your_google_api_key_here
```

If you are using another setup, adjust `DATABASE_URL` accordingly.

## Local run

### Option 1: Run both services manually

Backend:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Frontend:

```powershell
cd frontend
npm run dev -- --host 0.0.0.0
```

Then open:

- Frontend: http://localhost:5173
- Backend API docs: http://localhost:8000/docs

### Option 2: Use the included local startup script

From the repo root:

```powershell
./run-local.ps1
```

This starts the backend and frontend in separate PowerShell windows.

## Seed demo data

To populate default admin users and collateral pricing data:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python seed_admin.py
python seed.py
```

Default admin credentials created by the project:

- Username: `admin1` / `admin2`
- Password: `admin12` / `admin13`

## Important notes

- The frontend currently targets `http://localhost:8000` for API calls.
- The app uses SQLite by default for local development, which keeps state in the `backend/` folder.
- LLM-powered routes will require a valid Google API key in `backend/.env`.
- If you change the backend port or host, update the frontend fetch URLs in `frontend/src` accordingly.

## Useful commands

Run backend health checks or API docs:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Build frontend for production:

```powershell
cd frontend
npm run build
```

Preview production frontend build:

```powershell
cd frontend
npm run preview -- --host 0.0.0.0
```

## Troubleshooting

- If Python packages fail to install, ensure you are using Python 3.11.
- If the frontend cannot connect to the backend, verify the backend is running on port 8000.
- If the LLM features fail, confirm `GOOGLE_API_KEY` exists in `backend/.env` and is valid.
- If the database is not initialized, run the seed scripts once.

## License

This project is intended for local development and demonstration purposes.
