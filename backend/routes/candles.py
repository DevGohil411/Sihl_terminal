from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from backend.services.data_service import data_service
from backend.data.loader import TIMEFRAME_MAP, df_to_json_list

router = APIRouter()

@router.get("/candles")
def get_candles(
    tf: str = Query("5m", description="Timeframe key"),
    replay_idx: Optional[int] = Query(None, description="Replay cursor index"),
    offset: int = Query(0, description="Start index for windowed fetch"),
    limit: int = Query(600, description="Candles to return from offset. 0 means all.")
):
    if tf not in TIMEFRAME_MAP:
        raise HTTPException(status_code=400, detail=f"Unknown timeframe: {tf}")

    df = data_service.get_timeframe(tf)
    total = len(df)

    if replay_idx is not None:
        replay_idx = max(0, min(int(replay_idx), total - 1))
        df = df.iloc[: replay_idx + 1]

    if limit == 0:
        df_win = df.iloc[offset:]
    else:
        df_win = df.iloc[offset: offset + limit]

    return {
        "tf": tf,
        "total": total,
        "replay_max": len(df) - 1,
        "offset": offset,
        "returned": len(df_win),
        "candles": df_to_json_list(df_win),
    }
