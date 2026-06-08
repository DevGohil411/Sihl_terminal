from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from routes import candles, indicators, imbalances, replay

app = FastAPI(
    title="NIFTY Chart Engine API",
    description="Backend for TradingView-style multi-timeframe charting platform.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(candles.router, prefix="/api", tags=["Candles"])
app.include_router(indicators.router, prefix="/api/indicators", tags=["Indicators"])
app.include_router(imbalances.router, prefix="/api", tags=["Imbalances"])
app.include_router(replay.router, prefix="/api", tags=["Replay"])

@app.get("/")
def health_check():
    return {"status": "ok", "message": "NIFTY Chart Engine API is running."}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print("\n" + "=" * 60)
    print(f"  NIFTY Chart Engine (FastAPI)  --  Starting on Port {port}")
    print("=" * 60 + "\n")
    uvicorn.run("backend.app:app", host="0.0.0.0", port=port, reload=True)
