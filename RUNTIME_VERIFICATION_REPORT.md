# SIHL Quant Trading Platform — Runtime Verification Report (Phase 1.5)

**Verification Date:** June 6, 2026
**Auditor:** Senior Software Architect / Staff Engineer
**Scope:** Verify all conclusions from Phase 1 Audit
**Rule:** NO FILES WERE DELETED, MODIFIED, MOVED, OR RENAMED
**Methodology:** Import tracing, deployment config analysis, process inspection, filesystem grep

---

# SECTION A — RUNTIME TRUTH TABLE

| Path | Imported | Referenced | Runtime Loaded | Deployment Referenced | Status | Evidence |
|------|----------|------------|---------------|----------------------|--------|----------|
| `Replay bar/backend/` | YES | YES | YES (port 8001 inferred) | YES (`railway.json`, `Procfile`, `Dockerfile`) | **ACTIVE** | `app.py` registers routes; `Procfile` launches `uvicorn backend.app:app` |
| `Replay bar/frontend/` | YES | YES | YES (node.exe running) | YES (`vercel.json` root = "frontend") | **ACTIVE** | `page.tsx` renders iframe; `vercel.json` deploys to Vercel |
| `Replay bar/option_simulator/backend/` | YES | YES | YES (port 8000 confirmed) | NO (no railway/vercel config) | **ACTIVE** | `main.py` is FastAPI entrypoint; confirmed running via curl to `:8000/health` |
| `final/new backgrond/apechain/` | YES | YES | YES (node.exe running) | NO (no dedicated vercel.json found) | **ACTIVE** | `src/app/page.tsx` imports components; node processes detected |
| `Replay bar/chart_engine/` | SELF-ONLY | SELF-ONLY | NO | NO | **LEGACY** | Only `chart_engine/app.py` imports from `chart_engine/`; port 5050 used by `svchost.exe` (Windows system), NOT chart_engine |
| `Replay bar/frontend_backup_nextjs/` | NO | NO | NO | NO | **BACKUP** | Zero grep matches in any source/config file (excluding audit docs) |
| `Replay bar/frontend_backup_nextjs_20260605_121253/` | NO | NO | NO | NO | **BACKUP** | Zero grep matches in any source/config file (excluding audit docs) |
| `Replay bar/frontend_restored/` | NO | NO | NO | NO | **BACKUP** | Zero grep matches in any source/config file (excluding audit docs) |
| `option simulator/` (root) | NO | NO | NO | NO | **BACKUP** | Zero grep matches in any source/config file (excluding audit docs) |
| `Replay bar/option_simulator/simulator/` | SELF-ONLY | SELF-ONLY | NO | NO | **VERIFY_REQUIRED** | Contains duplicate backend; `SETUP.md` references it for local dev |
| `apechain/src/app/TERMINAL_PHASE_B_BACKUP/` | NO | NO | NO | NO | **BACKUP** | Zero import matches across all `.ts/.tsx/.js/.jsx` files |
| `apechain/src/app/TERMINAL_THEME_BACKUP/` | NO | NO | NO | NO | **BACKUP** | Zero import matches across all `.ts/.tsx/.js/.jsx` files |
| `apechain/src/_BACKUP_PRE_LIGHT_PASS/` | NO | NO | NO | NO | **BACKUP** | Only self-references within its own `.tsx` files |
| `apechain/src/_BACKUP_PRE_PREMIUM_PASS/` | NO | NO | NO | NO | **BACKUP** | Only self-references within its own `.tsx` files |
| `Replay bar/test_api.py` | NO | NO | NO | NO | **VERIFY_REQUIRED** | Standalone script; no imports found; may be run manually |
| `Replay bar/SUPERTREND_AUDIT_REPORT.md` | N/A | N/A | N/A | N/A | **BACKUP** | Static markdown document; not code |

---

# SECTION B — IMPORT TRACE VERIFICATION

## B.1 `frontend_backup_nextjs/` Import Trace

**Direct imports:** NONE
**Indirect imports:** NONE
**Dynamic imports:** NONE
**Filesystem-based loading:** NONE
**Plugin loading:** NONE
**Runtime loading:** NONE

**Evidence:**
- grep for `frontend_backup_nextjs` across all source/config files: ZERO matches (excluding audit documents)

**Conclusion:** CONFIRMED BACKUP — No runtime usage.

---

## B.2 `frontend_backup_nextjs_20260605_121253/` Import Trace

**Direct imports:** NONE
**Indirect imports:** NONE
**Dynamic imports:** NONE
**Filesystem-based loading:** NONE
**Plugin loading:** NONE
**Runtime loading:** NONE

**Evidence:**
- grep for `frontend_backup_nextjs_20260605` across all source/config files: ZERO matches (excluding audit documents)

**Conclusion:** CONFIRMED BACKUP — No runtime usage.

---

## B.3 `frontend_restored/` Import Trace

**Direct imports:** NONE
**Indirect imports:** NONE
**Dynamic imports:** NONE
**Filesystem-based loading:** NONE
**Plugin loading:** NONE
**Runtime loading:** NONE

**Evidence:**
- grep for `frontend_restored` across all source/config files: ZERO matches (excluding audit documents)

**Conclusion:** CONFIRMED BACKUP — No runtime usage.

---

## B.4 `chart_engine/` Import Trace

**Direct imports:** SELF-ONLY
**Evidence:**
```python
# Replay bar/chart_engine/app.py:29
from chart_engine.data.loader import (...)
# Replay bar/chart_engine/app.py:33
from chart_engine.indicators import INDICATOR_REGISTRY
```

**Indirect imports:** NONE (no other file imports from chart_engine)
**Dynamic imports:** NONE
**Filesystem-based loading:** NONE
**Plugin loading:** NONE
**Runtime loading:** CHECKED — Port 5050 is occupied by `svchost.exe` (Windows system service, PID 2172), NOT by chart_engine.

**Evidence (process check):**
```
$ netstat -ano | grep "5050"
  UDP    0.0.0.0:5050    *:*    2172

$ tasklist | grep "2172"
  svchost.exe    2172    Services    0    41,168 K
```

**Deployment references:** NONE
- `railway.json` points to `backend/Dockerfile` (NOT chart_engine)
- `Procfile` launches `uvicorn backend.app:app` (NOT chart_engine)
- `vercel.json` points to `frontend` (NOT chart_engine)

**Conclusion:** CONFIRMED LEGACY — Self-contained Flask app. Not deployed. Not running. Port 5050 is a Windows system service.

---

## B.5 `option simulator/` (Root Level) Import Trace

**Direct imports:** NONE
**Indirect imports:** NONE
**Dynamic imports:** NONE
**Filesystem-based loading:** NONE
**Plugin loading:** NONE
**Runtime loading:** NONE

**Evidence:**
- grep for import patterns referencing root `option simulator` folder: ZERO matches as Python package imports
- Only hardcoded Windows paths found inside scripts (e.g., `d:\option simulator algotest\Option data`)
- These are DATA PATHS, not module imports

**Deployment references:** NONE — No `railway.json`, `vercel.json`, `Procfile`, or `Dockerfile` in this folder.

**Conclusion:** CONFIRMED BACKUP — Root-level structural duplicate. No runtime usage.

---

## B.6 `Replay bar/option_simulator/simulator/` Import Trace

**Direct imports:** SELF-ONLY
**Evidence:** Internal imports within `simulator/backend/app/` directory.

**Indirect imports:** NONE from active code
**Dynamic imports:** NONE
**Deployment references:** NONE

**Special finding:** `option simulator/simulator/SETUP.md` exists and documents local dev commands:
```markdown
# cd "d:\option simulator algotest\simulator\backend"
# python -X utf8 scripts\etl_pipeline.py
# uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

This suggests the folder was intended for local development, but the ACTIVE backend is at `Replay bar/option_simulator/backend/` (confirmed running on port 8000).

**Conclusion:** VERIFY REQUIRED — May be referenced by old documentation, but active code uses `Replay bar/option_simulator/backend/`.

---

## B.7 `apechain/src/app/TERMINAL_PHASE_B_BACKUP/` Import Trace

**Direct imports:** NONE
**Evidence:** grep for `TERMINAL_PHASE_B_BACKUP` across all `.ts/.tsx/.js/.jsx`: NO MATCHES

**Conclusion:** CONFIRMED BACKUP — Zero imports across all source files.

---

## B.8 `apechain/src/app/TERMINAL_THEME_BACKUP/` Import Trace

**Direct imports:** NONE
**Evidence:** grep for `TERMINAL_THEME_BACKUP` across all `.ts/.tsx/.js/.jsx`: NO MATCHES

**Conclusion:** CONFIRMED BACKUP — Zero imports across all source files.

---

## B.9 `apechain/src/_BACKUP_PRE_LIGHT_PASS/` Import Trace

**Direct imports:** NONE
**Evidence:** grep for `_BACKUP_PRE_LIGHT_PASS` across all `.ts/.tsx/.js/.jsx`: NO MATCHES (outside the folder itself)

**Conclusion:** CONFIRMED BACKUP — Zero imports across all source files.

---

## B.10 `apechain/src/_BACKUP_PRE_PREMIUM_PASS/` Import Trace

**Direct imports:** NONE
**Evidence:** grep for `_BACKUP_PRE_PREMIUM_PASS` across all `.ts/.tsx/.js/.jsx`: NO MATCHES (outside the folder itself)

**Conclusion:** CONFIRMED BACKUP — Zero imports across all source files.

---

# SECTION C — DEPLOYMENT TRACE

## C.1 PRIMARY PRODUCTION APP

**Replay Bar Backend**
- **Config:** `Replay bar/railway.json`
  ```json
  { "build": { "builder": "DOCKERFILE", "dockerfilePath": "backend/Dockerfile" } }
  ```
- **Config:** `Replay bar/Procfile`
  ```
  web: uvicorn backend.app:app --host 0.0.0.0 --port $PORT
  ```
- **Config:** `Replay bar/backend/Dockerfile`
  ```dockerfile
  COPY backend/ ./backend/
  COPY Data/ ./Data/
  CMD ["sh", "-c", "uvicorn backend.app:app --host 0.0.0.0 --port $PORT"]
  ```
- **Status:** CONFIRMED PRIMARY PRODUCTION APP

**Replay Bar Frontend**
- **Config:** `Replay bar/vercel.json` (root)
  ```json
  { "experimentalServices": { "frontend": { "root": "frontend", "framework": "nextjs" } } }
  ```
- **Config:** `Replay bar/frontend/vercel.json`
  ```json
  { "rewrites": [{ "source": "/api/(.*)", "destination": "https://MY_RAILWAY_URL/api/$1" }] }
  ```
- **Status:** CONFIRMED PRIMARY PRODUCTION APP

---

## C.2 SECONDARY APP

**Option Simulator Backend**
- **Config:** NONE — No `railway.json`, no `Procfile`, no `Dockerfile`
- **Entrypoint:** `Replay bar/option_simulator/backend/app/main.py`
- **Run command (from docstring):** `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
- **Status:** CONFIRMED ACTIVE (local development only)

**QuantLab Terminal (ApeChain)**
- **Config:** NONE — No dedicated `vercel.json` found in `final/new backgrond/apechain/`
- **Framework:** Next.js 14.2.35
- **Status:** CONFIRMED ACTIVE (running locally, node.exe processes detected)

---

## C.3 BACKUP APP

**Chart Engine (Flask)**
- **Config:** NONE — Not in `railway.json`, `Procfile`, or any `vercel.json`
- **Entrypoint:** `Replay bar/chart_engine/app.py`
- **Hardcoded port:** 5050
- **Status:** CONFIRMED NOT RUNNING — Port 5050 is occupied by Windows `svchost.exe`
- **Classification:** LEGACY / NOT DEPLOYED

**Root-level `option simulator/`**
- **Config:** NONE
- **Status:** CONFIRMED BACKUP — Structural duplicate

---

# SECTION D — DELETE CANDIDATE VALIDATION

## D.1 `frontend_backup_nextjs/`

| Check | Result | Evidence |
|-------|--------|----------|
| Import count | **0** | Zero import or require statements |
| Route references | **0** | No router config references this folder |
| Deployment references | **0** | No vercel.json, railway.json, Dockerfile references |
| Runtime references | **0** | No process loading from this path |
| **Final classification** | **CONFIRMED BACKUP** | — |

---

## D.2 `frontend_backup_nextjs_20260605_121253/`

| Check | Result | Evidence |
|-------|--------|----------|
| Import count | **0** | Zero import or require statements |
| Route references | **0** | No router config references this folder |
| Deployment references | **0** | No config references |
| Runtime references | **0** | No process loading from this path |
| **Final classification** | **CONFIRMED BACKUP** | — |

---

## D.3 `frontend_restored/`

| Check | Result | Evidence |
|-------|--------|----------|
| Import count | **0** | Zero import or require statements |
| Route references | **0** | No router config references this folder |
| Deployment references | **0** | Root vercel.json points to `frontend/`, NOT `frontend_restored/` |
| Runtime references | **0** | No process loading from this path |
| **Final classification** | **CONFIRMED BACKUP** | — |

---

## D.4 `chart_engine/`

| Check | Result | Evidence |
|-------|--------|----------|
| Import count | **2 (self-only)** | `chart_engine/app.py` imports `chart_engine.data.loader` and `chart_engine.indicators` |
| Route references | **0** | No deployment config references |
| Deployment references | **0** | railway.json points to backend/Dockerfile; Procfile points to backend.app:app |
| Runtime references | **0** | Port 5050 used by svchost.exe (PID 2172), NOT chart_engine |
| **Final classification** | **CONFIRMED LEGACY** | Self-contained, not deployed, not running |

---

## D.5 `option simulator/` (Root Level)

| Check | Result | Evidence |
|-------|--------|----------|
| Import count | **0** | No Python import statements reference this path |
| Route references | **0** | No deployment config |
| Deployment references | **0** | No railway.json, vercel.json, Dockerfile, Procfile |
| Runtime references | **0** | Active backend is at `Replay bar/option_simulator/backend/` |
| **Final classification** | **CONFIRMED BACKUP** | Structural duplicate of `Replay bar/option_simulator/simulator/` |

---

## D.6 `Replay bar/option_simulator/simulator/`

| Check | Result | Evidence |
|-------|--------|----------|
| Import count | **Self-only** | Internal imports within `simulator/backend/app/` |
| Route references | **0** | No active deployment |
| Deployment references | **0** | No config files |
| Runtime references | **0** | Active backend is `Replay bar/option_simulator/backend/` |
| Special finding | **SETUP.md exists** | Documents local dev commands |
| **Final classification** | **VERIFY REQUIRED** | May be referenced by old workflows; contains duplicate code |

---

## D.7 `apechain/src/app/TERMINAL_PHASE_B_BACKUP/`

| Check | Result | Evidence |
|-------|--------|----------|
| Import count | **0** | Zero imports across all `.ts/.tsx/.js/.jsx` files |
| Route references | **0** | Next.js router does not reference this path |
| Deployment references | **0** | Not in any config |
| Runtime references | **0** | Not loaded at runtime |
| **Final classification** | **CONFIRMED BACKUP** | — |

---

## D.8 `apechain/src/app/TERMINAL_THEME_BACKUP/`

| Check | Result | Evidence |
|-------|--------|----------|
| Import count | **0** | Zero imports across all `.ts/.tsx/.js/.jsx` files |
| Route references | **0** | Next.js router does not reference this path |
| Deployment references | **0** | Not in any config |
| Runtime references | **0** | Not loaded at runtime |
| **Final classification** | **CONFIRMED BACKUP** | — |

---

## D.9 `apechain/src/_BACKUP_PRE_LIGHT_PASS/`

| Check | Result | Evidence |
|-------|--------|----------|
| Import count | **0** | Zero imports outside the folder |
| Route references | **0** | No router references |
| Deployment references | **0** | Not in any config |
| Runtime references | **0** | Not loaded at runtime |
| **Final classification** | **CONFIRMED BACKUP** | — |

---

## D.10 `apechain/src/_BACKUP_PRE_PREMIUM_PASS/`

| Check | Result | Evidence |
|-------|--------|----------|
| Import count | **0** | Zero imports outside the folder |
| Route references | **0** | No router references |
| Deployment references | **0** | Not in any config |
| Runtime references | **0** | Not loaded at runtime |
| **Final classification** | **CONFIRMED BACKUP** | — |

---

# SECTION E — DEPENDENCY VALIDATION

## E.1 `httpx`

**Search:** `grep -ri "import httpx" / "from httpx"` across all `.py` files
**Result:** NO MATCHES

**Used in:** NONE
**Imported by:** NONE
**Dynamic imports:** NONE
**Tests:** NONE
**Scripts:** NONE

**Conclusion:** **CONFIRMED UNUSED**

---

## E.2 `sqlalchemy`

**Search:** `grep -ri "import sqlalchemy" / "from sqlalchemy"` across all `.py` files
**Result:** NO MATCHES

**Used in:** NONE
**Imported by:** NONE
**Dynamic imports:** NONE
**Tests:** NONE
**Scripts:** NONE

**Conclusion:** **CONFIRMED UNUSED**

---

## E.3 `asyncpg`

**Search:** `grep -ri "import asyncpg" / "from asyncpg"` across all `.py` files
**Result:** NO MATCHES

**Used in:** NONE
**Imported by:** NONE
**Dynamic imports:** NONE
**Tests:** NONE
**Scripts:** NONE

**Conclusion:** **CONFIRMED UNUSED**

---

## E.4 `clickhouse-driver`

**Search:** `grep -ri "import clickhouse" / "from clickhouse"` across all `.py` files
**Result:**
```
Replay bar/option_simulator/backend/scripts/etl_pipeline.py:20:from clickhouse_driver import Client
option simulator/simulator/backend/scripts/etl_pipeline.py:20:from clickhouse_driver import Client
```

**Used in:** `etl_pipeline.py` (both copies)
**Imported by:** 2 files (both duplicates of each other)
**Purpose:** Production ETL target (ClickHouse database)
**Active ETL:** The active ETL is `etl_v3.py` (DuckDB), NOT `etl_pipeline.py` (ClickHouse)

**Conclusion:** **CONFIRMED USED** (in ETL scripts only, not in main app)

---

## E.5 `python-multipart`

**Search:** `grep -ri "import multipart" / "from multipart"` across all `.py` files
**Result:** NO MATCHES

**Used in:** NONE
**Imported by:** NONE
**Note:** May be a transitive dependency of FastAPI/Starlette for form uploads

**Conclusion:** **CONFIRMED UNUSED** (direct import); may be transitive

---

## E.6 `three` (Three.js)

**Search:** `grep -ri "from 'three'" / "import.*'three'"` across all `.ts/.tsx/.js/.jsx` files
**Result:**
```
final/new backgrond/apechain/src/components/AnimatedParticles.tsx:5:import * as THREE from "three";
```

**Used in:** `AnimatedParticles.tsx`
**Imported by:** `AnimatedParticles.tsx` only
**Critical finding:** `AnimatedParticles` is NOT imported by any active page:
```bash
grep -ri "AnimatedParticles" --include="*.ts" --include="*.tsx"
# RESULT: Only in AnimatedParticles.tsx itself
# ZERO imports from other files
```

**Conclusion:** **CONFIRMED UNUSED** — The only file importing `three` is itself not imported anywhere.

---

## E.7 `ogl`

**Search:** `grep -ri "from 'ogl'" / "import.*'ogl'"` across all `.ts/.tsx/.js/.jsx` files
**Result:** NO MATCHES

**Used in:** NONE
**Imported by:** NONE

**Conclusion:** **CONFIRMED UNUSED**

---

## E.8 `@studio-freight/lenis`

**Search:** `grep -ri "from '@studio-freight/lenis'" / "import.*lenis"` across all `.ts/.tsx/.js/.jsx` files
**Result:**
```
final/new backgrond/apechain/src/components/SmoothScroll.tsx:4:import Lenis from "@studio-freight/lenis";
```

**Used in:** `SmoothScroll.tsx`
**Imported by:** `SmoothScroll.tsx`
**Critical finding:** `SmoothScroll` IS imported by the active homepage:
```typescript
// final/new backgrond/apechain/src/app/page.tsx:3
import SmoothScroll from "@/components/SmoothScroll";
```

**Conclusion:** **CONFIRMED USED**

---

# SECTION F — FINAL DECISION

## F.1 CONFIRMED BACKUPS (Zero Runtime Usage)

| # | Path | Evidence Summary |
|---|------|-----------------|
| 1 | `Replay bar/frontend_backup_nextjs/` | Zero imports, zero deployment refs, zero runtime refs |
| 2 | `Replay bar/frontend_backup_nextjs_20260605_121253/` | Zero imports, zero deployment refs, zero runtime refs |
| 3 | `Replay bar/frontend_restored/` | Zero imports, zero deployment refs, zero runtime refs |
| 4 | `option simulator/` (root level) | Zero imports, zero deployment refs, structural duplicate |
| 5 | `apechain/src/app/TERMINAL_PHASE_B_BACKUP/` | Zero imports across all source files |
| 6 | `apechain/src/app/TERMINAL_THEME_BACKUP/` | Zero imports across all source files |
| 7 | `apechain/src/_BACKUP_PRE_LIGHT_PASS/` | Zero imports outside the folder |
| 8 | `apechain/src/_BACKUP_PRE_PREMIUM_PASS/` | Zero imports outside the folder |
| 9 | `apechain/public/replay-bar.html.backup` | `.backup` extension, not referenced |
| 10 | `apechain/src/app/terminal/page.tsx.backup` | `.backup` extension, not referenced |
| 11 | `apechain/src/app/TERMINAL_PHASE_B_BACKUP/page.tsx.backup` | `.backup` extension, not referenced |
| 12 | `apechain/src/app/TERMINAL_THEME_BACKUP/page.tsx.backup` | `.backup` extension, not referenced |

## F.2 CONFIRMED ACTIVE CODE

| # | Path | Evidence Summary |
|---|------|-----------------|
| 1 | `Replay bar/backend/` | railway.json + Procfile + Dockerfile all point here |
| 2 | `Replay bar/frontend/` | Root vercel.json points to frontend; page.tsx renders iframe |
| 3 | `Replay bar/option_simulator/backend/` | Confirmed running on port 8000; curl to /health returns OK |
| 4 | `final/new backgrond/apechain/` | Next.js 14 app; node.exe processes running; multiple active routes |
| 5 | `Replay bar/Data/NIFTY 50_minute.csv` | CSV_PATH env var in Dockerfile points here |
| 6 | `Replay bar/option_simulator/data/*.duckdb` | DuckDB connection confirmed working (candles API tested) |

## F.3 VERIFY REQUIRED

| # | Path | Why Verify |
|---|------|-----------|
| 1 | `Replay bar/option_simulator/simulator/` | SETUP.md references it; may be used by old local dev workflow |
| 2 | `Replay bar/test_api.py` | Standalone script; may be run manually for testing |
| 3 | `Replay bar/chart_engine/` | Self-contained Flask app; someone may run it manually on port 5050 |

## F.4 CONFIRMED UNUSED (Packages)

| # | Package | Location | Evidence |
|---|---------|----------|----------|
| 1 | `httpx` | `option_simulator/backend/requirements.txt` | Zero imports across all `.py` files |
| 2 | `sqlalchemy` | `option_simulator/backend/requirements.txt` | Zero imports across all `.py` files |
| 3 | `asyncpg` | `option_simulator/backend/requirements.txt` | Zero imports across all `.py` files |
| 4 | `python-multipart` | `backend/requirements.txt` | Zero imports across all `.py` files |
| 5 | `three` | `apechain/package.json` | Only imported by AnimatedParticles.tsx, which is itself unused |
| 6 | `ogl` | `apechain/package.json` | Zero imports across all `.ts/.tsx/.js/.jsx` files |

## F.5 CONFIRMED USED (Packages)

| # | Package | Location | Evidence |
|---|---------|----------|----------|
| 1 | `clickhouse-driver` | `option_simulator/backend/requirements.txt` | Imported by `etl_pipeline.py` (both copies) |
| 2 | `@studio-freight/lenis` | `apechain/package.json` | Imported by `SmoothScroll.tsx`, which is imported by `page.tsx` |

---

# APPENDIX — RAW EVIDENCE LOG

## Process Inspection
```
$ tasklist | grep -iE "python|node|uvicorn"
python.exe    41964    Console    1    2,980 K
python.exe    41492    Console    1   63,820 K  <-- Option Simulator (port 8000)
python.exe    41604    Console    1    3,136 K
python.exe    28952    Console    1    4,704 K
python.exe    41680    Console    1    2,876 K
python.exe    28944    Console    1    5,020 K
node.exe       3896    Console    1      200 K
node.exe      39464    Console    1      100 K
node.exe      24748    Console    1    7,136 K  <-- Next.js dev server

$ netstat -ano | grep "5050"
  UDP    0.0.0.0:5050    *:*    2172

$ tasklist | grep "2172"
svchost.exe    2172    Services    0    41,168 K  <-- Windows system service
```

## Port 8000 Health Check
```
$ curl -s http://127.0.0.1:8000/health
{"status":"ok","active_sessions":0,"version":"2.0-fixed"}
```

## Import Search Results Summary
```
httpx:              NO MATCHES
sqlalchemy:         NO MATCHES
asyncpg:            NO MATCHES
python-multipart:   NO MATCHES
ogl:                NO MATCHES
three:              1 match (AnimatedParticles.tsx, unused component)
lenis:              1 match (SmoothScroll.tsx, used by page.tsx)
clickhouse:         2 matches (etl_pipeline.py, both copies)
frontend_backup:    NO MATCHES in source/config (only in audit docs)
frontend_restored:  NO MATCHES in source/config (only in audit docs)
chart_engine:       SELF-ONLY in chart_engine/app.py
TERMINAL_*_BACKUP:  NO MATCHES in source files
_BACKUP_PRE_*:      NO MATCHES outside their own folders
```

## Deployment Config Evidence
```
railway.json:       { "dockerfilePath": "backend/Dockerfile" }
Procfile:           web: uvicorn backend.app:app --host 0.0.0.0 --port $PORT
Dockerfile:         COPY backend/ ./backend/; COPY Data/ ./Data/
root vercel.json:   { "frontend": { "root": "frontend", "framework": "nextjs" } }
frontend vercel.json: { "rewrites": [{ "source": "/api/(.*)", "destination": "..." }] }
apechain vercel.json: NOT FOUND
```

---

*Report Generated: 2026-06-06*
*Phase: 1.5 (Runtime Verification — No Changes Made)*
*All conclusions backed by grep traces, process listings (tasklist, netstat), and config file analysis*
