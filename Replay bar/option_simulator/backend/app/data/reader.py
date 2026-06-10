"""
DuckDB Data Reader — Sub-10ms Option Chain Retrieval
=====================================================
Provides high-speed access to historical OHLC options and spot data.
Replaced ClickHouse with DuckDB for portability and zero-setup local performance.

OPTIMIZATIONS:
    - Lazy in-memory cache for timestamps and expiries per (underlying, date)
    - Pre-computed spot index for fast timestamp lookup
    - Direct Polars integration for zero-copy DataFrame returns
"""

from datetime import date, datetime
from typing import Optional, List, Dict
import polars as pl
import duckdb
from dataclasses import dataclass
from pathlib import Path


@dataclass
class OHLCCandle:
    """Full OHLC candle for a single option contract."""
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int
    open_interest: Optional[int] = None


# Try backend/data first, fallback to ../data (sibling of backend folder)
_backend_data = Path(__file__).parent.parent.parent / "data"
_sibling_data = Path(__file__).parent.parent.parent.parent / "data"

# Also check env vars for explicit paths (used by .env config)
import os
_env_options = os.environ.get("DUCKDB_OPTIONS_PATH")
_env_spot = os.environ.get("DUCKDB_SPOT_PATH")

if _env_options and Path(_env_options).exists():
    DB_PATH = Path(_env_options)
    SPOT_DB_PATH = Path(_env_spot) if _env_spot and Path(_env_spot).exists() else Path(_env_options).parent / "spot_v3.duckdb"
else:
    BASE_DIR = _backend_data if (_backend_data / "options_v3.duckdb").exists() else _sibling_data
    DB_PATH = BASE_DIR / "options_v3.duckdb"
    SPOT_DB_PATH = BASE_DIR / "spot_v3.duckdb"

from app.data.constants import STRIKE_INTERVALS, LOT_SIZES

# ─── DATA MODELS ───────────────────────────────────────────────────────────────
@dataclass
class SpotFrame:
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int


# ─── MAIN READER CLASS ─────────────────────────────────────────────────────────
class OptionChainReader:
    def __init__(self, db_path: str = str(DB_PATH)):
        # read_only=True allows concurrent readers (e.g. FastAPI workers)
        self.con = duckdb.connect(db_path, read_only=True)
        try:
            self.con.cursor().execute(f"ATTACH '{str(SPOT_DB_PATH)}' AS spot_db (READ_ONLY)")
            print(f"[+] Attached spot database: {SPOT_DB_PATH}")
        except Exception as e:
            print(f"[-] Could not attach spot database: {e}")
        
        # ── In-memory caches ───────────────────────────────────────────────────
        # Cache timestamps per (underlying, session_date) to avoid repeated DISTINCT queries
        self._timeline_cache: dict[tuple[str, date], list[datetime]] = {}
        # Cache expiries per (underlying, as_of_date)
        self._expiry_cache: dict[tuple[str, date], list[date]] = {}

    # ─── SPOT PRICE RETRIEVAL ──────────────────────────────────────────────────
    def get_spot_at_timestamp(
        self,
        underlying: str,
        timestamp: datetime,
    ) -> Optional[SpotFrame]:
        # Try historical_spot table first
        cursor = self.con.cursor()
        try:
            row = cursor.execute("""
                SELECT timestamp, open, high, low, close, volume
                FROM spot_db.historical_spot
                WHERE underlying = ? AND timestamp = ?
            """, (underlying, timestamp)).fetchone()

            if not row:
                row = cursor.execute("""
                    SELECT timestamp, open, high, low, close, volume
                    FROM spot_db.historical_spot
                    WHERE underlying = ? AND timestamp <= ?
                    ORDER BY timestamp DESC
                    LIMIT 1
                """, (underlying, timestamp)).fetchone()
                
            if row:
                return SpotFrame(timestamp=row[0], open=row[1], high=row[2], low=row[3], close=row[4], volume=row[5])
        except Exception:
            pass

        # Dynamic fallback: Calculate synthetic spot using Put-Call parity
        try:
            expiry_row = self.con.cursor().execute("""
                SELECT MIN(expiry)
                FROM historical_options
                WHERE underlying = ? AND timestamp = ?
            """, (underlying, timestamp)).fetchone()
            
            if not expiry_row or not expiry_row[0]:
                expiry_row = self.con.cursor().execute("""
                    SELECT MIN(expiry)
                    FROM historical_options
                    WHERE underlying = ? AND timestamp <= ?
                    AND timestamp >= (?::DATE - INTERVAL 1 DAY)
                """, (underlying, timestamp, timestamp)).fetchone()

            if expiry_row and expiry_row[0]:
                target_expiry = expiry_row[0]
                
                option_rows = self.con.cursor().execute("""
                    WITH prices AS (
                        SELECT strike, 
                               MAX(CASE WHEN option_type = 'CE' THEN close END) as call_close,
                               MAX(CASE WHEN option_type = 'PE' THEN close END) as put_close
                        FROM historical_options
                        WHERE underlying = ? AND timestamp = ? AND expiry = ?
                        GROUP BY strike
                    )
                    SELECT strike, call_close, put_close, ABS(call_close - put_close) as diff
                    FROM prices
                    WHERE call_close IS NOT NULL AND put_close IS NOT NULL
                    ORDER BY diff ASC
                    LIMIT 1
                """, (underlying, timestamp, target_expiry)).fetchone()
                
                if option_rows:
                    strike, call_close, put_close, diff = option_rows
                    synthetic_spot = float(strike + call_close - put_close)
                    
                    return SpotFrame(
                        timestamp=timestamp,
                        open=synthetic_spot,
                        high=synthetic_spot,
                        low=synthetic_spot,
                        close=synthetic_spot,
                        volume=0
                    )
                    
            return None
        except Exception as e:
            return None

    def get_previous_day_close(self, underlying: str, current_date: date) -> Optional[float]:
        """Get the last close price from the previous trading day."""
        cursor = self.con.cursor()
        try:
            # Find the most recent trading day before current_date
            row = cursor.execute("""
                SELECT close 
                FROM spot_db.historical_spot 
                WHERE underlying = ? AND timestamp::DATE < ?
                ORDER BY timestamp DESC 
                LIMIT 1
            """, (underlying, current_date)).fetchone()
            if row:
                return float(row[0])
        except Exception:
            pass
        finally:
            cursor.close()
        return None

    @staticmethod
    def calculate_atm_strike(spot_price: float, underlying: str) -> int:
        interval = STRIKE_INTERVALS.get(underlying, 50)
        return int(round(spot_price / interval) * interval)

    # ─── OPTION CHAIN RETRIEVAL ────────────────────────────────────────────────
    def get_option_chain(
        self,
        underlying: str,
        expiry: date,
        timestamp: datetime,
        atm_strike: int,
        num_strikes: int = 15,
        strike_interval: Optional[int] = None,
    ) -> pl.DataFrame:
        interval = strike_interval or STRIKE_INTERVALS.get(underlying, 50)
        min_strike = atm_strike - (num_strikes * interval)
        max_strike = atm_strike + (num_strikes * interval)

        # Use DuckDB's native Polars integration
        df = self.con.cursor().execute("""
            SELECT
                strike, option_type, open, high, low, close, volume, open_interest, timestamp
            FROM historical_options
            WHERE underlying = ? 
              AND expiry = ?
              AND timestamp = ?
              AND strike BETWEEN ? AND ?
            ORDER BY strike ASC, option_type ASC
        """, (underlying, expiry, timestamp, min_strike, max_strike)).pl()

        if df.is_empty():
            df = self.con.cursor().execute("""
                SELECT strike, option_type, open, high, low, close, volume, open_interest, timestamp
                FROM (
                    SELECT *, ROW_NUMBER() OVER (PARTITION BY strike, option_type ORDER BY timestamp DESC) as rn
                    FROM historical_options
                    WHERE underlying = ? 
                      AND expiry = ?
                      AND timestamp <= ?
                      AND strike BETWEEN ? AND ?
                ) WHERE rn = 1
                ORDER BY strike ASC, option_type ASC
            """, (underlying, expiry, timestamp, min_strike, max_strike)).pl()
            
        return df

    # ─── AVAILABLE EXPIRIES ────────────────────────────────────────────────────
    def get_available_expiries(
        self,
        underlying: str,
        as_of_date: date,
    ) -> list[date]:
        cache_key = (underlying, as_of_date)
        if cache_key in self._expiry_cache:
            return self._expiry_cache[cache_key]
            
        cursor = self.con.cursor()
        try:
            rows = cursor.execute("""
                SELECT DISTINCT expiry
                FROM historical_options
                WHERE underlying = ? AND expiry >= ?
                ORDER BY expiry ASC
                LIMIT 20
            """, (underlying, as_of_date)).fetchall()
            result = [r[0] for r in rows]
            self._expiry_cache[cache_key] = result
            return result
        finally:
            cursor.close()

    # ─── AVAILABLE TIMESTAMPS ─────────────────────────────────────────────────
    def get_available_timestamps(
        self,
        underlying: str,
        session_date: date,
    ) -> list[datetime]:
        cache_key = (underlying, session_date)
        if cache_key in self._timeline_cache:
            return self._timeline_cache[cache_key]
            
        cursor = self.con.cursor()
        try:
            rows = cursor.execute("""
                SELECT DISTINCT timestamp
                FROM historical_options
                WHERE underlying = ? 
                  AND timestamp >= ?::TIMESTAMP 
                  AND timestamp < (?::DATE + INTERVAL 1 DAY)::TIMESTAMP
                ORDER BY timestamp ASC
            """, (underlying, session_date, session_date)).fetchall()
            result = [r[0] for r in rows]
            self._timeline_cache[cache_key] = result
            return result
        finally:
            cursor.close()

    # ─── VIX RETRIEVAL ─────────────────────────────────────────────────────────
    def get_vix_at_timestamp(
        self,
        timestamp: datetime,
    ) -> Optional[SpotFrame]:
        """Returns INDIAVIX data at or before the given timestamp."""
        cursor = self.con.cursor()
        try:
            row = cursor.execute("""
                SELECT timestamp, open, high, low, close, volume
                FROM spot_db.historical_spot
                WHERE underlying = 'INDIAVIX' AND timestamp = ?
            """, (timestamp,)).fetchone()

            if not row:
                row = cursor.execute("""
                    SELECT timestamp, open, high, low, close, volume
                    FROM spot_db.historical_spot
                    WHERE underlying = 'INDIAVIX' AND timestamp <= ?
                    ORDER BY timestamp DESC
                    LIMIT 1
                """, (timestamp,)).fetchone()
                
            if row:
                return SpotFrame(timestamp=row[0], open=row[1], high=row[2], low=row[3], close=row[4], volume=row[5])
        except Exception:
            pass
        return None

    # ─── POSITION LTP ──────────────────────────────────────────────────────────
    def get_position_ltp(
        self,
        underlying: str,
        expiry: date,
        strike: int,
        option_type: str,
        timestamp: datetime,
    ) -> Optional[float]:
        """Returns the last traded price (close) for a specific option contract."""
        cursor = self.con.cursor()
        try:
            row = cursor.execute("""
                SELECT close
                FROM historical_options
                WHERE underlying = ? AND expiry = ? AND strike = ? AND option_type = ? AND timestamp = ?
            """, (underlying, expiry, strike, option_type, timestamp)).fetchone()
            
            if row:
                return float(row[0])
            
            # Fallback: nearest timestamp before target
            row = cursor.execute("""
                SELECT close
                FROM historical_options
                WHERE underlying = ? AND expiry = ? AND strike = ? AND option_type = ? AND timestamp <= ?
                ORDER BY timestamp DESC
                LIMIT 1
            """, (underlying, expiry, strike, option_type, timestamp)).fetchone()
            
            if row:
                return float(row[0])
            return None
        finally:
            cursor.close()

    # ─── OPTION CANDLE (FULL OHLC) ─────────────────────────────────────────────
    def get_option_candle(
        self,
        underlying: str,
        expiry: date,
        strike: int,
        option_type: str,
        timestamp: datetime,
    ) -> Optional[OHLCCandle]:
        """Returns the full OHLC candle for a specific option contract."""
        cursor = self.con.cursor()
        try:
            row = cursor.execute("""
                SELECT timestamp, open, high, low, close, volume, open_interest
                FROM historical_options
                WHERE underlying = ? AND expiry = ? AND strike = ? AND option_type = ? AND timestamp = ?
            """, (underlying, expiry, strike, option_type, timestamp)).fetchone()
            
            if row:
                return OHLCCandle(
                    timestamp=row[0], open=float(row[1]), high=float(row[2]),
                    low=float(row[3]), close=float(row[4]), volume=int(row[5]),
                    open_interest=int(row[6]) if row[6] is not None else None
                )
            
            # Fallback: nearest timestamp before target
            row = cursor.execute("""
                SELECT timestamp, open, high, low, close, volume, open_interest
                FROM historical_options
                WHERE underlying = ? AND expiry = ? AND strike = ? AND option_type = ? AND timestamp <= ?
                ORDER BY timestamp DESC
                LIMIT 1
            """, (underlying, expiry, strike, option_type, timestamp)).fetchone()
            
            if row:
                return OHLCCandle(
                    timestamp=row[0], open=float(row[1]), high=float(row[2]),
                    low=float(row[3]), close=float(row[4]), volume=int(row[5]),
                    open_interest=int(row[6]) if row[6] is not None else None
                )
            return None
        finally:
            cursor.close()

    # ─── CLEANUP ───────────────────────────────────────────────────────────────
    def close(self):
        self.con.close()
