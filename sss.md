# Deployment Plan: Local FastAPI Backend + Vercel Frontend (Beta Access)
## Executive Summary
Deploy a trading platform where:
- **Frontend**: Next.js 14 app deployed on Vercel (already configured)
- **Backend**: FastAPI Option Simulator running on user's local Windows PC
- **Data**: 10GB DuckDB databases stay local on the PC
- **Access**: 5-10 beta users reach the backend via a public tunnel (Cloudflare Tunnel recommended)
- **WebSocket**: Real-time autoplay streaming works through the tunnel
---
## Architecture Overview
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                        │
│                                                                              │
│  ┌─────────────────────┐         ┌──────────────────────────────────────┐   │
│  │  Beta Users (5-10)  │         │  Vercel Edge Network                 │   │
│  │                     │         │  ┌────────────────────────────────┐  │   │
│  │  Browser ───────────┼────────►│  │  quantlab.vercel.app           │  │   │
│  │                     │  HTTPS  │  │  • Next.js 14 frontend         │  │   │
│  └─────────────────────┘         │  │  • Static simulator app        │  │   │
│                                  │  └────────────────────────────────┘  │   │
│                                  └──────────────────────────────────────┘   │
│                                           │                                  │
│                                           │ API calls + WebSocket            │
│                                           ▼                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Cloudflare Tunnel (cloudflared)                                     │    │
│  │  • Public URL: https://your-tunnel.trycloudflare.com                 │    │
│  │  • Secure HTTPS termination                                          │    │
│  │  • WebSocket passthrough (native support)                            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                           │                                  │
│                                           │ Local network (your PC)          │
│                                           ▼                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  YOUR WINDOWS PC (Local Machine)                                     │    │
│  │                                                                      │    │
│  │  ┌─────────────────────────┐    ┌─────────────────────────────────┐ │    │
│  │  │  FastAPI Backend        │    │  DuckDB Databases               │ │    │
│  │  │  Port: 8000             │◄──►│  • options_v3.duckdb (~9.5GB)   │ │    │
│  │  │  Bind: 0.0.0.0          │    │  • spot_v3.duckdb (~210MB)      │ │    │
│  │  │  CORS: tunnel + Vercel  │    │                                 │ │    │
│  │  │  WebSocket: /ws/{sid}   │    │  NOT uploaded to cloud          │ │    │
│  │  └─────────────────────────┘    └─────────────────────────────────┘ │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```
---
## Why Cloudflare Tunnel (NOT Ngrok)
| Factor | Cloudflare Tunnel | Ngrok Free |
|--------|-------------------|------------|
| **Price** | Completely free | Free tier limited |
| **Custom domain** | Yes (with Cloudflare DNS) | No (random URLs) |
| **WebSocket** | Native support, no config | Works but less reliable |
| **Connection stability** | Persistent, auto-reconnect | Times out after 2 hours |
| **Bandwidth** | Unlimited | 1GB/month limit |
| **Security** | Built-in HTTPS + auth | Basic HTTPS only |
| **Windows support** | Native binary | Native binary |
| **Concurrent users** | No limit | Connection limits |
**Recommendation: Cloudflare Tunnel** — it's free, unlimited, has native WebSocket support, and doesn't require exposing your PC's IP.
---
## Step 1: FastAPI Backend Configuration Changes
### File: `Replay bar/option_simulator/backend/app/main.py`
#### Change 1: CORS Origins (Lines 42-47)
**Current:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,http://localhost:3002,http://127.0.0.1:3002").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
```
**New:**
```python
# CORS: Allow Vercel frontend + Cloudflare tunnel + local dev
_default_origins = (
    "http://localhost:5173,http://127.0.0.1:5173,"
    "http://localhost:3000,http://127.0.0.1:3000,"
    "http://localhost:3001,http://127.0.0.1:3001,"
    "http://localhost:3002,http://127.0.0.1:3002"
)
_cors_origins = os.getenv("CORS_ORIGINS", _default_origins).split(",")
# Always ensure Vercel production domain is allowed
_vercel_domain = os.getenv("VERCEL_DOMAIN", "")
if _vercel_domain and _vercel_domain not in _cors_origins:
    _cors_origins.append(_vercel_domain)
# Allow all origins in beta (remove for production hardening)
_allow_all = os.getenv("CORS_ALLOW_ALL", "false").lower() == "true"
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if _allow_all else _cors_origins,
    allow_credentials=True if not _allow_all else False,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
#### Change 2: Host Binding (Lines 30-36, `__main__` block)
**Current:**
```python
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
```
**New:**
```python
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    reload_mode = os.environ.get("UVICORN_RELOAD", "false").lower() == "true"
    print("\n" + "=" * 60)
    print(f"  Option Simulator API (FastAPI)  --  Starting on {host}:{port}")
    print(f"  WebSocket: ws://{host}:{port}/ws/{{session_id}}")
    print(f"  Health:    http://{host}:{port}/health")
    print("=" * 60 + "\n")
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=reload_mode,
        ws_ping_interval=20.0,
        ws_ping_timeout=10.0,
    )
```
#### Change 3: Add startup health log (after app creation, line ~48)
**New code to insert:**
```python
@app.on_event("startup")
async def startup_event():
    """Log configuration on startup for debugging."""
    import socket
    hostname = socket.gethostname()
    local_ip = socket.getaddrinfo(hostname, None)[0][4][0]
    print(f"[STARTUP] Hostname: {hostname}")
    print(f"[STARTUP] Local IP: {local_ip}")
    print(f"[STARTUP] CORS origins: {_cors_origins}")
    print(f"[STARTUP] DuckDB path: {DB_PATH}")
```
---
## Step 2: Environment Variables File
### New File: `Replay bar/option_simulator/backend/.env`
```
# ─── Server Configuration ──────────────────────────────────────
PORT=8000
HOST=0.0.0.0
UVICORN_RELOAD=false
# ─── CORS Configuration ────────────────────────────────────────
# Set to "true" for beta (allows all origins). Set "false" + specify domains for production.
CORS_ALLOW_ALL=true
# When CORS_ALLOW_ALL=false, list exact origins:
# CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
# VERCEL_DOMAIN=https://your-app.vercel.app
# ─── Data Paths ────────────────────────────────────────────────
# These stay local — NEVER upload to GitHub
DUCKDB_OPTIONS_PATH=./data/options_v3.duckdb
DUCKDB_SPOT_PATH=./data/spot_v3.duckdb
# ─── Session Management ────────────────────────────────────────
MAX_SESSIONS=100
SESSION_TTL_HOURS=2
```
### New File: `Replay bar/option_simulator/backend/.env.example` (safe template for GitHub)
```
# Copy this to .env and fill in your values
PORT=8000
HOST=0.0.0.0
UVICORN_RELOAD=false
# CORS: Set to "true" for beta, "false" for production with specific domains
CORS_ALLOW_ALL=true
# CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
# VERCEL_DOMAIN=https://your-app.vercel.app
# Data paths (local only — do not commit .env with real paths)
DUCKDB_OPTIONS_PATH=./data/options_v3.duckdb
DUCKDB_SPOT_PATH=./data/spot_v3.duckdb
```
---
## Step 3: Update .gitignore
### File: `Replay bar/option_simulator/backend/.gitignore` (NEW)
```gitignore
# Environment variables (contains sensitive config)
.env
# DuckDB databases (10GB+ — NEVER commit)
*.duckdb
*.duckdb.wal
# Data directory
data/
# Python cache
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
# Virtual environments
venv/
.venv/
env/
# IDE
.vscode/
.idea/
*.swp
*.swo
# OS
.DS_Store
Thumbs.db
```
### Update Root `.gitignore` to exclude data files globally:
```gitignore
# DuckDB databases (large files — never upload)
*.duckdb
*.duckdb.wal
# CSV data files
*.csv
# Environment files
.env
.env.local
.env.production
```
---
## Step 4: Vercel Frontend Configuration
### File: `final/new backgrond/apechain/.env.local` (NEW — for local dev)
```
# API Base URL for local development
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_WS_BASE_URL=ws://127.0.0.1:8000
```
### File: `final/new backgrond/apechain/.env.production` (NEW — for Vercel deployment)
```
# API Base URL for production (points to your Cloudflare Tunnel)
# UPDATE THIS after setting up cloudflared:
NEXT_PUBLIC_API_BASE_URL=https://your-tunnel.trycloudflare.com
NEXT_PUBLIC_WS_BASE_URL=wss://your-tunnel.trycloudflare.com
```
### File: `final/new backgrond/apechain/next.config.mjs` (UPDATE)
**Current:**
```js
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};
export default nextConfig;
```
**New:**
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  
  // Environment variables available at build time
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000',
    NEXT_PUBLIC_WS_BASE_URL: process.env.NEXT_PUBLIC_WS_BASE_URL || 'ws://127.0.0.1:8000',
  },
  
  // CORS headers for API routes (if you add any serverless functions later)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
        ],
      },
    ];
  },
};
export default nextConfig;
```
---
## Step 5: Simulator App — Rebuild with Dynamic API URL
**CRITICAL ISSUE**: The compiled simulator app (`public/simulator-app/`) has hardcoded `http://127.0.0.1:8000` and `ws://localhost:8000` URLs baked into the minified JS. This MUST be rebuilt.
### Find the simulator source code:
The source for `public/simulator-app/` is likely in a separate Vite React project. You need to:
1. **Find the source project** (look for a `vite.config.ts` or `vite.config.js` file)
2. **Update the API configuration** to use environment variables:
```typescript
// In your simulator source (e.g., src/config/api.ts)
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const WS_BASE = import.meta.env.VITE_WS_BASE_URL || 'ws://127.0.0.1:8000';
export const API_URLS = {
  sessionInit: `${API_BASE}/api/v1/session/init`,
  sessionAction: `${API_BASE}/api/v1/session/action`,
  positionAdd: `${API_BASE}/api/v1/session/position/add`,
  positionClose: `${API_BASE}/api/v1/session/position/close`,
  positionSLTP: `${API_BASE}/api/v1/session/position/sltp`,
  strategyBuild: `${API_BASE}/api/v1/session/strategy/build`,
  nextDay: `${API_BASE}/api/v1/session/next_day`,
  analytics: `${API_BASE}/api/v1/session/analytics`,
  chain: `${API_BASE}/api/v1/chain`,
  candles: `${API_BASE}/api/v1/candles`,
  deltaStrike: `${API_BASE}/api/v1/chain/delta-strike`,
  health: `${API_BASE}/health`,
  websocket: (sessionId: string) => `${WS_BASE}/ws/${sessionId}`,
};
```
3. **Create `.env` for simulator build:**
```
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_WS_BASE_URL=ws://127.0.0.1:8000
```
4. **For production build** (before deploying to Vercel):
```
VITE_API_BASE_URL=https://your-tunnel.trycloudflare.com
VITE_WS_BASE_URL=wss://your-tunnel.trycloudflare.com
```
5. **Rebuild and copy to Next.js public folder:**
```bash
# In simulator source directory
npm run build
# Copy dist/ contents to final/new backgrond/apechain/public/simulator-app/
```
---
## Step 6: Cloudflare Tunnel Setup (Windows)
### 6.1 Install cloudflared
```powershell
# Download cloudflared for Windows
# https://github.com/cloudflare/cloudflared/releases/latest
# Download cloudflared-windows-amd64.exe
# Rename and move to a convenient location
Rename-Item cloudflared-windows-amd64.exe cloudflared.exe
# Move to C:\Tools\ or add to PATH
```
### 6.2 Authenticate (one-time)
```powershell
cloudflared.exe tunnel login
# This opens a browser to authenticate with your Cloudflare account
```
### 6.3 Create a tunnel
```powershell
cloudflared.exe tunnel create option-sim-beta
# Saves credentials file: %USERPROFILE%\.cloudflared\<tunnel-id>.json
```
### 6.4 Configure the tunnel
Create file: `%USERPROFILE%\.cloudflared\config.yml`
```yaml
tunnel: <your-tunnel-id-from-step-6.3>
credentials-file: C:\Users\<your-username>\.cloudflared\<tunnel-id>.json
# Ingress rules: Map public URL to local FastAPI
ingress:
  # WebSocket endpoint — MUST be before catch-all
  - hostname: your-tunnel.trycloudflare.com
    path: /ws/*
    service: http://localhost:8000
    originRequest:
      noTLSVerify: true
      http2Origin: true
  
  # All other API endpoints
  - hostname: your-tunnel.trycloudflare.com
    service: http://localhost:8000
    originRequest:
      noTLSVerify: true
  
  # Catch-all (required)
  - service: http_status:404
```
### 6.5 Run the tunnel
```powershell
cloudflared.exe tunnel run option-sim-beta
```
### 6.6 (Optional) Install as Windows Service for auto-start
```powershell
cloudflared.exe service install
# Then configure the service to auto-start
sc config cloudflared start= auto
```
---
## Step 7: Start the Backend
### 7.1 Activate virtual environment
```powershell
cd "Replay bar\option_simulator\backend"
.\venv\Scripts\activate  # or however you manage Python env
```
### 7.2 Install dependencies (if not already)
```powershell
pip install -r requirements.txt
# Also install duckdb if missing from requirements
pip install duckdb
```
### 7.3 Set environment and run
```powershell
$env:PORT="8000"
$env:HOST="0.0.0.0"
$env:CORS_ALLOW_ALL="true"
$env:UVICORN_RELOAD="false"
python -m app.main
```
### 7.4 Verify it's listening on all interfaces
```powershell
# In another terminal
netstat -an | findstr 8000
# Should show: 0.0.0.0:8000  LISTENING
```
---
## Step 8: Vercel Deployment
### 8.1 Set environment variables in Vercel Dashboard
Go to Project Settings → Environment Variables:
| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://your-tunnel.trycloudflare.com` | Production |
| `NEXT_PUBLIC_WS_BASE_URL` | `wss://your-tunnel.trycloudflare.com` | Production |
| `NEXT_PUBLIC_API_BASE_URL` | `http://127.0.0.1:8000` | Development |
| `NEXT_PUBLIC_WS_BASE_URL` | `ws://127.0.0.1:8000` | Development |
### 8.2 Deploy
```bash
cd "final/new backgrond/apechain"
vercel --prod
```
---
## Step 9: Verification Checklist
### Backend Verification
- [ ] FastAPI starts on `0.0.0.0:8000` (not `127.0.0.1`)
- [ ] `netstat` shows `0.0.0.0:8000` listening
- [ ] Health endpoint works locally: `curl http://localhost:8000/health`
- [ ] Health endpoint works from another device on same network: `curl http://<your-pc-ip>:8000/health`
- [ ] CORS headers present in responses
- [ ] DuckDB files are NOT in git: `git status` shows them ignored
### Tunnel Verification
- [ ] Cloudflare Tunnel is running
- [ ] Public URL responds: `curl https://your-tunnel.trycloudflare.com/health`
- [ ] WebSocket connects: Use online WS tester with `wss://your-tunnel.trycloudflare.com/ws/test`
### Frontend Verification
- [ ] Vercel deployment succeeds
- [ ] Frontend loads without errors
- [ ] Simulator iframe loads
- [ ] API calls go to tunnel URL (check browser Network tab)
- [ ] WebSocket connects and receives frames
### End-to-End Verification
- [ ] Create session via frontend → backend responds
- [ ] Option chain loads
- [ ] Add position works
- [ ] WebSocket autoplay streams frames
- [ ] Replay jump/seek works
---
## Step 10: Security Recommendations
### For Beta (Current Phase)
1. **CORS_ALLOW_ALL=true** is acceptable for 5-10 trusted beta users
2. **Share the Vercel URL** with beta users, not the tunnel URL directly
3. **Monitor tunnel logs** for abuse: `cloudflared.exe tunnel tail option-sim-beta`
### For Production (Future)
1. Set `CORS_ALLOW_ALL=false`
2. Set `CORS_ORIGINS` to exact Vercel domain only
3. Add API key authentication to FastAPI endpoints
4. Implement rate limiting
5. Use Cloudflare Access (Zero Trust) to restrict tunnel access
6. Move to dedicated server or Railway/Fly.io with volume mounts for DuckDB
---
## Troubleshooting
### Issue: "Connection refused" from tunnel
- Check FastAPI is binding to `0.0.0.0` not `127.0.0.1`
- Check Windows Firewall allows port 8000
- Run: `netsh advfirewall firewall add rule name="FastAPI" dir=in action=allow protocol=tcp localport=8000`
### Issue: WebSocket disconnects immediately
- Cloudflare Tunnel supports WebSocket natively — check `http2Origin: true` in config
- Check FastAPI WebSocket ping settings
- Verify `wss://` (not `ws://`) when using HTTPS tunnel
### Issue: CORS errors in browser
- Check `CORS_ALLOW_ALL=true` is set
- Verify the tunnel URL is in CORS origins
- Check browser console for exact error
### Issue: DuckDB not found
- Verify `.env` has correct paths
- Check `reader.py` path resolution logic
- Ensure DuckDB files are in expected location
---
## Files to Modify Summary
| File | Action | Purpose |
|------|--------|---------|
| `option_simulator/backend/app/main.py` | Edit | CORS, host binding, startup logging |
| `option_simulator/backend/.env` | Create | Environment variables |
| `option_simulator/backend/.env.example` | Create | Safe template for GitHub |
| `option_simulator/backend/.gitignore` | Create | Exclude .env and .duckdb |
| `option_simulator/backend/requirements.txt` | Edit | Add `duckdb` if missing |
| `final/new backgrond/apechain/.env.local` | Create | Local dev API URLs |
| `final/new backgrond/apechain/.env.production` | Create | Production API URLs |
| `final/new backgrond/apechain/next.config.mjs` | Edit | Build-time env vars |
| `final/new backgrond/apechain/public/simulator-app/` | Rebuild | Update hardcoded API URLs |
| Root `.gitignore` | Edit | Global excludes for data files |
---
## GitHub Push Instructions
After making all changes, push to the new repo:
```bash
# Remove old origin (if switching repos)
git remote remove origin
# Add new origin
git remote add origin https://github.com/DevGohil411/Replay-bar.git
# Verify .gitignore is working — DuckDB files should NOT appear
git status
# Stage and commit
git add .
git commit -m "deploy: configure for Vercel + local FastAPI + Cloudflare Tunnel"
# Force push (since you want to replace old repo contents)
git push -f origin main
```
**IMPORTANT**: Before pushing, verify:
- [ ] `git status` does NOT show `.duckdb` files
- [ ] `git status` does NOT show `.env` files
- [ ] `git status` does NOT show CSV data file