"""
chart_engine/app.py  —  Complete Flask Backend
═══════════════════════════════════════════════════════════════════════════
EXTENSION ONLY — Replay_bar.py is NOT modified.
This file adds a live web server alongside the existing static HTML system.

API Endpoints
─────────────────────────────────────────────────────────────────────────
GET  /                          → SPA (ui/index.html)
GET  /api/info                  → dataset summary
GET  /api/timeframes            → list of available timeframe keys
GET  /api/candles               → OHLCV for chosen TF (replay-sliced)
GET  /api/indicators/list       → all indicators + schema
POST /api/indicators/calculate  → compute one indicator
GET  /api/imbalances            → imbalance zones (CSV-derived, no Excel dep.)
═══════════════════════════════════════════════════════════════════════════
"""
import os
import sys
import json
import traceback

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from chart_engine.data.loader import (
    load_minute_data, resample_ohlc, df_to_json_list,
    TIMEFRAME_MAP,
)
from chart_engine.indicators import INDICATOR_REGISTRY

# ── paths ─────────────────────────────────────────────────────────────────────
CSV_PATH = os.path.join(BASE_DIR, "Data", "NIFTY 50_minute.csv")
UI_DIR   = os.path.join(BASE_DIR, "ui")

os.makedirs(UI_DIR, exist_ok=True)

app = Flask(__name__, static_folder=UI_DIR, static_url_path="")
CORS(app)

# ── load 1-minute base data once ─────────────────────────────────────────────
print("[STARTUP] Loading NIFTY 50 1-minute base data...")
DF_1M = load_minute_data(CSV_PATH)
print(f"[STARTUP] {len(DF_1M):,} candles loaded  "
      f"({DF_1M['datetime'].iloc[0].date()} to {DF_1M['datetime'].iloc[-1].date()})")

# ── per-TF lazy cache ─────────────────────────────────────────────────────────
_TF_CACHE: dict = {}

def _get_tf(tf: str):
    if tf not in _TF_CACHE:
        _TF_CACHE[tf] = resample_ohlc(DF_1M, tf)
        print(f"[CACHE] Built TF '{tf}': {len(_TF_CACHE[tf]):,} candles")
    return _TF_CACHE[tf]


# ════════════════════════════════════════════════════════════════════════════════
# Routes
# ════════════════════════════════════════════════════════════════════════════════

@app.route("/")
def index():
    return send_from_directory(UI_DIR, "index.html")


# ── Dataset info ──────────────────────────────────────────────────────────────
@app.route("/api/info")
def api_info():
    return jsonify({
        "symbol":          "NIFTY 50",
        "base_tf":         "1m",
        "total_1m":        len(DF_1M),
        "start":           str(DF_1M["datetime"].iloc[0]),
        "end":             str(DF_1M["datetime"].iloc[-1]),
        "timeframe_counts": {tf: len(_get_tf(tf)) for tf in TIMEFRAME_MAP},
    })


# ── Timeframe list ────────────────────────────────────────────────────────────
@app.route("/api/timeframes")
def api_timeframes():
    return jsonify(list(TIMEFRAME_MAP.keys()))


# ── Candles ───────────────────────────────────────────────────────────────────
@app.route("/api/candles")
def api_candles():
    """
    Query params:
      tf          – timeframe key  (default "5m")
      replay_idx  – replay cursor (default = last bar = no restriction)
      offset      – start index for windowed fetch (default 0)
      limit       – candles to return from offset  (default 600)
    """
    tf  = request.args.get("tf", "5m")
    if tf not in TIMEFRAME_MAP:
        return jsonify({"error": f"Unknown timeframe: {tf}"}), 400

    df    = _get_tf(tf)
    total = len(df)

    # ── Replay no-lookahead slice (mirrors allCandles.slice(0, currentIndex+1))
    raw_idx = request.args.get("replay_idx")
    if raw_idx is not None:
        replay_idx = max(0, min(int(raw_idx), total - 1))
        df = df.iloc[: replay_idx + 1]

    # ── Viewport window (performance: only ship what fits in the chart)
    offset = int(request.args.get("offset", 0))
    limit_arg = request.args.get("limit")
    limit = int(limit_arg) if limit_arg is not None else 600

    if limit == 0:
        df_win = df.iloc[offset:]
    else:
        df_win = df.iloc[offset: offset + limit]

    return jsonify({
        "tf":          tf,
        "total":       total,
        "replay_max":  len(df) - 1,
        "offset":      offset,
        "returned":    len(df_win),
        "candles":     df_to_json_list(df_win),
    })


# ── Indicator library list ────────────────────────────────────────────────────
@app.route("/api/indicators/list")
def api_indicator_list():
    result = []
    for name, cls in INDICATOR_REGISTRY.items():
        inst = cls()
        result.append({
            "name":        name,
            "short_name":  inst.short_name,
            "description": inst.description,
            "overlay":     getattr(inst, "overlay", False),
            "pane":        getattr(inst, "pane",    False),
            "schema":      [
                {
                    "key":     f.key,
                    "label":   f.label,
                    "type":    f.type,
                    "default": f.default,
                    "options": f.options,
                    "min":     f.min,
                    "max":     f.max,
                }
                for f in inst.schema()
            ],
        })
    return jsonify(result)


# ── Indicator calculation ─────────────────────────────────────────────────────
@app.route("/api/indicators/calculate", methods=["POST"])
def api_calculate():
    """
    Body JSON:
      {
        "indicator":  "EMA",
        "settings":   { "length": 20, "color": "#2196F3" },
        "tf":         "5m",
        "replay_idx": 300
      }
    """
    body       = request.get_json(force=True)
    ind_name   = body.get("indicator", "")
    settings   = body.get("settings",  {})
    tf         = body.get("tf",        "5m")
    replay_idx = body.get("replay_idx", None)

    if ind_name not in INDICATOR_REGISTRY:
        return jsonify({"error": f"Unknown indicator: {ind_name}"}), 400
    if tf not in TIMEFRAME_MAP:
        return jsonify({"error": f"Unknown timeframe: {tf}"}), 400

    cls  = INDICATOR_REGISTRY[ind_name]
    inst = cls(**{k: v for k, v in settings.items()})

    df = _get_tf(tf)
    if replay_idx is not None:
        df = df.iloc[: int(replay_idx) + 1]

    try:
        payload = inst.to_json_payload(df)
        return jsonify({"ok": True, "result": payload})
    except Exception as exc:
        traceback.print_exc()
        return jsonify({"error": str(exc)}), 500


# ── Imbalance zones derived from 1-min CSV (no Excel dependency) ──────────────
@app.route("/api/imbalances")
def api_imbalances():
    """
    Compute imbalance zones from the OHLCV data itself.
    These are the same 3-candle gap zones the FVG indicator detects,
    returned here as a standalone endpoint so the JS can use the same
    dtToIdx lookup pattern from the original Replay_bar.py.

    Query params:
      tf          – timeframe to compute on (default "5m")
      replay_idx  – no-lookahead cursor
      min_size    – minimum gap size % (default 0)
    """
    tf  = request.args.get("tf", "5m")
    raw_idx  = request.args.get("replay_idx")
    min_size = float(request.args.get("min_size", 0))

    if tf not in TIMEFRAME_MAP:
        return jsonify({"error": f"Unknown timeframe: {tf}"}), 400

    df = _get_tf(tf)
    if raw_idx is not None:
        df = df.iloc[: int(raw_idx) + 1]

    zones = []
    n = len(df)
    for i in range(1, n - 1):
        prev = df.iloc[i - 1]
        curr = df.iloc[i]
        nxt  = df.iloc[i + 1]

        # Bullish gap: prev.high < next.low
        if prev["high"] < nxt["low"]:
            gap_pct = (nxt["low"] - prev["high"]) / prev["high"] * 100
            if gap_pct >= min_size:
                zones.append({
                    "imbalance_id":       f"BULL_{i}",
                    "imbalance_type":     "bullish",
                    "vi_subtype":         "fvg",
                    "active_status":      True,
                    "top_price":          round(float(nxt["low"]),  2),
                    "bottom_price":       round(float(prev["high"]),2),
                    "creation_datetime":  curr["datetime_str"],
                    "mitigation_datetime":"Active",
                    "first_touch_datetime":"Never Touched",
                    "first_touch_detected": False,
                })

        # Bearish gap: prev.low > next.high
        elif prev["low"] > nxt["high"]:
            gap_pct = (prev["low"] - nxt["high"]) / prev["low"] * 100
            if gap_pct >= min_size:
                zones.append({
                    "imbalance_id":       f"BEAR_{i}",
                    "imbalance_type":     "bearish",
                    "vi_subtype":         "fvg",
                    "active_status":      True,
                    "top_price":          round(float(prev["low"]),  2),
                    "bottom_price":       round(float(nxt["high"]),  2),
                    "creation_datetime":  curr["datetime_str"],
                    "mitigation_datetime":"Active",
                    "first_touch_datetime":"Never Touched",
                    "first_touch_detected": False,
                })

    return jsonify({"tf": tf, "count": len(zones), "zones": zones})


# ════════════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("  NIFTY Chart Engine  --  TradingView-Style Platform")
    print("  http://127.0.0.1:5050")
    print("=" * 60 + "\n")
    app.run(host="0.0.0.0", port=5050, debug=False, threaded=True)
