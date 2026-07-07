# LendIQ — Vercel Deployment Guide

**App name:** `LendIQ` — Retail Lending Intelligence
**Architecture:** Two separate Vercel projects — Backend (FastAPI) + Frontend (React/Vite)

---

## Overview

```
GitHub Repo
 ├── backend/   → Vercel Project 1: lendiq-api      (Python serverless)
 └── frontend/  → Vercel Project 2: lendiq-ui       (Vite static site)
```

The frontend calls the backend via `VITE_API_BASE_URL`. They are completely
independent Vercel deployments connected only through that environment variable.

---

## Prerequisites

- [Vercel account](https://vercel.com) (free tier works)
- [Vercel CLI](https://vercel.com/docs/cli) (optional): `npm i -g vercel`
- Code pushed to a GitHub / GitLab / Bitbucket repository

---

## Step 1 — Deploy the Backend (FastAPI API)

### 1.1 Create the Vercel project

1. Go to https://vercel.com/new
2. Import your repository
3. When asked "Which directory is your project?" → enter `backend`
4. Vercel will auto-detect it is a Python project

### 1.2 Configure the project settings

| Setting            | Value                                              |
|--------------------|----------------------------------------------------|
| Project name       | `lendiq-api`                                       |
| Root directory     | `backend`                                          |
| Build command      | *(leave blank)*                                    |
| Output directory   | *(leave blank)*                                    |
| Install command    | *(leave blank — Vercel installs from requirements.txt)* |

### 1.3 Deploy

Click **Deploy**. Vercel installs `requirements.txt` and wraps `api/index.py`
as a serverless function. All `/*` routes are forwarded to it via `vercel.json`.

Your backend URL: `https://lendiq-api.vercel.app`

> **Cold start note:** First request after inactivity takes ~3–5 s while ML
> models train. Subsequent warm requests are fast.

### 1.4 Verify

Open `https://lendiq-api.vercel.app/api/health` — expect:
```json
{ "status": "ok" }
```

Open `https://lendiq-api.vercel.app/docs` for Swagger UI.

---

## Step 2 — Deploy the Frontend (React/Vite)

### 2.1 Create the Vercel project

1. Go to https://vercel.com/new
2. Import the **same repository** again
3. When asked "Which directory?" → enter `frontend`

### 2.2 Configure the project settings

| Setting          | Value          |
|------------------|----------------|
| Project name     | `lendiq-ui`    |
| Root directory   | `frontend`     |
| Framework preset | Vite           |
| Build command    | `npm run build` |
| Output directory | `dist`         |
| Install command  | `npm install`  |

### 2.3 Environment variables — CRITICAL

Add before deploying:

| Name               | Value                              |
|--------------------|------------------------------------|
| `VITE_API_BASE_URL` | `https://lendiq-api.vercel.app`   |

Go to: Frontend Vercel project → Settings → Environment Variables → Add.
Apply to Production, Preview, and Development environments.

### 2.4 Deploy

Click **Deploy**. Vercel runs `npm run build` and serves the `dist/` folder.

Your frontend URL: `https://lendiq-ui.vercel.app`

---

## Step 3 — Update Backend CORS (recommended for production)

The backend currently allows `*`. To restrict it to your frontend only,
edit `backend/app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://lendiq-ui.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Redeploy the backend after this change.

---

## Step 4 — Custom Domain (optional)

1. Frontend: Vercel project (lendiq-ui) → Settings → Domains → add `lendiq.app`
2. Backend:  Vercel project (lendiq-api) → Settings → Domains → add `api.lendiq.app`
3. Update `VITE_API_BASE_URL` in the frontend project to `https://api.lendiq.app`
4. Update CORS `allow_origins` to your custom frontend domain

---

## Files Added for Vercel

```
backend/
├── vercel.json        ← Routes all requests to api/index.py
└── api/
    └── index.py       ← Serverless entry point (imports FastAPI app)

frontend/
├── vercel.json        ← Build config + SPA rewrite rule
└── .env.example       ← Documents VITE_API_BASE_URL
```

---

## Troubleshooting

| Problem                              | Fix                                                                 |
|--------------------------------------|---------------------------------------------------------------------|
| "Could not reach the API"            | Check `VITE_API_BASE_URL` is set and backend deployed successfully  |
| Backend 500 on first request         | Cold start — wait 5 s and retry                                     |
| CORS error in browser                | Add frontend URL to `allow_origins` in `main.py`, redeploy backend  |
| Backend 404 on all routes            | Verify `backend/vercel.json` exists with correct route rewrite      |
| Build fails: module not found        | Add missing package to `requirements.txt` and push                  |

---

## Alternative Backends (better for production ML)

Vercel has cold starts for serverless Python. For persistent, faster inference:

| Platform  | Notes                                                       |
|-----------|-------------------------------------------------------------|
| Railway   | Persistent container, no cold start, free tier available    |
| Render    | Web service, free tier with 15-min sleep                    |
| Fly.io    | Best for persistent ML, ~$3/month                           |

Frontend always stays on Vercel. Just update `VITE_API_BASE_URL` accordingly.
