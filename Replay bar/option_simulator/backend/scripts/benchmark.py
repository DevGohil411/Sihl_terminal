import time
import os
import sys
from datetime import date, datetime

# Add app to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.data.reader import OptionChainReader
from app.quant.greeks import price_chain
from app.engine.replay import ReplaySession, ReplayAction

def run_benchmarks():
    print("--- Option Simulator Performance Benchmarks ---")
    
    reader = OptionChainReader()
    
    underlying = "NIFTY"
    test_date = date(2024, 3, 1)
    
    try:
        # Check if data exists
        expiries = reader.get_available_expiries(underlying, test_date)
        if not expiries:
            print("No data found for test date.")
            return
            
        expiry = expiries[0]
        timestamps = reader.get_available_timestamps(underlying, test_date)
        ts = timestamps[0]
        spot = reader.get_spot_at_timestamp(underlying, ts).close
        atm = OptionChainReader.calculate_atm_strike(spot, underlying)
        
        # 1. DuckDB Query Latency
        t0 = time.perf_counter()
        raw_chain = reader.get_option_chain(underlying, expiry, ts, atm, 50)
        t1 = time.perf_counter()
        duckdb_latency = (t1 - t0) * 1000
        print(f"1. DuckDB Query Latency (50 strikes): {duckdb_latency:.2f} ms")
        
        # 2. Greeks Calculation Latency
        t0 = time.perf_counter()
        enriched = price_chain(spot, raw_chain, expiry, ts)
        t1 = time.perf_counter()
        greeks_latency = (t1 - t0) * 1000
        print(f"2. Greeks Calculation Latency: {greeks_latency:.2f} ms")
        
        # 3. Session Frame Latency
        session = ReplaySession(underlying=underlying, session_date=test_date, reader=reader)
        t0 = time.perf_counter()
        frame = session._build_frame()
        t1 = time.perf_counter()
        frame_latency = (t1 - t0) * 1000
        print(f"3. Full Frame Build Latency: {frame_latency:.2f} ms")
        
        # 4. Replay FPS Tests
        print("\n--- Replay FPS Simulation ---")
        speeds = [1, 10, 50, 100]
        for speed in speeds:
            session = ReplaySession(underlying=underlying, session_date=test_date, reader=reader)
            frames_to_process = speed
            
            t0 = time.perf_counter()
            for _ in range(frames_to_process):
                session._advance_cursor(minutes=1)
                session._build_frame()
            t1 = time.perf_counter()
            
            fps = frames_to_process / (t1 - t0)
            print(f"Speed {speed}x FPS: {fps:.2f} frames/sec")
            
    except Exception as e:
        print(f"Benchmark failed: {e}")

if __name__ == "__main__":
    run_benchmarks()
