"""
Shared constants for the options simulator backend.
"""

# Lot sizes per underlying (NSE official — updated 2024)
LOT_SIZES = {
    "NIFTY": 50,
    "BANKNIFTY": 30,        # Changed from 15 → 30 (NSE revised lot size)
    "FINNIFTY": 40,
    "MIDCPNIFTY": 75,
}

# Strike intervals per underlying
STRIKE_INTERVALS = {
    "NIFTY": 50,
    "BANKNIFTY": 100,
    "FINNIFTY": 50,
    "MIDCPNIFTY": 25,
}
