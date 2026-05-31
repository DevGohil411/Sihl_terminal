"""
chart_engine/data/loader.py
─────────────────────────────────────────────────────────────────────────────
Multi-Timeframe OHLC Data Engine
  • Loads NIFTY 50 1-minute base data from CSV
  • Generates all timeframes in-memory via resample_ohlc()
  • No separate files, no pre-computed caches
  • Zero future-leakage: replay slicing is strict by index
─────────────────────────────────────────────────────────────────────────────
"""

import pandas as pd
import numpy as np
import os

# ── Timeframe label → pandas resample offset string ──────────────────────────
TIMEFRAME_MAP = {
    "1m":  "1min",
    "3m":  "3min",
    "5m":  "5min",
    "15m": "15min",
    "30m": "30min",
    "45m": "45min",
    "1H":  "1h",
    "2H":  "2h",
    "4H":  "4h",
    "D":   "1D",
    "W":   "1W",
}

# Indian market session window (IST) – used for gap filtering
MARKET_OPEN_HOUR  = 9
MARKET_OPEN_MIN   = 15
MARKET_CLOSE_HOUR = 15
MARKET_CLOSE_MIN  = 30


def load_minute_data(csv_path: str) -> pd.DataFrame:
    """
    Load and normalise 1-minute OHLCV CSV.

    Expected columns: date, open, high, low, close, volume
    Returns a DataFrame with a 'datetime' column (timezone-naive, IST) and
    standard OHLCV columns.  Only market-hours rows are kept.
    """
    # Optimized CSV loading with predefined dtypes to save memory and CPU
    df = pd.read_csv(
        csv_path,
        usecols=["date", "open", "high", "low", "close", "volume"],
        dtype={
            "open": "float32",
            "high": "float32",
            "low": "float32",
            "close": "float32",
            "volume": "float32"
        }
    )
    df = df.rename(columns={"date": "datetime"})

    # Speed up datetime parsing significantly by specifying the exact format
    df["datetime"] = pd.to_datetime(df["datetime"], format="%Y-%m-%d %H:%M:%S", errors="coerce")

    df = df.dropna(subset=["datetime", "open", "high", "low", "close"])
    df = df.sort_values("datetime").reset_index(drop=True)

    # Filter to market hours only (removes overnight gaps automatically)
    mask = (
        (df["datetime"].dt.hour > MARKET_OPEN_HOUR) |
        ((df["datetime"].dt.hour == MARKET_OPEN_HOUR) &
         (df["datetime"].dt.minute >= MARKET_OPEN_MIN))
    ) & (
        (df["datetime"].dt.hour < MARKET_CLOSE_HOUR) |
        ((df["datetime"].dt.hour == MARKET_CLOSE_HOUR) &
         (df["datetime"].dt.minute <= MARKET_CLOSE_MIN))
    )
    df = df[mask].reset_index(drop=True)

    # Add human-readable string for the JS layer
    df["datetime_str"] = df["datetime"].dt.strftime("%Y-%m-%d %H:%M:%S")
    return df


def resample_ohlc(df_1m: pd.DataFrame, timeframe: str) -> pd.DataFrame:
    """
    Aggregate 1-minute base data to any higher timeframe.

    Rules (identical to TradingView):
      Open  = first candle open
      High  = max(high)
      Low   = min(low)
      Close = last candle close
      Volume= sum(volume)

    Parameters
    ----------
    df_1m      : 1-minute base DataFrame (output of load_minute_data)
    timeframe  : one of the keys in TIMEFRAME_MAP

    Returns
    -------
    DataFrame with columns: datetime, open, high, low, close, volume, datetime_str
    """
    if timeframe not in TIMEFRAME_MAP:
        raise ValueError(f"Unknown timeframe '{timeframe}'. "
                         f"Valid: {list(TIMEFRAME_MAP.keys())}")

    if timeframe == "1m":
        return df_1m.copy()

    freq = TIMEFRAME_MAP[timeframe]

    df_indexed = df_1m.set_index("datetime")

    agg_dict = {
        "open":   "first",
        "high":   "max",
        "low":    "min",
        "close":  "last",
        "volume": "sum",
    }

    resampled = df_indexed.resample(freq, label="left", closed="left").agg(agg_dict)
    resampled = resampled.dropna(subset=["open", "close"])
    resampled = resampled.reset_index()

    resampled["datetime_str"] = resampled["datetime"].dt.strftime("%Y-%m-%d %H:%M:%S")
    return resampled


def slice_for_replay(df: pd.DataFrame, up_to_index: int) -> pd.DataFrame:
    """
    Return a strict no-lookahead slice of df up to (and including) up_to_index.
    This is the gatekeeper that prevents any future-leakage in replay mode.
    """
    return df.iloc[: up_to_index + 1].copy()


def df_to_json_list(df: pd.DataFrame) -> list:
    """Convert OHLCV DataFrame to lightweight list-of-dicts for JSON serialisation."""
    records = []
    for _, row in df.iterrows():
        records.append({
            "datetime": row["datetime_str"],
            "open":     float(row["open"]),
            "high":     float(row["high"]),
            "low":      float(row["low"]),
            "close":    float(row["close"]),
            "volume":   float(row.get("volume", 0)),
        })
    return records


# ── Quick smoke-test ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    BASE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    CSV  = os.path.join(BASE, "Data", "NIFTY 50_minute.csv")

    print(f"Loading: {CSV}")
    df1m = load_minute_data(CSV)
    print(f"1m rows: {len(df1m)}")

    for tf in TIMEFRAME_MAP:
        dfx = resample_ohlc(df1m, tf)
        print(f"  {tf:4s} -> {len(dfx):6,} candles  "
              f"[{dfx['datetime'].iloc[0].date()} ... {dfx['datetime'].iloc[-1].date()}]")
