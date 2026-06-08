from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from services.data_service import data_service
from data.loader import TIMEFRAME_MAP

router = APIRouter()

@router.get("/imbalances")
def get_imbalances(
    tf: str = Query("5m", description="Timeframe key"),
    start: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    replay_idx: Optional[int] = Query(None, description="No-lookahead cursor"),
    min_size: float = Query(0.0, description="Minimum gap size %")
):
    if tf not in TIMEFRAME_MAP:
        raise HTTPException(status_code=400, detail=f"Unknown timeframe: {tf}")

    df = data_service.get_timeframe(tf)

    if start:
        df = df[df["datetime_str"] >= start]
    if end:
        df = df[df["datetime_str"] <= end + " 23:59:59"]

    if replay_idx is not None:
        df = df.iloc[: int(replay_idx) + 1]

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

    return {"tf": tf, "count": len(zones), "zones": zones}
