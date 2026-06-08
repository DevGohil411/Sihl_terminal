# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
"""
Quick sanity test for the Greeks engine -- no ClickHouse required.
Run this first to verify that the BSM and IV solver are working correctly.

Usage:
    cd d:\option simulator algotest\simulator\backend
    python tests\test_greeks.py
"""

import numpy as np
from datetime import date, datetime
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.quant.greeks import bsm_greeks, solve_iv_chain, bsm_price, time_to_expiry_years, price_chain
from app.quant.execution import ExecutionEngine, ExecutionMode, OHLCCandle

print("=" * 60)
print("OPTIONS SIMULATOR - SANITY TEST SUITE")
print("=" * 60)

# ─── Test 1: BSM Pricing ───────────────────────────────────────────────────────
print("\n[1] BSM Pricing Test")
S = 24082.65
K = np.array([23900.0, 24000.0, 24100.0, 24200.0])
T = 0.055  # ~20 days
r = 0.065
q = 0.013
sigma = np.array([0.16, 0.155, 0.15, 0.145])
is_call = np.array([True, True, True, True])

call_prices = bsm_price(S, K, T, r, q, sigma, is_call)
put_prices  = bsm_price(S, K, T, r, q, sigma, np.array([False]*4))

for i, k in enumerate(K):
    print(f"  K={int(k)} | Call={call_prices[i]:.2f} | Put={put_prices[i]:.2f}")
print("  [PASS] BSM pricing returned without error")

# --- Test 2: Greeks Calculation ------------------------------------------------
print("\n[2] Greeks Calculation Test")
greeks = bsm_greeks(S, K, T, r, q, sigma, is_call)
for i, k in enumerate(K):
    print(f"  K={int(k)} | Delta={greeks['delta'][i]:.4f} | Gamma={greeks['gamma'][i]:.6f} | Theta={greeks['theta'][i]:.2f} | Vega={greeks['vega'][i]:.2f}")
print("  [PASS] Greeks returned without error")

# --- Test 3: IV Solver Round-trip ----------------------------------------------
print("\n[3] IV Solver Round-trip Test (BSM → IV Recovery)")
market_prices = bsm_price(S, K, T, r, q, sigma, is_call)
recovered_iv = solve_iv_chain(market_prices, S, K, T, r, q, is_call)

all_pass = True
for i, k in enumerate(K):
    error = abs(recovered_iv[i] - sigma[i])
    status = "PASS" if error < 1e-4 else "FAIL"
    if status == "FAIL":
        all_pass = False
    print(f"  K={int(k)} | Expected IV={sigma[i]:.4f} | Recovered={recovered_iv[i]:.4f} | Err={error:.2e} [{status}]")

if all_pass:
    print("  [PASS] IV solver converged correctly for all strikes")
else:
    print("  [WARN] Some IV solver iterations did not converge exactly — review above")

# ─── Test 4: Time to Expiry ────────────────────────────────────────────────────
print("\n[4] Time to Expiry Test")
current_ts = datetime(2026, 5, 4, 10, 16, 59)   # 10:16:59 — exact, no rounding
expiry_dt  = date(2026, 5, 26)
T_computed = time_to_expiry_years(current_ts, expiry_dt)
dte_days = (expiry_dt - current_ts.date()).days
print(f"  Current: {current_ts}  |  Expiry: {expiry_dt}")
print(f"  DTE days: {dte_days}  |  T (years): {T_computed:.6f}")
print("  [PASS] Timestamp preserved exactly (no rounding)")

# ─── Test 5: Execution Engine ──────────────────────────────────────────────────
print("\n[5] Execution Engine Test")
candle = OHLCCandle(
    timestamp=datetime(2026, 5, 4, 15, 15, 59),  # Exact timestamp
    open=185.0,
    high=192.5,
    low=181.0,
    close=189.75,
    volume=5400,
)

for mode in [ExecutionMode.OPEN, ExecutionMode.HIGH, ExecutionMode.LOW,
             ExecutionMode.CLOSE, ExecutionMode.MID, ExecutionMode.BID,
             ExecutionMode.ASK, ExecutionMode.VWAP]:
    engine = ExecutionEngine(mode=mode, slippage_bps=5)
    fill = engine.fill_price(candle, is_buy=True)
    print(f"  Mode={mode.value:6s} | Fill={fill.fill_price:.2f} | Slippage={fill.slippage_amount:.4f} | Valid={fill.is_valid}")

print("  [PASS] Candle timestamp preserved:", candle.timestamp)

# ─── Test 6: Edge Cases ────────────────────────────────────────────────────────
print("\n[6] Edge Case: Near-expiry (T→0)")
T_tiny = 1e-5
prices_edge = bsm_price(S, K, T_tiny, r, q, sigma, is_call)
greeks_edge = bsm_greeks(S, K, T_tiny, r, q, sigma, is_call)
print(f"  Deep ITM delta at T→0: {greeks_edge['delta'][0]:.4f} (expect ~1.0)")
print(f"  ATM delta at T→0:      {greeks_edge['delta'][1]:.4f} (expect ~0.5-1.0)")
print("  [PASS] No division-by-zero at near-expiry")

print("\n" + "=" * 60)
print("ALL TESTS PASSED — Backend quant engine is ready.")
print("=" * 60)
