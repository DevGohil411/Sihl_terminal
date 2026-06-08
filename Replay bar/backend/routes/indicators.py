import traceback
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional

from services.data_service import data_service
from data.loader import TIMEFRAME_MAP
from indicators import INDICATOR_REGISTRY

router = APIRouter()

class CalculateRequest(BaseModel):
    indicator: str
    settings: Dict[str, Any] = {}
    tf: str = "5m"
    replay_idx: Optional[int] = None
    start: Optional[str] = None
    end: Optional[str] = None

@router.get("/list")
def list_indicators():
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
    return result

@router.post("/calculate")
def calculate_indicator(req: CalculateRequest):
    if req.indicator not in INDICATOR_REGISTRY:
        raise HTTPException(status_code=400, detail=f"Unknown indicator: {req.indicator}")
    if req.tf not in TIMEFRAME_MAP:
        raise HTTPException(status_code=400, detail=f"Unknown timeframe: {req.tf}")

    cls = INDICATOR_REGISTRY[req.indicator]
    inst = cls(**req.settings)

    df = data_service.get_timeframe(req.tf)
    if req.start:
        df = df[df["datetime_str"] >= req.start]
    if req.end:
        df = df[df["datetime_str"] <= req.end + " 23:59:59"]
    if req.replay_idx is not None:
        df = df.iloc[: int(req.replay_idx) + 1]

    try:
        payload = inst.to_json_payload(df)
        return {"ok": True, "result": payload}
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(exc))
