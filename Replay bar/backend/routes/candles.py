from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from services.data_service import data_service
from data.loader import TIMEFRAME_MAP, df_to_json_list

router = APIRouter()

@router.get("/candles")
def get_candles(
    tf: str = Query("5m", description="Timeframe key"),
    start: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    replay_idx: Optional[int] = Query(None, description="Replay cursor index"),
    offset: int = Query(0, description="Start index for windowed fetch"),
    limit: int = Query(0, description="Candles to return. 0 = no limit (return all in range).")
):
    if tf not in TIMEFRAME_MAP:
        raise HTTPException(status_code=400, detail=f"Unknown timeframe: {tf}")

    df = data_service.get_timeframe(tf)

    # ── Date range filter: ONLY return what user selected
    # Ensure datetime is string for comparison to avoid tz issues
    if start:
        df = df[df["datetime_str"] >= start]
    if end:
        df = df[df["datetime_str"] <= end + " 23:59:59"]

    total = len(df)

    if replay_idx is not None:
        replay_idx = max(0, min(int(replay_idx), total - 1))
        df = df.iloc[: replay_idx + 1]

    # User controls data size via date range — no artificial limit
    if limit > 0:
        df_win = df.iloc[offset: offset + limit]
    else:
        df_win = df.iloc[offset:]

    return {
        "tf": tf,
        "total": total,
        "replay_max": len(df) - 1,
        "offset": offset,
        "returned": len(df_win),
        "candles": df_to_json_list(df_win),
    }
