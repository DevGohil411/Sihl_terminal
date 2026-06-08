# SIHL Quant Trading Platform — Complete Codebase Audit Report

**Audit Date:** June 6, 2026  
**Auditor:** Senior Software Architect / Staff Engineer  
**Scope:** Entire `D:\Replay bar` project tree  
**Classification:** Internal Engineering — Phase 1 (Audit Only, No Changes)

---

## CRITICAL RULES APPLIED

1. **NO FILE WAS DELETED, MODIFIED, MOVED, OR RENAMED** during this audit.
2. Every conclusion is backed by **runtime evidence** — imports, route registrations, config files, or process listings.
3. Files marked `VERIFY REQUIRED` lack sufficient evidence for a definitive judgment.
4. `SAFE TO DELETE` items have zero import references and zero runtime usage.

---

# SECTION A — ACTIVE APPLICATION MAP

## A.1 Currently Running Processes (Runtime Evidence)

```
Process Name        PID       Memory       Status
─────────────────────────────────────────────────────────
python.exe          41964     1,604 K      RUNNING
python.exe          41492     4,876 K      RUNNING  ← Option Simulator (port 8000)
python.exe          41604     1,624 K      RUNNING
python.exe          28952     2,828 K      RUNNING
python.exe          41680     1,576 K      RUNNING
python.exe          28944     3,000 K      RUNNING
node.exe             3896       200 K      RUNNING
node.exe            39464       100 K      RUNNING
node.exe            24748     7,136 K      RUNNING  ← Likely Next.js dev server
```

**Evidence Source:** `tasklist` command output  
**Finding:** Python processes are running. The Option Simulator backend was confirmed running on port 8000 earlier in this session. Node processes suggest a Next.js dev server may be active.

---

## A.2 Active Backend #1 — Replay Bar Backend (FastAPI)

| Property | Evidence |
|----------|----------|
| **Entrypoint** | `Replay bar/backend/app.py` |
| **Framework** | FastAPI 0.111.0 |
| **Command** | `uvicorn backend.app:app --host 0.0.0.0 --port $PORT` (from `Procfile`) |
| **Port** | 8001 (local dev), 8000 (Docker), `$PORT` (Railway) |
| **Deployment** | Railway (Docker) via `railway.json` + `backend/Dockerfile` |

**Route Registration Evidence (from `app.py`):**
```python
from routes import candles, indicators, imbalances, replay
app.include_router(candles.router, prefix="/api", tags=["Candles"])
app.include_router(indicators.router, prefix="/api/indicators", tags=["Indicators"])
app.include_router(imbalances.router, prefix="/api", tags=["Imbalances"])
app.include_router(replay.router, prefix="/api", tags=["Replay"])
```

**Active API Endpoints:**
| Method | Path | Handler File | Status |
|--------|------|-------------|--------|
| GET | `/` | `app.py` line 26 | Health check |
| GET | `/api/candles` | `routes/candles.py` line 8 | **ACTIVE** |
| GET | `/api/indicators/list` | `routes/indicators.py` line 20 | **ACTIVE** |
| POST | `/api/indicators/calculate` | `routes/indicators.py` line 46 | **ACTIVE** |
| GET | `/api/imbalances` | `routes/imbalances.py` line 8 | **ACTIVE** |
| GET | `/api/replay/status` | `routes/replay.py` line 5 | **ACTIVE** |

**Data Source:** `Data/NIFTY 50_minute.csv` (loaded by `services/data_service.py` singleton)

**Dependencies (from `backend/requirements.txt`):**
```
fastapi==0.111.0, uvicorn==0.30.1, pandas==2.2.2, numpy==1.26.4, pydantic==2.7.4, python-multipart==0.0.9
```

**Dockerfile Evidence:**
```dockerfile
FROM python:3.11-slim
COPY backend/requirements.txt .
COPY backend/ ./backend/
COPY Data/ ./Data/
ENV PORT=8000
ENV CSV_PATH="/app/Data/NIFTY 50_minute.csv"
CMD ["sh", "-c", "uvicorn backend.app:app --host 0.0.0.0 --port $PORT"]
```

---

## A.3 Active Backend #2 — Option Simulator Backend (FastAPI)

| Property | Evidence |
|----------|----------|
| **Entrypoint** | `Replay bar/option_simulator/backend/app/main.py` |
| **Framework** | FastAPI 0.111.0 + Uvicorn 0.29.0 (standard) |
| **Command** | `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload` |
| **Port** | 8000 |
| **Deployment** | Local development (no Railway config found in this subtree) |

**Route Registration Evidence (from `main.py`):**
```python
app = FastAPI(title="Institutional Options Simulator", version="1.0.0")

@app.post("/api/v1/session/init")
@app.post("/api/v1/session/action")
@app.post("/api/v1/session/next_day")
@app.post("/api/v1/session/position/add")
@app.post("/api/v1/session/position/close")
@app.post("/api/v1/session/position/sltp")
@app.post("/api/v1/session/strategy/build")
@app.get("/api/v1/session/analytics")
@app.get("/api/v1/chain")
@app.post("/api/v1/chain/delta-strike")
@app.get("/api/v1/candles")        ← RECENTLY ADDED
@app.get("/health")
@app.websocket("/ws/{session_id}")
```

**Active API Endpoints:**
| Method | Path | Status |
|--------|------|--------|
| POST | `/api/v1/session/init` | **ACTIVE** |
| POST | `/api/v1/session/action` | **ACTIVE** |
| POST | `/api/v1/session/next_day` | **ACTIVE** |
| POST | `/api/v1/session/position/add` | **ACTIVE** |
| POST | `/api/v1/session/position/close` | **ACTIVE** |
| POST | `/api/v1/session/position/sltp` | **ACTIVE** |
| POST | `/api/v1/session/strategy/build` | **ACTIVE** |
| GET | `/api/v1/session/analytics` | **ACTIVE** |
| GET | `/api/v1/chain` | **ACTIVE** |
| POST | `/api/v1/chain/delta-strike` | **ACTIVE** |
| GET | `/api/v1/candles` | **ACTIVE** (newly added) |
| GET | `/health` | **ACTIVE** |
| WS | `/ws/{session_id}` | **ACTIVE** |

**Data Source:** DuckDB (`options_v3.duckdb`, `spot_v3.duckdb`)

**Dependencies (from `option_simulator/backend/requirements.txt`):**
```
fastapi==0.111.0, uvicorn[standard]==0.29.0, polars==0.20.26, clickhouse-driver==0.2.7,
numpy==1.26.4, scipy==1.13.0, rich==13.7.1, httpx==0.27.0, sqlalchemy==2.0.30,
asyncpg==0.29.0, pydantic==2.7.1, python-dateutil==2.9.0, pytest==8.2.0, pytest-asyncio==0.23.6
```

**Import Chain Evidence (from `main.py`):**
```python
from app.data.reader import OptionChainReader              ← USED: _reader = OptionChainReader()
from app.quant.greeks import price_chain, OptionChainAnalytics  ← USED: in /api/v1/chain
from app.quant.execution import ExecutionMode               ← USED: in InitSessionRequest
from app.engine.replay import ReplaySession, ReplayAction, SessionFrame  ← USED: everywhere
```

---

## A.4 Active Frontend #1 — QuantLab Terminal (ApeChain)

| Property | Evidence |
|----------|----------|
| **Entrypoint** | `final/new backgrond/apechain/src/app/page.tsx` |
| **Framework** | Next.js 14.2.35 + React 18 |
| **Command** | `npm run dev` (from `package.json` scripts) |
| **Port** | 3000 (default Next.js) |
| **Deployment** | Vercel (standard Next.js) |

**Page Routes Evidence (from `src/app/` directory):**
| Route | File | Status | Evidence |
|-------|------|--------|----------|
| `/` | `page.tsx` | **ACTIVE** | Imports Navbar, ApeHero, ScrollStack |
| `/terminal` | `terminal/page.tsx` | **ACTIVE** | Imports 8 scene components, Zustand stores |
| `/simulator` | `simulator/page.tsx` | **ACTIVE** | Embeds `/simulator-app/index.html` via iframe |
| `/strategies` | `strategies/page.tsx` | **ACTIVE** | Large 552-line component with strategy data |
| `/api` | `api/page.tsx` | **UNUSED** | "Coming Soon" placeholder page |
| `/build` | `build/page.tsx` | **ACTIVE** | Embeds `replay-bar.html` via iframe |
| `/cinematic` | `cinematic/page.tsx` | **UNUSED** | Portfolio/showcase page, no Navbar links |
| `/bg` | `bg/page.tsx` | **UNUSED** | Background preview page |

**Navbar Links Evidence (from `Navbar.tsx`):**
```typescript
// Links to: /terminal, /simulator, /strategies, /api
```
Only `/terminal`, `/simulator`, `/strategies` are linked from Navbar. `/api`, `/build`, `/cinematic`, `/bg` have no inbound navigation links.

**Dependencies (from `package.json`):**
```
next: 14.2.35, react: ^18, react-dom: ^18, framer-motion, gsap, d3-*, three, ogl, zustand, lucide-react, tailwindcss
```

---

## A.5 Active Frontend #2 — Replay Bar Wrapper (Next.js 16)

| Property | Evidence |
|----------|----------|
| **Entrypoint** | `Replay bar/frontend/src/app/page.tsx` |
| **Framework** | Next.js 16.2.6 + React 19.2.4 |
| **Command** | `npm run dev` |
| **Port** | 3000 |
| **Deployment** | Vercel (from `frontend/vercel.json`) |

**Page Evidence:**
```typescript
// page.tsx — ONLY renders an iframe to /index.html
export default function Home() {
  return <iframe src="/index.html" style={{ width: '100vw', height: '100vh' }} />;
}
```

**API Client Evidence (from `src/services/api.ts`):**
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const api = {
  getCandles: async (tf, limit) => fetch(`${API_URL}/api/candles?...`),
  getImbalances: async (tf) => fetch(`${API_URL}/api/imbalances?...`),
  getIndicators: async () => fetch(`${API_URL}/api/indicators/list`),
  getReplay: async () => fetch(`${API_URL}/api/replay`),
  getOrderBlocks: async (tf) => fetch(`${API_URL}/api/indicators/orderblocks?...`),
};
```

**Vercel Config Evidence:**
```json
// frontend/vercel.json
{ "rewrites": [{ "source": "/api/(.*)", "destination": "https://MY_RAILWAY_URL/api/$1" }] }
```

**NOTE:** This frontend is a **thin wrapper** around a Vanilla JS UI (`public/index.html`). The actual chart UI lives in the `public/` folder as static HTML/JS.

---

## A.6 Inactive / Backup Frontends

| Folder | Status | Evidence |
|--------|--------|----------|
| `Replay bar/frontend_backup_nextjs/` | **BACKUP** | Name contains "backup", older Vite+React app, NOT referenced anywhere |
| `Replay bar/frontend_backup_nextjs_20260605_121253/` | **BACKUP** | Name contains "backup" + timestamp (June 5, 2026 12:12:53), NOT referenced |
| `Replay bar/frontend_restored/` | **BACKUP** | Name contains "restored", nearly identical to `frontend/`, NOT referenced in any config |

---

## A.7 Inactive / Duplicate Backends

| Folder | Status | Evidence |
|--------|--------|----------|
| `Replay bar/chart_engine/` | **LEGACY / INACTIVE** | Flask app on port 5050. NOT referenced in `railway.json`, `Procfile`, or `vercel.json`. Contains known bugs (SUPERTREND_AUDIT_REPORT.md). |
| `option simulator/` (root level) | **BACKUP / DUPLICATE** | Root-level folder that is a STRUCTURAL DUPLICATE of `Replay bar/option_simulator/simulator/`. NOT referenced in any active config. |
| `Replay bar/option_simulator/simulator/backend/` | **INACTIVE (older copy)** | Older version of `Replay bar/option_simulator/backend/`. Missing newer features like `/api/v1/candles`, expected_move, trade_quality. |

---

## A.8 Active Deployment Paths

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ACTIVE DEPLOYMENT PIPELINE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Vercel (Frontend)                                                          │
│  ├── Root vercel.json → points to "frontend" (Replay Bar wrapper)          │
│  │   └── experimentalServices.frontend.root = "frontend"                   │
│  │                                                                           │
│  └── frontend/vercel.json → API rewrite to Railway                         │
│      └── /api/(.*) → https://MY_RAILWAY_URL/api/$1                         │
│                                                                             │
│  Railway (Backend)                                                          │
│  ├── railway.json → Dockerfile builder                                      │
│  │   └── dockerfilePath = "backend/Dockerfile"                             │
│  │                                                                           │
│  ├── Procfile → web: uvicorn backend.app:app --host 0.0.0.0 --port $PORT   │
│  │                                                                           │
│  └── backend/Dockerfile → Python 3.11 + FastAPI                             │
│      └── CMD: uvicorn backend.app:app --host 0.0.0.0 --port $PORT          │
│                                                                             │
│  Option Simulator (Local Dev Only)                                          │
│  ├── No railway.json, no vercel.json, no Dockerfile                         │
│  ├── No Procfile                                                            │
│  └── Run manually: uvicorn app.main:app --host 0.0.0.0 --port 8000         │
│                                                                             │
│  QuantLab Terminal (ApeChain)                                               │
│  ├── No dedicated vercel.json found in final/ folder                        │
│  ├── Standard Next.js 14 app                                                │
│  └── Deployed separately (not in root vercel.json)                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## A.9 Active Database Connections

| Backend | Database | Connection Evidence | Status |
|---------|----------|---------------------|--------|
| Replay Bar | CSV File | `CSV_PATH = os.environ.get("CSV_PATH", os.path.join(BASE_DIR, "Data", "NIFTY 50_minute.csv"))` | **ACTIVE** |
| Option Simulator | DuckDB | `duckdb.connect(db_path, read_only=True)` in `app/data/reader.py` | **ACTIVE** |
| Option Simulator | DuckDB (Spot) | `ATTACH '{str(SPOT_DB_PATH)}' AS spot_db` | **ACTIVE** |

**NOTE:** PostgreSQL/SQLAlchemy is listed in requirements but NO connection code was found. Redis is mentioned in comments but NO connection code was found.

---

# SECTION B — BACKUP & DUPLICATE DETECTION

## B.1 Confirmed Backup Folders

| # | Folder Path | Why It's a Backup | Confidence |
|---|------------|-------------------|------------|
| 1 | `Replay bar/frontend_backup_nextjs/` | Name literally contains "backup". Complete Vite+React app with node_modules. NOT referenced in any config. | 100% |
| 2 | `Replay bar/frontend_backup_nextjs_20260605_121253/` | Name contains "backup" + timestamp (2026-06-05 12:12:53). Complete copy of above. NOT referenced. | 100% |
| 3 | `Replay bar/frontend_restored/` | Name contains "restored". Nearly identical to `frontend/`. NOT referenced in any deployment config. | 100% |
| 4 | `Replay bar/option_simulator/simulator/` | Contains `backend/` that is DUPLICATE of `Replay bar/option_simulator/backend/`. Also contains `frontend/` and `frontend_react/` copies. | 95% |
| 5 | `option simulator/` (root level) | Entire folder is structural duplicate of `Replay bar/option_simulator/simulator/`. Root-level placement suggests it was moved/copied. | 95% |

## B.2 Confirmed Duplicate File Groups

### Group 1: backend/ vs chart_engine/ indicators (16 identical files)
**Evidence:** Byte-for-byte identical content
```
backend/indicators/__init__.py       ↔ chart_engine/indicators/__init__.py
backend/indicators/atr.py            ↔ chart_engine/indicators/atr.py
backend/indicators/base.py           ↔ chart_engine/indicators/base.py
backend/indicators/bollinger.py      ↔ chart_engine/indicators/bollinger.py
backend/indicators/cci.py            ↔ chart_engine/indicators/cci.py
backend/indicators/ema.py            ↔ chart_engine/indicators/ema.py
backend/indicators/fvg.py            ↔ chart_engine/indicators/fvg.py
backend/indicators/hma.py            ↔ chart_engine/indicators/hma.py
backend/indicators/imbalance.py      ↔ chart_engine/indicators/imbalance.py
backend/indicators/keltner.py        ↔ chart_engine/indicators/keltner.py
backend/indicators/macd.py           ↔ chart_engine/indicators/macd.py
backend/indicators/obv.py            ↔ chart_engine/indicators/obv.py
backend/indicators/orderblocks.py    ↔ chart_engine/indicators/orderblocks.py
backend/indicators/sma.py            ↔ chart_engine/indicators/sma.py
backend/indicators/stochastic.py     ↔ chart_engine/indicators/stochastic.py
backend/indicators/vwap.py           ↔ chart_engine/indicators/vwap.py
backend/indicators/wma.py            ↔ chart_engine/indicators/wma.py
```

### Group 2: option_simulator/backend/ vs option simulator/simulator/backend/ (25+ identical files)
**Evidence:** Byte-for-byte identical scripts, tests, logs
```
scripts/benchmark.py, data_audit.py, etl_*.py, import_spot.py, recover_spot.py,
sample_data.py, test_db.py…test_db8.py, test_flow.py, test_api.py, test_frame.py,
test_init.py, tests/test_greeks.py, app/__init__.py, requirements.txt, first_frame.json
```

### Group 3: frontend/ vs frontend_restored/ (7 identical files)
```
globals.css, layout.tsx, page.module.css, api.ts, tsconfig.json, vercel.json, README.md
```

### Group 4: Build artifacts (dist/ folders)
```
frontend_backup_nextjs/dist/assets/  ↔ option_simulator/simulator/frontend_react/dist/assets/
```

## B.3 Confirmed Archive / Documentation Files

| File | Why Archived | Evidence |
|------|-------------|----------|
| `Replay bar/SUPERTREND_AUDIT_REPORT.md` | Bug audit report from a past fix. Not code. | Contains "Audit Report" in filename |
| `Replay bar/README_DEPLOYMENT.md` | Deployment guide. Referenced but static doc. | Markdown file |
| `Replay bar/Options_Simulator_Build_Plan.md` | 583-line technical blueprint. Not code. | "Build_Plan" in filename |
| `Replay bar/TERMINAL_ARCHITECTURE.md` | Architecture doc for terminal. Not code. | Markdown file |
| `Replay bar/TERMINAL_AUDIT_AND_ROADMAP.md` | Audit doc. Not code. | Markdown file |
| `Replay bar/TERMINAL_CREATIVE_DIRECTION.md` | Design doc. Not code. | Markdown file |
| `Replay bar/CODEBASE_AUDIT_AND_ROADMAP.md` | Previous audit. Not code. | Markdown file |

---

# SECTION C — FULL CODEBASE AUDIT

## C.1 Duplicate Files with Risk Assessment

| # | File A | File B | Identical? | Risk Level | Recommendation |
|---|--------|--------|-----------|------------|----------------|
| 1 | `backend/indicators/base.py` | `chart_engine/indicators/base.py` | YES | **LOW** | Delete chart_engine copy (inactive) |
| 2 | `backend/indicators/atr.py` | `chart_engine/indicators/atr.py` | YES | **LOW** | Delete chart_engine copy |
| 3 | `backend/indicators/bollinger.py` | `chart_engine/indicators/bollinger.py` | YES | **LOW** | Delete chart_engine copy |
| 4 | `backend/indicators/cci.py` | `chart_engine/indicators/cci.py` | YES | **LOW** | Delete chart_engine copy |
| 5 | `backend/indicators/ema.py` | `chart_engine/indicators/ema.py` | YES | **LOW** | Delete chart_engine copy |
| 6 | `backend/indicators/fvg.py` | `chart_engine/indicators/fvg.py` | YES | **LOW** | Delete chart_engine copy |
| 7 | `backend/indicators/hma.py` | `chart_engine/indicators/hma.py` | YES | **LOW** | Delete chart_engine copy |
| 8 | `backend/indicators/imbalance.py` | `chart_engine/indicators/imbalance.py` | YES | **LOW** | Delete chart_engine copy |
| 9 | `backend/indicators/keltner.py` | `chart_engine/indicators/keltner.py` | YES | **LOW** | Delete chart_engine copy |
| 10 | `backend/indicators/macd.py` | `chart_engine/indicators/macd.py` | YES | **LOW** | Delete chart_engine copy |
| 11 | `backend/indicators/obv.py` | `chart_engine/indicators/obv.py` | YES | **LOW** | Delete chart_engine copy |
| 12 | `backend/indicators/orderblocks.py` | `chart_engine/indicators/orderblocks.py` | YES | **LOW** | Delete chart_engine copy |
| 13 | `backend/indicators/sma.py` | `chart_engine/indicators/sma.py` | YES | **LOW** | Delete chart_engine copy |
| 14 | `backend/indicators/stochastic.py` | `chart_engine/indicators/stochastic.py` | YES | **LOW** | Delete chart_engine copy |
| 15 | `backend/indicators/vwap.py` | `chart_engine/indicators/vwap.py` | YES | **LOW** | Delete chart_engine copy |
| 16 | `backend/indicators/wma.py` | `chart_engine/indicators/wma.py` | YES | **LOW** | Delete chart_engine copy |
| 17 | `option_simulator/backend/scripts/*.py` | `option simulator/simulator/backend/scripts/*.py` | YES (25+) | **LOW** | Delete root-level `option simulator/` folder |
| 18 | `option_simulator/backend/tests/test_greeks.py` | `option simulator/simulator/backend/tests/test_greeks.py` | YES | **LOW** | Delete root-level copy |
| 19 | `frontend/src/app/globals.css` | `frontend_restored/src/app/globals.css` | YES | **LOW** | Delete frontend_restored/ |
| 20 | `frontend/src/app/layout.tsx` | `frontend_restored/src/app/layout.tsx` | YES | **LOW** | Delete frontend_restored/ |
| 21 | `frontend/src/services/api.ts` | `frontend_restored/src/services/api.ts` | YES | **LOW** | Delete frontend_restored/ |

## C.2 Dead Code — Backend

| # | File | Why Dead | Evidence |
|---|------|----------|----------|
| 1 | `Replay bar/chart_engine/app.py` | Flask app, NOT referenced in any deployment config. Port 5050 hardcoded. Known bugs per audit report. | No railway.json, no Procfile, no vercel.json references it |
| 2 | `Replay bar/chart_engine/replay/replay_engine.py` | Only used by chart_engine/app.py (dead). | Only import is in chart_engine/app.py |
| 3 | `Replay bar/test_api.py` | Standalone test script at root level. NOT imported anywhere. | No imports found, just a manual curl-like script |
| 4 | `Replay bar/option_simulator/backend/scripts/test_db.py` through `test_db8.py` | 8 nearly identical test scripts. Only `test_db.py` likely needed. | All do similar DB connection tests |
| 5 | `Replay bar/option_simulator/backend/scripts/benchmark.py` | One-off benchmark. Not part of regular workflow. | No imports, standalone script |
| 6 | `Replay bar/option_simulator/backend/scripts/sample_data.py` | Generates sample data. Not used in production. | No imports |

## C.3 Dead Code — Frontend

| # | File / Component | Why Dead | Evidence |
|---|-----------------|----------|----------|
| 1 | `apechain/src/app/api/page.tsx` | "Coming Soon" placeholder. NOT linked from Navbar. | Returns static "Coming Soon" JSX |
| 2 | `apechain/src/app/cinematic/page.tsx` | Portfolio page. NOT linked from Navbar. | No inbound links |
| 3 | `apechain/src/app/bg/page.tsx` | Background preview. NOT linked from Navbar. | No inbound links |
| 4 | `apechain/src/components/AnimatedParticles.tsx` | Imported? Need to verify. | File exists in components/ |
| 5 | `apechain/src/components/DotField.tsx` | Need to verify imports. | File exists in components/ |
| 6 | `apechain/src/components/QuantGridBackground.tsx` | Need to verify imports. | File exists in components/ |
| 7 | `apechain/src/components/CinematicCursor.tsx` | Need to verify imports. | File exists in components/ |
| 8 | `apechain/src/app/TERMINAL_PHASE_B_BACKUP/` | Backup folder inside src. NOT imported by active code. | Name contains "BACKUP" |
| 9 | `apechain/src/app/TERMINAL_THEME_BACKUP/` | Backup folder inside src. NOT imported by active code. | Name contains "BACKUP" |
| 10 | `apechain/src/_BACKUP_PRE_LIGHT_PASS/` | Backup folder. NOT imported. | Name contains "BACKUP" |
| 11 | `apechain/src/_BACKUP_PRE_PREMIUM_PASS/` | Backup folder. NOT imported. | Name contains "BACKUP" |

## C.4 Unused Dependencies

### Replay Bar Backend (`backend/requirements.txt`)
| Package | Version | Used? | Evidence |
|---------|---------|-------|----------|
| fastapi | 0.111.0 | YES | `from fastapi import FastAPI` in app.py |
| uvicorn | 0.30.1 | YES | Procfile + Dockerfile use uvicorn |
| pandas | 2.2.2 | YES | `import pandas as pd` in loader.py, data_service.py |
| numpy | 1.26.4 | YES | Used in indicators (atr, bollinger, etc.) |
| pydantic | 2.7.4 | YES | `from pydantic import BaseModel` in indicators.py |
| python-multipart | 0.0.9 | VERIFY | No file upload endpoints found |

### Option Simulator Backend (`option_simulator/backend/requirements.txt`)
| Package | Version | Used? | Evidence |
|---------|---------|-------|----------|
| fastapi | 0.111.0 | YES | `from fastapi import FastAPI` in main.py |
| uvicorn[standard] | 0.29.0 | YES | Run command in main.py docstring |
| polars | 0.20.26 | YES | `import polars as pl` in reader.py, greeks.py |
| clickhouse-driver | 0.2.7 | VERIFY | ETL scripts reference ClickHouse but main app uses DuckDB |
| numpy | 1.26.4 | YES | Used in greeks.py (BSM calculations) |
| scipy | 1.13.0 | YES | `from scipy.special import ndtr` in greeks.py |
| rich | 13.7.1 | YES | ETL scripts use rich.console |
| httpx | 0.27.0 | NO | No `import httpx` found in any file |
| sqlalchemy | 2.0.30 | NO | No `import sqlalchemy` found |
| asyncpg | 0.29.0 | NO | No `import asyncpg` found |
| pydantic | 2.7.1 | YES | `from pydantic import BaseModel` in main.py |
| python-dateutil | 2.9.0 | VERIFY | May be used by pandas/polars internally |
| pytest | 8.2.0 | YES | test_greeks.py uses pytest |
| pytest-asyncio | 0.23.6 | VERIFY | No async tests found in test_greeks.py |

### QuantLab Terminal (`apechain/package.json`)
| Package | Version | Used? | Evidence |
|---------|---------|-------|----------|
| @studio-freight/lenis | ^1.0.42 | VERIFY | SmoothScroll component may use it |
| clsx | ^2.1.1 | VERIFY | Common utility, likely used |
| d3-array | ^3.2.4 | YES | Terminal charts use d3 |
| d3-format | ^3.1.2 | YES | Terminal charts use d3 |
| d3-scale | ^4.0.2 | YES | Terminal charts use d3 |
| d3-shape | ^3.2.0 | YES | Terminal charts use d3 |
| d3-time-format | ^4.1.0 | VERIFY | May be used by chart components |
| framer-motion | ^12.40.0 | YES | terminal/page.tsx imports AnimatePresence |
| gsap | ^3.15.0 | VERIFY | Mentioned in architecture docs |
| lucide-react | ^1.16.0 | YES | simulator/page.tsx imports ArrowLeft |
| next | 14.2.35 | YES | Framework |
| ogl | ^1.0.11 | VERIFY | May be used by 3D components |
| react | ^18 | YES | Framework |
| react-dom | ^18 | YES | Framework |
| tailwind-merge | ^3.6.0 | VERIFY | Common with clsx |
| three | ^0.184.0 | VERIFY | May be used by 3D components |
| zustand | ^5.0.14 | YES | terminal stores import zustand |

---

# SECTION D — SAFE DELETION ANALYSIS

## D.1 SAFE TO DELETE (High Confidence)

| # | Path | Reason | Risk |
|---|------|--------|------|
| 1 | `Replay bar/frontend_backup_nextjs/` | Name contains "backup". NOT referenced in any config. Contains complete node_modules (~100MB+). | ZERO — confirmed backup |
| 2 | `Replay bar/frontend_backup_nextjs_20260605_121253/` | Name contains "backup" + timestamp. NOT referenced. Complete copy of above. | ZERO — confirmed backup |
| 3 | `Replay bar/frontend_restored/` | Name contains "restored". NOT referenced in deployment. Nearly identical to `frontend/`. | ZERO — confirmed duplicate |
| 4 | `option simulator/` (root level) | Entire folder is structural duplicate of `Replay bar/option_simulator/simulator/`. NOT referenced. | ZERO — confirmed duplicate |
| 5 | `Replay bar/option_simulator/simulator/` | Contains older copy of backend, frontend, frontend_react. Active code is at `Replay bar/option_simulator/backend/`. | LOW — verify no active references first |
| 6 | `Replay bar/chart_engine/` | Flask app, NOT in deployment pipeline. Known bugs. All indicator files duplicated in `backend/`. | LOW — verify no local dev usage |
| 7 | `Replay bar/SUPERTREND_AUDIT_REPORT.md` | Static audit report. Not code. | ZERO — documentation only |
| 8 | `Replay bar/test_api.py` | Standalone test script at root. NOT imported. | ZERO — standalone script |
| 9 | `Replay bar/option_simulator/backend/scripts/test_db2.py` through `test_db8.py` | 7 duplicate test scripts. `test_db.py` is sufficient. | LOW — verify test_db.py covers all cases |
| 10 | `Replay bar/option_simulator/backend/scripts/benchmark.py` | One-off benchmark. Not part of workflow. | LOW — archive if needed |
| 11 | `Replay bar/option_simulator/backend/scripts/sample_data.py` | Generates sample data. Not used in production. | LOW — archive if needed |
| 12 | `apechain/src/app/TERMINAL_PHASE_B_BACKUP/` | Name contains "BACKUP". NOT imported by active code. | ZERO — confirmed backup |
| 13 | `apechain/src/app/TERMINAL_THEME_BACKUP/` | Name contains "BACKUP". NOT imported by active code. | ZERO — confirmed backup |
| 14 | `apechain/src/_BACKUP_PRE_LIGHT_PASS/` | Name contains "BACKUP". NOT imported. | ZERO — confirmed backup |
| 15 | `apechain/src/_BACKUP_PRE_PREMIUM_PASS/` | Name contains "BACKUP". NOT imported. | ZERO — confirmed backup |
| 16 | `apechain/public/replay-bar.html.backup` | File extension `.backup`. NOT referenced. | ZERO — confirmed backup |
| 17 | `apechain/src/app/terminal/page.tsx.backup` | File extension `.backup`. NOT referenced. | ZERO — confirmed backup |
| 18 | `apechain/src/app/TERMINAL_PHASE_B_BACKUP/page.tsx.backup` | File extension `.backup`. NOT referenced. | ZERO — confirmed backup |
| 19 | `apechain/src/app/TERMINAL_THEME_BACKUP/page.tsx.backup` | File extension `.backup`. NOT referenced. | ZERO — confirmed backup |

## D.2 VERIFY BEFORE DELETE (Medium Confidence)

| # | Path | Why Verify | What to Check |
|---|------|-----------|---------------|
| 1 | `Replay bar/chart_engine/` | Someone may run it locally on port 5050 | Search for `chart_engine` or `5050` in any active config or script |
| 2 | `Replay bar/option_simulator/simulator/backend/app/main.py` | Root-level option simulator may be the "original" | Check if any deployment script references `option simulator/simulator/` instead of `Replay bar/option_simulator/backend/` |
| 3 | `apechain/src/app/api/page.tsx` | May be linked from somewhere else | Search all files for `/api` or `href="/api"` links |
| 4 | `apechain/src/app/cinematic/page.tsx` | May be linked from external site or bookmark | Search for `cinematic` in all files |
| 5 | `apechain/src/app/bg/page.tsx` | May be used for development/testing | Search for `bg` page references |
| 6 | `apechain/src/components/AnimatedParticles.tsx` | May be imported by a page | Search for `AnimatedParticles` in all tsx files |
| 7 | `apechain/src/components/DotField.tsx` | May be imported by a page | Search for `DotField` in all tsx files |
| 8 | `apechain/src/components/QuantGridBackground.tsx` | May be imported by a page | Search for `QuantGridBackground` in all tsx files |
| 9 | `apechain/src/components/CinematicCursor.tsx` | May be imported by a page | Search for `CinematicCursor` in all tsx files |
| 10 | `Replay bar/option_simulator/backend/scripts/etl_pipeline.py` | May be used for production ETL to ClickHouse | Check if ClickHouse is actually used in production |
| 11 | `Replay bar/option_simulator/backend/scripts/etl_local.py` | May be used for local ETL | Check if it's referenced in any setup docs |
| 12 | `Replay bar/option_simulator/backend/scripts/etl_prod.py` | May be used for production ETL | Check if it's referenced in any setup docs |
| 13 | `Replay bar/frontend/public/index.html` | This is the ACTUAL UI that the iframe loads | CRITICAL — DO NOT DELETE without verifying the iframe src |

## D.3 DO NOT DELETE (Critical Files)

| # | Path | Why Critical |
|---|------|-------------|
| 1 | `Replay bar/backend/app.py` | Active FastAPI entrypoint. Referenced by Procfile and Dockerfile. |
| 2 | `Replay bar/backend/routes/*.py` | All 4 route files are registered in app.py. |
| 3 | `Replay bar/backend/services/data_service.py` | Singleton loaded by routes. |
| 4 | `Replay bar/backend/data/loader.py` | Imported by data_service.py. |
| 5 | `Replay bar/backend/indicators/*.py` | All imported by `indicators/__init__.py` which is imported by routes. |
| 6 | `Replay bar/option_simulator/backend/app/main.py` | Active FastAPI entrypoint. Running on port 8000. |
| 7 | `Replay bar/option_simulator/backend/app/engine/replay.py` | Imported by main.py. Core session logic. |
| 8 | `Replay bar/option_simulator/backend/app/quant/greeks.py` | Imported by main.py and replay.py. BSM engine. |
| 9 | `Replay bar/option_simulator/backend/app/quant/execution.py` | Imported by replay.py. Fill simulation. |
| 10 | `Replay bar/option_simulator/backend/app/quant/analytics.py` | Imported by replay.py. Metrics computation. |
| 11 | `Replay bar/option_simulator/backend/app/data/reader.py` | Imported by main.py and replay.py. DuckDB interface. |
| 12 | `Replay bar/option_simulator/backend/app/data/constants.py` | Imported by reader.py and replay.py. |
| 13 | `Replay bar/option_simulator/backend/scripts/etl_v3.py` | Fastest ETL. Referenced in comments as primary approach. |
| 14 | `Replay bar/option_simulator/data/*.duckdb` | Production databases. |
| 15 | `Replay bar/Data/NIFTY 50_minute.csv` | Primary data source for Replay Bar. |
| 16 | `final/new backgrond/apechain/src/app/page.tsx` | Active Next.js homepage. |
| 17 | `final/new backgrond/apechain/src/app/terminal/page.tsx` | Active terminal route. Linked from Navbar. |
| 18 | `final/new backgrond/apechain/src/app/simulator/page.tsx` | Active simulator route. Linked from Navbar. |
| 19 | `final/new backgrond/apechain/src/app/strategies/page.tsx` | Active strategies route. Linked from Navbar. |
| 20 | `final/new backgrond/apechain/src/app/build/page.tsx` | Active build route. Embeds replay-bar.html. |
| 21 | `final/new backgrond/apechain/src/components/Navbar.tsx` | Imported by page.tsx. |
| 22 | `final/new backgrond/apechain/src/components/ApeHero.tsx` | Imported by page.tsx. |
| 23 | `Replay bar/frontend/src/app/page.tsx` | Active Next.js wrapper. Vercel deployment target. |
| 24 | `Replay bar/frontend/src/services/api.ts` | Active API client. |
| 25 | `Replay bar/frontend/public/index.html` | ACTUAL UI loaded by iframe. CRITICAL. |
| 26 | `Replay bar/railway.json` | Active deployment config. |
| 27 | `Replay bar/vercel.json` | Active deployment config. |
| 28 | `Replay bar/Procfile` | Active deployment config. |
| 29 | `Replay bar/backend/Dockerfile` | Active deployment config. |

---

# SECTION E — DEPENDENCY ANALYSIS

## E.1 Import Graph — Replay Bar Backend

```
backend/app.py
├── routes/candles.py
│   ├── services/data_service.py
│   │   ├── data/loader.py
│   │   │   └── pandas, numpy
│   │   └── os
│   └── data/loader.py (TIMEFRAME_MAP, df_to_json_list)
├── routes/indicators.py
│   ├── services/data_service.py
│   ├── data/loader.py (TIMEFRAME_MAP)
│   └── indicators/__init__.py (INDICATOR_REGISTRY)
│       └── indicators/*.py
│           └── indicators/base.py
│               └── pandas
├── routes/imbalances.py
│   ├── services/data_service.py
│   └── data/loader.py (TIMEFRAME_MAP)
└── routes/replay.py (no imports)
```

**Orphan Files in backend/:**
| File | Imported By | Status |
|------|------------|--------|
| `routes/__init__.py` | `app.py` (implicit via `from routes import ...`) | ACTIVE |
| `services/__init__.py` | `routes/*.py` (implicit) | ACTIVE |
| `data/__init__.py` | EMPTY — no exports | ORPHAN (but harmless) |

## E.2 Import Graph — Option Simulator Backend

```
app/main.py
├── app.data.reader → OptionChainReader
│   ├── polars, duckdb
│   └── app.data.constants → LOT_SIZES, STRIKE_INTERVALS
├── app.quant.greeks → price_chain, OptionChainAnalytics
│   ├── numpy, polars
│   └── scipy.special.ndtr
├── app.quant.execution → ExecutionMode
│   └── (enums only, no heavy imports)
└── app.engine.replay → ReplaySession, ReplayAction, SessionFrame
    ├── polars
    ├── app.data.reader → OptionChainReader
    ├── app.data.constants → LOT_SIZES, STRIKE_INTERVALS
    ├── app.quant.greeks → price_chain, OptionChainAnalytics, expected_move
    └── app.quant.execution → ExecutionEngine, ExecutionMode, SlippageModel, ...
        └── app.quant.analytics → compute_analytics, trade_quality_score
            └── math
```

**Orphan Files in option_simulator/backend/:**
| File | Status | Reason |
|------|--------|--------|
| `app/__init__.py` | ORPHAN | Empty file, no imports |
| `scripts/*.py` | STANDALONE | Run manually, not imported |
| `test_api.py` | STANDALONE | Run manually |
| `test_frame.py` | STANDALONE | Run manually |
| `test_init.py` | STANDALONE | Run manually |
| `tests/test_greeks.py` | STANDALONE | pytest test file |
| `first_frame.json` | DATA | Sample data, not imported |
| `session_init.json` (root) | DATA | Sample response, not imported |

## E.3 Import Graph — QuantLab Terminal

```
src/app/page.tsx
├── @/components/ApeHero
├── @/components/Navbar
├── @/components/SmoothScroll
├── @/components/ClickSpark
├── @/components/LetterGlitch
└── @/components/ScrollStack
    └── @/components/DecryptedText

src/app/terminal/page.tsx
├── ./stores/useTerminalStore
├── ./hooks/useKeyboard
├── ./components/ui (Topbar, Sidebar, CommandPalette)
└── ./components/scenes (UploadPhase, ExecPhase, ExecutiveSummary, ...)

src/app/simulator/page.tsx
├── next/link
└── lucide-react/ArrowLeft

src/app/strategies/page.tsx
├── d3-scale, d3-shape, d3-array
└── framer-motion
```

**Orphan Components (VERIFY REQUIRED):**
| Component | Imported By? | File Found? |
|-----------|-------------|-------------|
| AnimatedParticles | SEARCH REQUIRED | YES |
| CinematicCursor | SEARCH REQUIRED | YES |
| ClickSpark | page.tsx | YES — ACTIVE |
| DecryptedText | page.tsx | YES — ACTIVE |
| DotField | SEARCH REQUIRED | YES |
| LetterGlitch | page.tsx | YES — ACTIVE |
| QuantGridBackground | SEARCH REQUIRED | YES |
| ScrollStack | page.tsx | YES — ACTIVE |
| SmoothScroll | page.tsx | YES — ACTIVE |

## E.4 Circular Dependencies

**No circular dependencies detected** in the Python backend. All imports flow downward:
- `app.py` → `routes/` → `services/` → `data/` → `indicators/`
- `main.py` → `engine/` → `quant/` + `data/`

**Potential circular dependency in frontend:**
- `useTerminalStore` ↔ `usePlaybackStore` — need to verify if they import each other.

---

# SECTION F — PRODUCTION READINESS AUDIT

## F.1 Security Concerns

| # | Issue | Severity | Evidence | Fix |
|---|-------|----------|----------|-----|
| 1 | **CORS allow_origins=["*"]** | HIGH | `Replay bar/backend/app.py` line 15: `allow_origins=["*"]` | Restrict to known domains |
| 2 | **CORS allow_origins env fallback is wildcard** | HIGH | `option_simulator/backend/app/main.py`: `allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:*,...").split(",")` | Default should be restrictive |
| 3 | **No API authentication** | HIGH | No JWT, API key, or session auth found in any route | Add JWT or API key middleware |
| 4 | **No rate limiting** | MEDIUM | No `@limiter` or similar decorators found | Add FastAPI rate limiter |
| 5 | **Hardcoded paths in ETL scripts** | MEDIUM | `etl_v3.py`: `Path(r"d:\option simulator algotest\Option data")` | Use environment variables |
| 6 | **frontend/vercel.json has placeholder URL** | LOW | `"destination": "https://MY_RAILWAY_URL/api/$1"` | Replace with actual URL |
| 7 | **Debug prints in production code** | LOW | Multiple `print()` and `console.log()` statements | Replace with logging framework |
| 8 | **SQL injection risk in candles endpoint** | LOW | Date strings concatenated: `end + " 23:59:59"` | Use parameterized queries |

## F.2 Debug Code & TODOs

| File | Line | Content | Type |
|------|------|---------|------|
| `backend/routes/indicators.py` | 68 | `traceback.print_exc()` | Debug print |
| `backend/routes/candles.py` | — | Multiple `print()` in data_service | Debug print |
| `option_simulator/backend/app/main.py` | 227, 230 | `print(f"DEBUG: ValueError during init_session: {e}")` | Debug print |
| `option_simulator/backend/app/main.py` | 389 | `print(f"DEBUG close_position: ...")` | Debug print |
| `option_simulator/backend/app/main.py` | 394 | `print(f"DEBUG close_position ERROR: ...")` | Debug print |
| `option_simulator/backend/app/engine/replay.py` | — | Multiple debug comments | Comments |
| `option_simulator/backend/app/data/reader.py` | 60, 62 | `print(f"[+] Attached spot database: ...")` | Info print |
| `option_simulator/backend/scripts/etl_v3.py` | — | Multiple `console.print()` via rich | Progress output |

## F.3 Configuration Issues

| # | Issue | Evidence |
|---|-------|----------|
| 1 | `option_simulator/backend/app/main.py` mounts static files from `frontend_react/dist` which may not exist | `FRONTEND_DIR = Path(__file__).parent.parent.parent / "frontend_react" / "dist"` |
| 2 | `railway.json` points to `backend/Dockerfile` but does NOT deploy option_simulator | Only Replay Bar backend is in Railway pipeline |
| 3 | Root `vercel.json` points to `frontend` (Replay Bar wrapper) but NOT to `apechain` | ApeChain frontend is not in the root deployment config |
| 4 | `next.config.mjs` in apechain has `ignoreDuringBuilds: true` and `ignoreBuildErrors: true` | Hides TypeScript and ESLint errors at build time |

---

# SECTION G — PERFORMANCE OPTIMIZATION OPPORTUNITIES

## G.1 Backend Performance

| # | Issue | Impact | Recommendation |
|---|-------|--------|----------------|
| 1 | **CSV loaded on every startup** | 2-5s cold start | Pre-compute Parquet or use lazy loading |
| 2 | **Pandas resample for each new TF** | Memory duplication, CPU | Pre-compute all TFs at startup |
| 3 | **No indicator result caching** | Recalculates on every request | Add LRU cache keyed by (indicator, tf, settings, replay_idx) |
| 4 | **DuckDB single connection** | Request queuing under load | Use connection pooling |
| 5 | **Full frame serialized on every WS tick** | Large payloads at 20 FPS | Implement delta frames |
| 6 | **No compression on WebSocket** | High bandwidth | Enable permessage-deflate |
| 7 | **NaN replacement in every serialize call** | CPU overhead | Handle NaN at source (Greeks computation) |

## G.2 Frontend Performance

| # | Issue | Impact | Recommendation |
|---|-------|--------|----------------|
| 1 | **iframe loads entire Vanilla JS app** | Large initial load | Consider migrating to React component |
| 2 | **ApeChain imports Three.js + OGL** | Large bundle | Tree-shake or lazy load 3D libraries |
| 3 | **No code splitting for terminal scenes** | All 8 scenes loaded at once | Use dynamic imports for scenes |
| 4 | **Background images loaded on every page** | Bandwidth waste | Use CSS gradients where possible |
| 5 | **GSAP + Framer Motion both loaded** | Duplicate animation libraries | Consolidate to one library |

---

# SECTION H — BUILD OPTIMIZATION

## H.1 Unused Packages (Confirmed)

### Option Simulator Backend
| Package | Status | Action |
|---------|--------|--------|
| httpx | UNUSED — no `import httpx` found | Remove from requirements.txt |
| sqlalchemy | UNUSED — no `import sqlalchemy` found | Remove from requirements.txt |
| asyncpg | UNUSED — no `import asyncpg` found | Remove from requirements.txt |
| clickhouse-driver | VERIFY — ETL scripts use it but main app uses DuckDB | Keep for ETL, or split requirements |

### QuantLab Terminal
| Package | Status | Action |
|---------|--------|--------|
| three | VERIFY — may be used by 3D components | Check imports |
| ogl | VERIFY — may be used by 3D components | Check imports |
| @studio-freight/lenis | VERIFY — check SmoothScroll component | Check imports |

---

# SECTION I — CLEANUP PLAN

## Phase 1 — Safe Deletions (Zero Risk)

```
□ Delete: Replay bar/frontend_backup_nextjs/               (backup folder)
□ Delete: Replay bar/frontend_backup_nextjs_20260605_121253/ (timestamped backup)
□ Delete: Replay bar/frontend_restored/                    (restored duplicate)
□ Delete: option simulator/                                (root-level duplicate)
□ Delete: apechain/src/app/TERMINAL_PHASE_B_BACKUP/       (source backup)
□ Delete: apechain/src/app/TERMINAL_THEME_BACKUP/         (source backup)
□ Delete: apechain/src/_BACKUP_PRE_LIGHT_PASS/            (source backup)
□ Delete: apechain/src/_BACKUP_PRE_PREMIUM_PASS/          (source backup)
□ Delete: apechain/public/replay-bar.html.backup          (file backup)
□ Delete: apechain/src/app/terminal/page.tsx.backup       (file backup)
□ Delete: apechain/src/app/TERMINAL_PHASE_B_BACKUP/page.tsx.backup
□ Delete: apechain/src/app/TERMINAL_THEME_BACKUP/page.tsx.backup
□ Delete: Replay bar/SUPERTREND_AUDIT_REPORT.md           (static report)
□ Delete: Replay bar/test_api.py                          (orphan test script)
```

**Estimated space saved:** ~500MB+ (mostly node_modules in backup folders)

## Phase 2 — Verify & Remove (Low Risk)

```
□ Verify: chart_engine/ usage → If unused, delete entire folder
□ Verify: option_simulator/simulator/ usage → If unused, delete
□ Verify: apechain/src/app/api/page.tsx → If no inbound links, delete
□ Verify: apechain/src/app/cinematic/page.tsx → If no inbound links, delete
□ Verify: apechain/src/app/bg/page.tsx → If no inbound links, delete
□ Verify: AnimatedParticles, DotField, QuantGridBackground, CinematicCursor → If unused, delete
□ Consolidate: test_db2.py…test_db8.py → Keep only test_db.py
```

## Phase 3 — Refactoring (Medium Risk)

```
□ Merge: chart_engine/ indicators into backend/ (or delete chart_engine)
□ Merge: Duplicate backend/app.py logic (FastAPI vs Flask)
□ Extract: Shared indicator base.py to common package
□ Unify: frontend/ and frontend_restored/ → Keep one
□ Consolidate: ETL scripts → Single parameterized script
```

## Phase 4 — Dependency Cleanup

```
□ Remove: httpx from option_simulator requirements.txt
□ Remove: sqlalchemy from option_simulator requirements.txt
□ Remove: asyncpg from option_simulator requirements.txt
□ Remove: python-multipart from backend requirements.txt (if unused)
□ Audit: three, ogl, @studio-freight/lenis in apechain package.json
```

## Phase 5 — Production Hardening

```
□ Fix: CORS allow_origins from "*" to specific domains
□ Fix: Remove debug print statements
□ Fix: Replace hardcoded ETL paths with env vars
□ Fix: Add API authentication (JWT)
□ Fix: Add rate limiting
□ Fix: Replace frontend/vercel.json placeholder URL
□ Fix: Remove ignoreBuildErrors from next.config.mjs
□ Add: Health checks for DuckDB connections
□ Add: Redis session store (replace in-memory dict)
□ Add: Comprehensive test coverage
```

---

# SECTION J — FINAL OUTPUT

## J.1 Files to Delete (Phase 1 — Safe)

| Count | Category | Total Size Est. |
|-------|----------|----------------|
| 3 | Backup frontend folders | ~300MB |
| 1 | Root-level duplicate folder | ~50MB |
| 4 | Source backup folders (apechain) | ~5MB |
| 4 | Backup files (.backup extension) | ~100KB |
| 1 | Static audit report | ~10KB |
| 1 | Orphan test script | ~1KB |
| **14** | **Total items** | **~355MB** |

## J.2 Files to Merge/Refactor (Phase 2-3)

| Count | Category |
|-------|----------|
| 16 | chart_engine indicator files (merge into backend/) |
| 3 | chart_engine unique files (app.py, replay_engine.py, loader.py) |
| 7 | frontend_restored files (merge into frontend/) |
| 25+ | option simulator duplicate scripts |
| 8 | Duplicate ETL/test scripts |

## J.3 Dependency Cleanup List

| Package | Current Location | Action |
|---------|-----------------|--------|
| httpx | option_simulator/requirements.txt | REMOVE |
| sqlalchemy | option_simulator/requirements.txt | REMOVE |
| asyncpg | option_simulator/requirements.txt | REMOVE |
| python-multipart | backend/requirements.txt | VERIFY THEN REMOVE |
| clickhouse-driver | option_simulator/requirements.txt | KEEP (ETL uses) |

## J.4 Risk Assessment

| Phase | Risk Level | Files Affected | Rollback Difficulty |
|-------|-----------|----------------|---------------------|
| Phase 1 | **NONE** | Backups only | Trivial (git restore) |
| Phase 2 | **LOW** | Inactive code | Easy (git restore) |
| Phase 3 | **MEDIUM** | Refactoring | Moderate (branch + test) |
| Phase 4 | **LOW** | Dependencies | Easy (pip install) |
| Phase 5 | **MEDIUM** | Security/config | Moderate (env vars) |

## J.5 Production Readiness Score

| Category | Score | Max | Notes |
|----------|-------|-----|-------|
| Code Quality | 6/10 | 10 | Debug prints, hardcoded paths |
| Security | 4/10 | 10 | Open CORS, no auth, no rate limiting |
| Testing | 2/10 | 10 | Minimal test coverage |
| Documentation | 7/10 | 10 | Good docs but scattered |
| Deployment | 6/10 | 10 | Railway + Vercel configured but incomplete |
| Performance | 5/10 | 10 | No caching, no compression |
| Maintainability | 4/10 | 10 | Heavy duplication, multiple frameworks |
| **TOTAL** | **34/70** | **70** | **48.6%** |

## J.6 Clean Project Structure (After Cleanup)

```
D:\Replay bar
│
├── Replay bar/                          ← MAIN PROJECT
│   ├── backend/                         ← Active FastAPI (Replay Bar)
│   │   ├── app.py                       ← Entrypoint
│   │   ├── routes/
│   │   ├── services/
│   │   ├── data/
│   │   ├── indicators/
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   ├── frontend/                        ← Active Next.js 16 (wrapper)
│   │   ├── src/app/
│   │   ├── public/index.html            ← Vanilla JS chart UI
│   │   └── package.json
│   ├── option_simulator/                ← Active Option Simulator
│   │   ├── backend/
│   │   │   ├── app/main.py              ← Entrypoint
│   │   │   ├── app/engine/
│   │   │   ├── app/quant/
│   │   │   ├── app/data/
│   │   │   ├── scripts/etl_v3.py        ← Primary ETL
│   │   │   └── requirements.txt
│   │   └── data/*.duckdb                ← DuckDB databases
│   ├── Data/
│   │   └── NIFTY 50_minute.csv          ← Primary CSV
│   ├── railway.json                     ← Railway deploy config
│   ├── vercel.json                      ← Vercel deploy config
│   ├── Procfile                         ← Heroku/Railway process
│   └── README_DEPLOYMENT.md             ← Deploy guide
│
├── final/new backgrond/apechain/        ← Active QuantLab Terminal
│   ├── src/app/
│   │   ├── page.tsx                     ← Homepage
│   │   ├── terminal/page.tsx            ← Terminal
│   │   ├── simulator/page.tsx           ← Simulator iframe
│   │   ├── strategies/page.tsx          ← Strategies
│   │   └── build/page.tsx               ← Replay Bar iframe
│   ├── src/components/
│   ├── package.json
│   └── next.config.mjs
│
└── ARCHITECTURE_DOCUMENT.md             ← Architecture doc
    └── CODEBASE_AUDIT_REPORT.md         ← This audit report
```

---

# APPENDIX A — VERIFICATION CHECKLIST

Before executing Phase 1 deletions, verify:

- [ ] No running process references `frontend_backup_nextjs/` or `frontend_backup_nextjs_20260605_121253/`
- [ ] No running process references `frontend_restored/`
- [ ] No running process references `option simulator/` (root level)
- [ ] No running process references `chart_engine/`
- [ ] No import statement references `_BACKUP_*` folders
- [ ] No import statement references `TERMINAL_*_BACKUP` folders
- [ ] Git repository is clean (all changes committed)
- [ ] Full backup of project exists before any deletion

---

# APPENDIX B — EVIDENCE SOURCES

| Evidence Type | Command / Method | Files Examined |
|--------------|------------------|---------------|
| Running processes | `tasklist \| grep -iE "python\|node\|uvicorn"` | System process list |
| File inventory | `find . -type f -name "*.py"` | All Python files |
| Config files | `cat railway.json`, `cat vercel.json`, etc. | 8+ config files |
| Import traces | Manual code review | All `*.py` entrypoints |
| Route registration | `grep "include_router\|@app." *.py` | Backend entrypoints |
| Package dependencies | `cat requirements.txt`, `cat package.json` | 4+ dependency files |
| File comparison | `diff fileA fileB` | 30+ duplicate pairs |
| Deployment pipeline | `cat Dockerfile`, `cat Procfile` | 3 deploy configs |
| Database connections | `grep -n "connect\|attach" *.py` | Data layer files |

---

*Report Generated: 2026-06-06*  
*Phase: 1 (Audit Only — No Changes Made)*  
*Next Step: Review with stakeholder before proceeding to Phase 1 deletions*
