from fastapi import APIRouter

router = APIRouter()

@router.get("/replay/status")
def get_replay_status():
    return {"status": "Replay engine is managed client-side via zero-lookahead slicing."}
