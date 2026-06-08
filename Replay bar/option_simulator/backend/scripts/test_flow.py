import requests
import json
import asyncio
import websockets

async def test_flow():
    # STEP 2: session/init
    print("=== STEP 2: session/init ===")
    payload = {
        "underlying": "NIFTY",
        "session_date": "2024-01-01",
        "execution_mode": "CLOSE"
    }
    resp = requests.post("http://localhost:8000/api/v1/session/init", json=payload)
    data = resp.json()
    print(json.dumps(data, indent=2))
    
    if data.get("status") != "ok":
        print("Init failed!")
        return
        
    session_id = data["session"]["session_id"]
    
    # STEP 3: WebSocket Frame
    print("\n=== STEP 3: WebSocket Frame ===")
    uri = f"ws://localhost:8000/ws/{session_id}"
    async with websockets.connect(uri) as ws:
        # We need to trigger a frame, or maybe the backend sends one immediately?
        # Let's wait for 2 seconds to see if it sends anything automatically.
        try:
            msg = await asyncio.wait_for(ws.recv(), timeout=2.0)
            frame_data = json.loads(msg)
            # Truncate chain_data for display so we don't spam 10,000 lines
            if "chain_data" in frame_data:
                chain_len = len(frame_data["chain_data"])
                frame_data["chain_data"] = f"[{chain_len} rows omitted]"
            print(json.dumps(frame_data, indent=2))
        except asyncio.TimeoutError:
            print("No WebSocket frame received within 2 seconds.")
        
        # Let's actively dispatch SOD
        print("\n=== Dispatching SOD ===")
        resp2 = requests.post("http://localhost:8000/api/v1/session/action", json={
            "session_id": session_id,
            "action": "SOD",
            "minutes": 0
        })
        print(json.dumps(resp2.json(), indent=2))

if __name__ == "__main__":
    asyncio.run(test_flow())
