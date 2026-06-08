"""
Options Simulator — FastAPI Application
=========================================
Main HTTP + WebSocket entry point.

Endpoints:
    POST /api/v1/session/init          — Create replay session
    POST /api/v1/session/action        — Dispatch replay action (jump, seek, play, pause)
    POST /api/v1/session/position/add  — Add an option leg to portfolio
    POST /api/v1/session/position/close — Close/partial-close a leg
    GET  /api/v1/chain                 — Get enriched option chain at a timestamp
    WS   /ws/{session_id}              — Real-time streaming for autoplay

Run:
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
"""

import asyncio
import json
import os
from datetime import date, datetime
from typing import Optional
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from app.data.reader import OptionChainReader
from app.quant.greeks import price_chain, OptionChainAnalytics
from app.quant.execution import ExecutionMode
from app.engine.replay import ReplaySession, ReplayAction, SessionFrame

# ─── APP SETUP ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Institutional Options Simulator",
    description="Sub-10ms historical replay with exact OHLC timestamps",
    version="1.0.0",
)

# ─── CORS CONFIGURATION ────────────────────────────────────────────────────────
# Allow all local dev origins + match any Vercel preview deployment via regex
_cors_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
    "https://sihl-terminal12.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store (use Redis in production)
_sessions: dict[str, ReplaySession] = {}
_session_created_at: dict[str, datetime] = {}
_reader = OptionChainReader()

MAX_SESSIONS = 100
SESSION_TTL_HOURS = 2

def _cleanup_old_sessions():
    """Remove expired sessions to prevent memory leaks."""
    now = datetime.now()
    expired = [
        sid for sid, created in _session_created_at.items()
        if (now - created).total_seconds() > SESSION_TTL_HOURS * 3600
    ]
    for sid in expired:
        _sessions.pop(sid, None)
        _session_created_at.pop(sid, None)

def _register_session(session: ReplaySession):
    """Register a new session with cleanup."""
    _cleanup_old_sessions()
    # If at capacity, remove oldest
    if len(_sessions) >= MAX_SESSIONS:
        oldest_sid = min(_session_created_at, key=_session_created_at.get)
        _sessions.pop(oldest_sid, None)
        _session_created_at.pop(oldest_sid, None)
    _sessions[session.session_id] = session
    _session_created_at[session.session_id] = datetime.now()


# ─── PYDANTIC MODELS ───────────────────────────────────────────────────────────
class InitSessionRequest(BaseModel):
    underlying: str = "NIFTY"
    session_date: date
    execution_mode: str = "CLOSE"
    slippage_bps: int = Field(default=0, ge=0)
    slippage_model: str = "FIXED"  # FIXED | VOLATILITY_ADJUSTED | LIQUIDITY_ADJUSTED
    default_expiry: Optional[date] = None
    num_strikes: int = Field(default=15, ge=1)


class ActionRequest(BaseModel):
    session_id: str
    action: str           # ReplayAction enum value
    minutes: Optional[int] = None
    timestamp: Optional[datetime] = None


class NextDayRequest(BaseModel):
    session_id: str
    direction: str = "next"  # "next" or "prev"


class AddPositionRequest(BaseModel):
    session_id: str
    strike: int
    option_type: str      # CE or PE
    direction: str        # BUY or SELL
    qty: int
    execution_mode: Optional[str] = None


class ClosePositionRequest(BaseModel):
    session_id: str
    leg_id: str
    qty: Optional[int] = None


class UpdateSLTPRequest(BaseModel):
    session_id: str
    leg_id: str
    sl_price: Optional[float] = None
    tp_price: Optional[float] = None
    sl_mode: Optional[str] = "CLOSE"
    tp_mode: Optional[str] = "CLOSE"


class StrategyBuildRequest(BaseModel):
    session_id: str
    template: str  # SHORT_STRADDLE, LONG_STRANGLE, IRON_CONDOR, etc.
    qty: int = Field(default=1, ge=1)
    wing_intervals: int = Field(default=4, ge=1)
    spread_intervals: int = Field(default=2, ge=1)


class DeltaStrikeRequest(BaseModel):
    underlying: str = "NIFTY"
    expiry: Optional[date] = None
    timestamp: Optional[datetime] = None
    option_type: str = "CE"   # CE or PE
    target_delta: float = 0.30
    side: str = "closest"     # closest | above | below


# ─── SERIALIZATION HELPER ──────────────────────────────────────────────────────
from fastapi.encoders import jsonable_encoder

import math

def _replace_nan(obj):
    if isinstance(obj, float):
        if math.isnan(obj):
            return None
        if math.isinf(obj):
            return 999999.99 if obj > 0 else -999999.99
    elif isinstance(obj, dict):
        return {k: _replace_nan(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_replace_nan(item) for item in obj]
    return obj

def _serialize_frame(frame: SessionFrame) -> dict:
    """Converts a SessionFrame to a JSON-safe dict, replacing NaN with None."""
    data = {
        "session_id": frame.session_id,
        "current_timestamp": frame.current_timestamp,
        "frame_number": frame.frame_number,
        "underlying": frame.underlying,
        "spot": {
            "open": frame.spot_open,
            "high": frame.spot_high,
            "low": frame.spot_low,
            "close": frame.spot_close,
            "previous_day_close": frame.previous_day_close,
        },
        "future_price": frame.future_price,
        "vix_close": frame.vix_close,
        "lot_size": frame.lot_size,
        "net_pnl": frame.net_pnl,
        "positions": frame.positions,
        "greek_exposure": frame.greek_exposure,
        "option_chain_summary": frame.option_chain_summary,
        "chain_data": frame.chain_data,
        "available_expiries": frame.available_expiries,
        "active_expiry": frame.active_expiry,
        "pcr": frame.pcr,
        "max_pain_strike": frame.max_pain_strike,
        "gex": frame.gex,
        "sl_tp_events": frame.sl_tp_events,
    }
    encoded = jsonable_encoder(data)
    return _replace_nan(encoded)


# ─── SESSION ENDPOINTS ─────────────────────────────────────────────────────────
@app.post("/api/v1/session/init")
def init_session(req: InitSessionRequest):
    """
    Creates a new replay session.

    Example:
        POST /api/v1/session/init
        {
            "underlying": "NIFTY",
            "session_date": "2026-05-04",
            "execution_mode": "MID",
            "slippage_bps": 5
        }
    """
    try:
        session = ReplaySession(
            underlying=req.underlying,
            session_date=req.session_date,
            execution_mode=req.execution_mode,
            slippage_bps=req.slippage_bps,
            slippage_model=req.slippage_model,
            default_expiry=req.default_expiry,
            num_strikes=req.num_strikes,
            reader=_reader,
        )
        _register_session(session)

        # Return initial frame at current cursor (first available timestamp)
        frame = session._build_frame()
        return {"status": "ok", "session": _serialize_frame(frame)}

    except ValueError as e:
        print(f"DEBUG: ValueError during init_session: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"DEBUG: Exception during init_session: {e}")
        raise HTTPException(status_code=500, detail=f"Session init failed: {e}")


def _get_next_trading_day(current_date: date, direction: int = 1) -> date:
    """Finds the next/previous trading day (skips weekends)."""
    from datetime import timedelta
    delta = timedelta(days=1)
    candidate = current_date + delta * direction
    # Skip weekends
    while candidate.weekday() >= 5:  # 5=Sat, 6=Sun
        candidate += delta * direction
    return candidate


@app.post("/api/v1/session/next_day")
def next_day(req: NextDayRequest):
    """
    Moves session to next/previous trading day with positions carried forward.
    
    Example:
        POST /api/v1/session/next_day
        {"session_id": "...", "direction": "next"}
    """
    session = _sessions.get(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Save positions to carry forward
    positions_to_carry = list(session.positions)
    underlying = session.underlying
    execution_mode = session._exec_engine.mode.value
    slippage_bps = session._exec_engine.slippage_bps
    num_strikes = session._num_strikes
    
    # Calculate next/prev trading day
    direction = 1 if req.direction == "next" else -1
    new_date = _get_next_trading_day(session.session_date, direction)
    
    try:
        # Create new session for the new date
        new_session = ReplaySession(
            underlying=underlying,
            session_date=new_date,
            execution_mode=execution_mode,
            slippage_bps=slippage_bps,
            num_strikes=num_strikes,
            reader=_reader,
        )
        _register_session(new_session)
        
        # Carry forward positions (deep copy to avoid shared state with old session)
        new_session.positions = [dict(p) for p in positions_to_carry]
        
        # Clean up old session to prevent memory leak
        _sessions.pop(req.session_id, None)
        _session_created_at.pop(req.session_id, None)
        
        # Build frame with carried positions
        frame = new_session._build_frame()
        return {
            "status": "ok",
            "message": f"Moved to {new_date.isoformat()}",
            "previous_session_id": req.session_id,
            "new_session_id": new_session.session_id,
            "session": _serialize_frame(frame)
        }
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=f"No data for {new_date}: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Next day failed: {e}")


@app.post("/api/v1/session/action")
def dispatch_action(req: ActionRequest):
    """
    Dispatches a replay action (jump, seek, SOD, EOD, play, pause).

    Example — Jump forward 5 minutes:
        POST /api/v1/session/action
        {
            "session_id": "...",
            "action": "JUMP",
            "minutes": 5
        }

    Example — Seek to absolute timestamp:
        POST /api/v1/session/action
        {
            "session_id": "...",
            "action": "SEEK",
            "timestamp": "2026-05-04T11:30:00"
        }
    """
    session = _sessions.get(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        action = ReplayAction(req.action)
        frame = session.dispatch(action, minutes=req.minutes, timestamp=req.timestamp)
        return {"status": "ok", "frame": _serialize_frame(frame)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid action: {e}")


@app.post("/api/v1/session/position/add")
def add_position(req: AddPositionRequest):
    """Opens a new option leg in the portfolio. Returns updated full frame."""
    session = _sessions.get(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    result = session.add_position(
        strike=req.strike,
        option_type=req.option_type.upper(),
        direction=req.direction.upper(),
        qty=req.qty,
        execution_mode=req.execution_mode,
    )

    if "error" in result:
        raise HTTPException(status_code=422, detail=result["error"])

    # Return updated full frame so frontend can update immediately
    frame = session._build_frame()
    return {"status": "ok", "leg": result, "frame": _serialize_frame(frame)}


@app.post("/api/v1/session/position/sltp")
def update_sltp(req: UpdateSLTPRequest):
    """Updates Stop-Loss and/or Take-Profit prices for a position leg."""
    session = _sessions.get(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    result = session.update_leg_sl_tp(
        leg_id=req.leg_id,
        sl_price=req.sl_price,
        tp_price=req.tp_price,
        sl_mode=req.sl_mode,
        tp_mode=req.tp_mode,
    )
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    frame = session._build_frame()
    return {"status": "ok", "sltp_result": result, "frame": _serialize_frame(frame)}


@app.post("/api/v1/session/position/close")
def close_position(req: ClosePositionRequest):
    """Closes or partially closes a position leg. Returns updated full frame."""
    session = _sessions.get(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Debug: log positions before close
    print(f"DEBUG close_position: session={req.session_id}, leg_id={req.leg_id}, positions={[p['leg_id'] for p in session.positions]}")
    
    result = session.close_position(leg_id=req.leg_id, qty=req.qty)

    if "error" in result:
        print(f"DEBUG close_position ERROR: {result['error']}")
        raise HTTPException(status_code=404, detail=result["error"])

    # Return updated full frame so frontend can update immediately
    frame = session._build_frame()
    return {"status": "ok", "close_result": result, "frame": _serialize_frame(frame)}


@app.post("/api/v1/session/strategy/build")
def build_strategy(req: StrategyBuildRequest):
    """
    Builds a multi-leg strategy from a named template.

    Templates:
        SHORT_STRADDLE, LONG_STRADDLE,
        SHORT_STRANGLE, LONG_STRANGLE,
        IRON_CONDOR, IRON_FLY,
        BULL_CALL_SPREAD, BEAR_PUT_SPREAD
    """
    session = _sessions.get(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        legs = session.build_strategy(
            template=req.template,
            params={"qty": req.qty, "wing_intervals": req.wing_intervals, "spread_intervals": req.spread_intervals},
        )
        frame = session._build_frame()
        return {
            "status": "ok",
            "template": req.template,
            "legs": legs,
            "frame": _serialize_frame(frame),
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Strategy build failed: {e}")


@app.get("/api/v1/session/analytics")
def get_analytics(session_id: str):
    """Returns advanced analytics for the current session."""
    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        analytics = session.compute_analytics()
        return {"status": "ok", "analytics": analytics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics computation failed: {e}")


@app.post("/api/v1/chain/delta-strike")
def find_delta_strike(req: DeltaStrikeRequest):
    """
    Finds the strike closest to a target delta value.
    Useful for delta-based strategy building.
    """
    if not req.timestamp:
        raise HTTPException(status_code=400, detail="timestamp is required")
    if not req.expiry:
        expiries = _reader.get_available_expiries(underlying=req.underlying, as_of_date=req.timestamp.date())
        if not expiries:
            raise HTTPException(status_code=404, detail="No expiries found")
        req.expiry = expiries[0]

    spot = _reader.get_spot_at_timestamp(underlying=req.underlying, timestamp=req.timestamp)
    if not spot:
        raise HTTPException(status_code=404, detail="No spot data found")

    atm = OptionChainReader.calculate_atm_strike(spot.close, req.underlying)
    raw_chain = _reader.get_option_chain(
        underlying=req.underlying, expiry=req.expiry, timestamp=req.timestamp,
        atm_strike=atm, num_strikes=25,  # Wider search for delta
    )
    enriched = price_chain(spot=spot.close, chain_df=raw_chain, expiry=req.expiry, timestamp=req.timestamp)

    if enriched.is_empty() or "delta" not in enriched.columns:
        raise HTTPException(status_code=404, detail="No Greeks data available")

    filtered = enriched.filter(pl.col("option_type") == req.option_type)
    if filtered.is_empty():
        raise HTTPException(status_code=404, detail=f"No {req.option_type} data available")

    best_strike = None
    best_diff = float("inf")

    for row in filtered.iter_rows(named=True):
        delta = abs(row["delta"]) if req.option_type == "PE" else row["delta"]
        diff = abs(delta - req.target_delta)

        if req.side == "above" and delta < req.target_delta:
            continue
        if req.side == "below" and delta > req.target_delta:
            continue

        if diff < best_diff:
            best_diff = diff
            best_strike = int(row["strike"])

    if best_strike is None:
        raise HTTPException(status_code=404, detail="No strike matching delta criteria found")

    return {
        "strike": best_strike,
        "target_delta": req.target_delta,
        "actual_delta": float(filtered.filter(pl.col("strike") == best_strike)["delta"][0]),
        "option_type": req.option_type,
    }


# ─── CANDLES ENDPOINT (Spot OHLC for Charts) ───────────────────────────────────
@app.get("/api/v1/candles")
def get_candles(
    underlying: str = "NIFTY",
    session_date: Optional[date] = None,
    tf: str = "5m",  # timeframe: 1m, 5m, 15m, 30m, 1h, 1d
):
    """
    Returns spot OHLC candles for charting.
    
    Query params:
        underlying:   NIFTY, BANKNIFTY, etc.
        session_date: Date for which to fetch candles
        tf:           Timeframe — 1m, 5m, 15m, 30m, 1h, 1d
    """
    if not session_date:
        raise HTTPException(status_code=400, detail="session_date is required")
    
    # Map timeframe to DuckDB interval
    interval_map = {
        "1m": "1 minute",
        "5m": "5 minutes",
        "15m": "15 minutes",
        "30m": "30 minutes",
        "1h": "1 hour",
        "1d": "1 day",
    }
    
    interval = interval_map.get(tf)
    if not interval:
        raise HTTPException(status_code=400, detail=f"Invalid timeframe: {tf}. Supported: {list(interval_map.keys())}")
    
    try:
        cursor = _reader.con.cursor()
        
        # For 1m, return raw data; for others, aggregate
        if tf == "1m":
            rows = cursor.execute("""
                SELECT timestamp, open, high, low, close, volume
                FROM spot_db.historical_spot
                WHERE underlying = ? 
                  AND timestamp >= ?::TIMESTAMP 
                  AND timestamp < (?::DATE + INTERVAL 1 DAY)::TIMESTAMP
                ORDER BY timestamp ASC
            """, (underlying, session_date, session_date)).fetchall()
        else:
            # Aggregate candles using DuckDB - use date_trunc for compatibility
            trunc_unit = {
                "5m": "hour", "15m": "hour", "30m": "hour",
                "1h": "hour", "1d": "day"
            }.get(tf, "hour")
            
            rows = cursor.execute(f"""
                SELECT 
                    date_trunc('{trunc_unit}', timestamp) as bucket,
                    FIRST(open) as open,
                    MAX(high) as high,
                    MIN(low) as low,
                    LAST(close) as close,
                    SUM(volume) as volume
                FROM spot_db.historical_spot
                WHERE underlying = ? 
                  AND timestamp >= ?::TIMESTAMP 
                  AND timestamp < (?::DATE + INTERVAL 1 DAY)::TIMESTAMP
                GROUP BY bucket
                ORDER BY bucket ASC
            """, (underlying, session_date, session_date)).fetchall()
        
        cursor.close()
        
        candles = []
        for row in rows:
            candles.append({
                "timestamp": row[0].isoformat() if hasattr(row[0], 'isoformat') else str(row[0]),
                "open": float(row[1]),
                "high": float(row[2]),
                "low": float(row[3]),
                "close": float(row[4]),
                "volume": int(row[5]) if row[5] else 0,
            })
        
        return {
            "underlying": underlying,
            "session_date": session_date.isoformat(),
            "timeframe": tf,
            "count": len(candles),
            "candles": candles,
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch candles: {e}")


# ─── OPTION CHAIN ENDPOINT ─────────────────────────────────────────────────────
@app.get("/api/v1/chain")
def get_chain(
    underlying: str = "NIFTY",
    expiry: Optional[date] = None,
    timestamp: Optional[datetime] = None,
    num_strikes: int = 15,
):
    """
    Returns enriched option chain (OHLC + IV + Greeks) at a given timestamp.
    Does NOT require an active session.
    """
    if not timestamp:
        raise HTTPException(status_code=400, detail="timestamp is required")
    if not expiry:
        expiries = _reader.get_available_expiries(underlying=underlying, as_of_date=timestamp.date())
        if not expiries:
            raise HTTPException(status_code=404, detail="No expiries found")
        expiry = expiries[0]

    spot = _reader.get_spot_at_timestamp(underlying=underlying, timestamp=timestamp)
    if not spot:
        raise HTTPException(status_code=404, detail="No spot data found for this timestamp")

    atm = OptionChainReader.calculate_atm_strike(spot.close, underlying)
    raw_chain = _reader.get_option_chain(
        underlying=underlying, expiry=expiry, timestamp=timestamp,
        atm_strike=atm, num_strikes=num_strikes,
    )
    enriched = price_chain(spot=spot.close, chain_df=raw_chain, expiry=expiry, timestamp=timestamp)

    pcr = OptionChainAnalytics.put_call_ratio(enriched) if not enriched.is_empty() else {"pcr": 1.0}
    gex = OptionChainAnalytics.gamma_exposure(enriched, spot=spot.close) if "gamma" in enriched.columns else 0.0

    return {
        "timestamp": timestamp.isoformat(),
        "spot": {"open": spot.open, "high": spot.high, "low": spot.low, "close": spot.close},
        "atm_strike": atm,
        "expiry": expiry.isoformat(),
        "pcr": pcr,
        "gex": gex,
        "chain": enriched.to_dicts(),
    }


# ─── WEBSOCKET AUTOPLAY ────────────────────────────────────────────────────────
@app.websocket("/ws/{session_id}")
async def websocket_autoplay(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for autoplay replay streaming.
    
    ARCHITECTURE:
        - Separate receive loop and ticker task via asyncio.Queue
        - No race conditions between commands and autoplay ticks
        - Frame sequence numbers for client validation
        - Deterministic timing: ticker interval is fixed, processing time subtracted
    
    Client message format:
        {"command": "play", "speed": 1}      — 1x speed (1 frame/sec)
        {"command": "pause"}
        {"command": "jump", "minutes": 5}
        {"command": "seek", "timestamp": "2026-05-04T11:30:00"}
    """
    await websocket.accept()

    session = _sessions.get(session_id)
    if not session:
        await websocket.send_json({"error": "Session not found"})
        await websocket.close()
        return

    # Send initial frame immediately on connection
    initial_frame = session._build_frame()
    await websocket.send_json(_serialize_frame(initial_frame))

    # Shared state between receive loop and ticker
    cmd_queue = asyncio.Queue()
    is_playing = False
    speed = 1  # Frames per second (validated: 1-20)
    ticker_task = None

    async def ticker_loop():
        """Dedicated autoplay ticker. Runs independently of receive loop."""
        nonlocal is_playing, speed
        while True:
            if not is_playing:
                await asyncio.sleep(0.1)
                continue
            
            # Calculate interval based on speed
            interval = max(0.05, 1.0 / speed)  # Min 50ms interval
            start_time = asyncio.get_event_loop().time()
            
            # Dispatch STEP and send frame
            frame = session.dispatch(ReplayAction.STEP)
            await websocket.send_json(_serialize_frame(frame))
            
            if session.state == SessionState.COMPLETED:
                is_playing = False
                await websocket.send_json({"event": "eod_reached"})
                continue
            
            # Subtract processing time from interval for consistent speed
            elapsed = asyncio.get_event_loop().time() - start_time
            sleep_time = max(0, interval - elapsed)
            await asyncio.sleep(sleep_time)

    async def receive_loop():
        """Dedicated receive loop. Puts commands on queue for processing."""
        nonlocal is_playing, speed
        while True:
            try:
                msg = await websocket.receive_json()
                await cmd_queue.put(msg)
            except WebSocketDisconnect:
                await cmd_queue.put({"command": "_disconnect"})
                break

    async def process_commands():
        """Process commands from queue. Single point of state mutation."""
        nonlocal is_playing, speed
        while True:
            msg = await cmd_queue.get()
            cmd = msg.get("command")
            
            if cmd == "_disconnect":
                break
            elif cmd == "play":
                new_speed = msg.get("speed", 1)
                speed = max(1, min(20, int(new_speed)))  # Validate: 1-20 fps
                is_playing = True
                await websocket.send_json({"event": "playing", "speed": speed})
            elif cmd == "pause":
                is_playing = False
                await websocket.send_json({"event": "paused"})
            elif cmd == "jump":
                is_playing = False  # Pause on manual navigation
                frame = session.dispatch(ReplayAction.JUMP, minutes=msg.get("minutes", 5))
                await websocket.send_json(_serialize_frame(frame))
            elif cmd == "seek":
                is_playing = False
                ts_raw = msg.get("timestamp")
                if not ts_raw:
                    await websocket.send_json({"error": "timestamp required"})
                    continue
                ts = datetime.fromisoformat(ts_raw)
                # Ensure naive datetime for comparison with timeline
                if ts.tzinfo is not None:
                    ts = ts.replace(tzinfo=None)
                frame = session.dispatch(ReplayAction.SEEK, timestamp=ts)
                await websocket.send_json(_serialize_frame(frame))
            elif cmd == "sod":
                is_playing = False
                frame = session.dispatch(ReplayAction.SOD)
                await websocket.send_json(_serialize_frame(frame))
            elif cmd == "eod":
                is_playing = False
                frame = session.dispatch(ReplayAction.EOD)
                await websocket.send_json(_serialize_frame(frame))
            elif cmd == "update_config":
                num_strikes = msg.get("num_strikes")
                active_expiry = msg.get("active_expiry")
                if active_expiry:
                    try:
                        active_expiry = datetime.fromisoformat(active_expiry).date()
                    except (ValueError, TypeError):
                        try:
                            active_expiry = date.fromisoformat(active_expiry)
                        except (ValueError, TypeError):
                            active_expiry = None
                frame = session.update_config(num_strikes=num_strikes, active_expiry=active_expiry)
                await websocket.send_json(_serialize_frame(frame))
            elif cmd == "stop":
                break

    try:
        # Start all three tasks concurrently
        ticker_task = asyncio.create_task(ticker_loop())
        receive_task = asyncio.create_task(receive_loop())
        process_task = asyncio.create_task(process_commands())
        
        # Wait for any task to complete (usually receive on disconnect)
        done, pending = await asyncio.wait(
            [receive_task, process_task, ticker_task],
            return_when=asyncio.FIRST_COMPLETED
        )
        
        # Cancel remaining tasks
        for task in pending:
            task.cancel()
        if ticker_task:
            ticker_task.cancel()
            
    except WebSocketDisconnect:
        pass
    finally:
        # Clean up tasks
        if ticker_task and not ticker_task.done():
            ticker_task.cancel()
        # Session persists in memory; client can reconnect


# ─── STARTUP EVENT ─────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    """Log configuration on startup for debugging."""
    import socket
    try:
        hostname = socket.gethostname()
        local_ip = socket.getaddrinfo(hostname, None)[0][4][0]
        print(f"[STARTUP] Hostname: {hostname}")
        print(f"[STARTUP] Local IP: {local_ip}")
        print(f"[STARTUP] CORS_ALLOW_ALL: {_allow_all}")
        print(f"[STARTUP] CORS origins: {_cors_origins}")
    except Exception as e:
        print(f"[STARTUP] Could not resolve network info: {e}")


# ─── HEALTH CHECK ──────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "active_sessions": len(_sessions), "version": "2.0-fixed"}

# ─── STATIC FILES (optional — only if frontend built files exist) ──────────────
FRONTEND_DIR = Path(__file__).parent.parent.parent / "frontend_react" / "dist"
if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
else:
    print(f"[WARN] Frontend build dir not found at {FRONTEND_DIR} — serving API only")


# ─── MAIN ENTRY POINT ──────────────────────────────────────────────────────────
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
