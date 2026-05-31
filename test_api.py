import os
os.environ["CSV_PATH"] = "d:/Replay bar/Data/NIFTY 50_minute.csv"

from fastapi.testclient import TestClient
from backend.app import app

client = TestClient(app)

def run_tests():
    print("Testing /")
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "message": "NIFTY Chart Engine API is running."}
    
    print("Testing /api/candles")
    response = client.get("/api/candles?tf=5m&limit=10")
    assert response.status_code == 200
    assert "candles" in response.json()
    print("OK - /api/candles")
    
    print("Testing /api/indicators/list")
    response = client.get("/api/indicators/list")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    print("OK - /api/indicators/list")

if __name__ == "__main__":
    run_tests()
    print("ALL TESTS PASSED!")
