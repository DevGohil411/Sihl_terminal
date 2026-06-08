"""
Deterministic Replay State Machine
===================================
Controls the session timeline with guaranteed determinism.

DETERMINISM GUARANTEE:
    Given the same session_id, underlying, date, and sequence of actions,
    the system ALWAYS produces identical prices, fills, and MTM values.
    No randomness. No wall-clock dependencies. No threading races.

STATE MACHINE TRANSITIONS:
    IDLE → INITIALIZED → PLAYING → PAUSED → PLAYING → COMPLETED
                                         ↑        ↓
                                         └── SEEKED ──┘

Supported Actions:
    INIT     — Create session at start_time
    PLAY     — Begin autoplay at configured speed
    PAUSE    — Freeze at current timestamp
    STEP     — Advance by exactly one candle interval
    JUMP     — Jump by +Nm, +Nh, -Nm, etc.
    SEEK     — Jump to an absolute timestamp
    SOD      — Jump to Start of Day (09:15)
    EOD      — Jump to End of Day (15:29)

Usage:
    from engine.replay import ReplaySession, ReplayAction

    session = ReplaySession(
        underlying="NIFTY",
        session_date=date(2026, 5, 4),
        start_time=datetime(2026, 5, 4, 9, 15, 0),
        execution_mode="MID",
        slippage_bps=5,
    )

    frame = session.step(action="JUMP", value_minutes=5)
"""

import uuid
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from enum import Enum
from typing import Optional

import polars as pl
from app.data.reader import OptionChainReader
from app.data.constants import LOT_SIZES, STRIKE_INTERVALS
from app.quant.greeks import price_chain, OptionChainAnalytics, expected_move
from app.quant.execution import ExecutionEngine, ExecutionMode, SlippageModel, OHLCCandle as ExecOHLCCandle, MTMEngine, SLTPExecutor, IntraCandlePriority
from app.quant.analytics import compute_analytics, trade_quality_score


# ─── SESSION STATE ─────────────────────────────────────────────────────────────
class SessionState(str, Enum):
    IDLE        = "IDLE"
    INITIALIZED = "INITIALIZED"
    PLAYING     = "PLAYING"
    PAUSED      = "PAUSED"
    COMPLETED   = "COMPLETED"


# ─── ACTION TYPES ─────────────────────────────────────────────────────────────
class ReplayAction(str, Enum):
    STEP     = "STEP"     # +1 candle
    JUMP     = "JUMP"     # +N minutes
    SEEK     = "SEEK"     # Absolute timestamp
    SOD      = "SOD"      # Start of Day (09:15)
    EOD      = "EOD"      # End of Day (15:29)
    PLAY     = "PLAY"     # Start autoplay
    PAUSE    = "PAUSE"    # Pause autoplay
    PREV_DAY = "PREV_DAY" # -1 trading day
    NEXT_DAY = "NEXT_DAY" # +1 trading day


# ─── SESSION SNAPSHOT (Immutable Frame) ────────────────────────────────────────
@dataclass
class SessionFrame:
    """
    A single immutable snapshot of the simulator state at a point in time.
    Used for replay determinism — the same frame can be reconstructed identically.
    """
    session_id: str
    current_timestamp: datetime   # EXACT — never modified
    frame_number: int             # Monotonically increasing frame sequence
    underlying: str
    spot_open: float
    spot_high: float
    spot_low: float
    spot_close: float
    previous_day_close: float
    day_open: float                 # Opening price of the trading day (09:15)
    future_price: float
    vix_close: float
    lot_size: int
    net_pnl: float
    positions: list
    greek_exposure: dict
    option_chain_summary: dict    # Lightweight summary (not full chain)
    chain_data: list              # FULL enriched chain
    available_expiries: list      # Expiries available on this date
    active_expiry: date           # Current active expiry
    pcr: float
    max_pain_strike: Optional[int]
    gex: float
    expected_move: dict           # 1SD & 2SD expected move data
    trade_log: list               # Activity timeline (entry, exit, SL/TP hits)
    trade_quality: dict           # Trade quality score (0-100)
    sl_tp_events: list  # SL/TP trigger events for this frame


# ─── REPLAY SESSION ────────────────────────────────────────────────────────────
class ReplaySession:
    """
    Fully deterministic replay session.
    All state transitions are driven by the ordered list of historical timestamps
    fetched once on initialization. Time never comes from wall clock.
    """

    # Trading hours boundaries (NSE)
    SOD_TIME = (9, 15, 0)    # 09:15:00
    EOD_TIME = (15, 29, 0)   # 15:29:00 (last candle before close)

    def __init__(
        self,
        underlying: str,
        session_date: date,
        execution_mode: str = "CLOSE",
        slippage_bps: int = 0,
        slippage_model: str = "FIXED",
        default_expiry: Optional[date] = None,
        num_strikes: int = 15,
        reader: Optional[OptionChainReader] = None,
    ):
        self.session_id = str(uuid.uuid4())
        self.underlying = underlying
        self.session_date = session_date
        self.state = SessionState.INITIALIZED
        self.positions: list[dict] = []
        self.trade_log: list[dict] = []
        self._equity_curve: list[float] = [0.0]

        # Initialize sub-engines
        self._exec_engine = ExecutionEngine(
            mode=ExecutionMode(execution_mode),
            slippage_bps=slippage_bps,
            slippage_model=SlippageModel(slippage_model),
        )
        self._reader = reader or OptionChainReader()
        self._num_strikes = num_strikes

        # ── Load full timeline for this session date ────────────────────────────
        # This is the KEY to determinism: we get ALL timestamps upfront
        # and navigate through them using an index pointer.
        raw_timeline: list[datetime] = self._reader.get_available_timestamps(
            underlying=underlying,
            session_date=session_date,
        )
        # Ensure all timeline timestamps are timezone-naive for consistent comparison
        self._timeline: list[datetime] = [
            ts.replace(tzinfo=None) if ts.tzinfo is not None else ts
            for ts in raw_timeline
        ]

        if not self._timeline:
            raise ValueError(
                f"No data found for {underlying} on {session_date}. "
                f"Ensure the ETL pipeline has been run for this date."
            )

        # Start at the first available timestamp (09:15:xx)
        self._cursor: int = 0
        self.current_timestamp: datetime = self._timeline[0]
        self._frame_number: int = 0  # Frame sequence counter for determinism validation

        # Capture day open price (09:15 first tick)
        _sod_candle = self._reader.get_spot_at_timestamp(
            underlying=underlying,
            timestamp=self._timeline[0],
        )
        self._day_open: float = _sod_candle.open if _sod_candle else 0.0

        # Load available expiries for this session
        self._available_expiries: list[date] = self._reader.get_available_expiries(
            underlying=underlying,
            as_of_date=session_date,
        )

        # Default to nearest expiry
        self.active_expiry: date = default_expiry or (
            self._available_expiries[0] if self._available_expiries else session_date
        )

    # ─── TIMELINE NAVIGATION ──────────────────────────────────────────────────

    def _advance_cursor(self, minutes: int) -> bool:
        """
        Moves the cursor forward by the smallest number of steps that
        reaches or exceeds the target time offset.
        Returns False if we've hit EOD.
        """
        target = self.current_timestamp + timedelta(minutes=minutes)
        while self._cursor < len(self._timeline) - 1:
            if self._timeline[self._cursor + 1] > target:
                break
            self._cursor += 1
        self.current_timestamp = self._timeline[self._cursor]
        at_eod = self._cursor >= len(self._timeline) - 1
        if at_eod:
            self.state = SessionState.COMPLETED
        return not at_eod

    def _rewind_cursor(self, minutes: int) -> bool:
        """Moves the cursor backward."""
        target = self.current_timestamp - timedelta(minutes=minutes)
        while self._cursor > 0:
            if self._timeline[self._cursor - 1] >= target:
                self._cursor -= 1
            else:
                break
        self.current_timestamp = self._timeline[self._cursor]
        return True

    def _seek_to(self, target: datetime):
        """Seeks to the closest timestamp at or before the target."""
        # Binary search for efficiency on large timelines
        lo, hi = 0, len(self._timeline) - 1
        while lo < hi:
            mid = (lo + hi + 1) // 2
            if self._timeline[mid] <= target:
                lo = mid
            else:
                hi = mid - 1
        self._cursor = lo
        self.current_timestamp = self._timeline[lo]

    # ─── ACTION DISPATCHER ────────────────────────────────────────────────────

    def dispatch(self, action: ReplayAction, **kwargs) -> SessionFrame:
        """
        Main entry point for all replay actions.
        Returns an immutable SessionFrame snapshot after processing.
        """
        if action == ReplayAction.STEP:
            self._advance_cursor(minutes=1)

        elif action == ReplayAction.JUMP:
            minutes = kwargs.get("minutes", 5)
            if minutes > 0:
                self._advance_cursor(minutes=minutes)
            else:
                self._rewind_cursor(minutes=abs(minutes))

        elif action == ReplayAction.SEEK:
            target = kwargs.get("timestamp")
            if target:
                self._seek_to(target)

        elif action == ReplayAction.SOD:
            sod_dt = datetime(
                self.session_date.year, self.session_date.month, self.session_date.day,
                *self.SOD_TIME
            )
            self._seek_to(sod_dt)

        elif action == ReplayAction.EOD:
            eod_dt = datetime(
                self.session_date.year, self.session_date.month, self.session_date.day,
                *self.EOD_TIME
            )
            self._seek_to(eod_dt)

        # PLAY/PAUSE update state but don't move the cursor
        elif action == ReplayAction.PLAY:
            self.state = SessionState.PLAYING

        elif action == ReplayAction.PAUSE:
            self.state = SessionState.PAUSED

        elif action == ReplayAction.PREV_DAY:
            # Move to previous trading day — handled at API level by re-init
            pass

        elif action == ReplayAction.NEXT_DAY:
            # Move to next trading day — handled at API level by re-init
            pass

        return self._build_frame()

    def update_config(self, num_strikes: Optional[int] = None, active_expiry: Optional[date] = None):
        """Dynamically update session config during replay."""
        if num_strikes is not None:
            self._num_strikes = num_strikes
        if active_expiry is not None:
            if active_expiry in self._available_expiries:
                self.active_expiry = active_expiry
        return self._build_frame()

    # ─── FRAME BUILDER ────────────────────────────────────────────────────────

    def _build_frame(self) -> SessionFrame:
        """
        Constructs the full session state snapshot at the current timestamp.
        This is the hot path — must complete in <50ms total.
        """
        ts = self.current_timestamp

        # ── 1. Spot price ──────────────────────────────────────────────────────
        spot_candle = self._reader.get_spot_at_timestamp(
            underlying=self.underlying,
            timestamp=ts,
        )
        if spot_candle is None:
            raise ValueError(f"No spot data available for {self.underlying} at {ts}")
        spot_close = spot_candle.close
        spot_open  = spot_candle.open
        spot_high  = spot_candle.high
        spot_low   = spot_candle.low

        # ── 1b. VIX ────────────────────────────────────────────────────────────
        vix_candle = self._reader.get_vix_at_timestamp(timestamp=ts)
        vix_close = vix_candle.close if vix_candle else 0.0

        # Lot size
        lot_size = LOT_SIZES.get(self.underlying, 50)

        # ── 1c. Previous day close ─────────────────────────────────────────────
        prev_close = self._reader.get_previous_day_close(self.underlying, ts.date()) or spot_open

        # ── 2. Option chain ────────────────────────────────────────────────────
        atm = OptionChainReader.calculate_atm_strike(spot_close, self.underlying)
        raw_chain = self._reader.get_option_chain(
            underlying=self.underlying,
            expiry=self.active_expiry,
            timestamp=ts,
            atm_strike=atm,
            num_strikes=self._num_strikes,
        )

        # ── 3. Greeks enrichment ───────────────────────────────────────────────
        enriched_chain = price_chain(
            spot=spot_close,
            chain_df=raw_chain,
            expiry=self.active_expiry,
            timestamp=ts,
        )

        # ── 4. Chain analytics ─────────────────────────────────────────────────
        pcr_data = OptionChainAnalytics.put_call_ratio(enriched_chain) if not enriched_chain.is_empty() else {"pcr": 1.0}
        gex = OptionChainAnalytics.gamma_exposure(enriched_chain, spot=spot_close) if "gamma" in enriched_chain.columns else 0.0
        max_pain = OptionChainAnalytics.max_pain(enriched_chain) if not enriched_chain.is_empty() else None

        # ── 4b. Synthetic Future (Put-Call Parity: F = K + CE - PE) ────────────
        future_price = spot_close
        atm_iv = 0.0
        if not enriched_chain.is_empty():
            atm_ce = enriched_chain.filter((pl.col("strike") == atm) & (pl.col("option_type") == "CE"))
            atm_pe = enriched_chain.filter((pl.col("strike") == atm) & (pl.col("option_type") == "PE"))
            ce_close = float(atm_ce["close"][0]) if not atm_ce.is_empty() else 0.0
            pe_close = float(atm_pe["close"][0]) if not atm_pe.is_empty() else 0.0
            if ce_close > 0 and pe_close > 0:
                future_price = atm + ce_close - pe_close
            # ATM IV for expected move calculation
            ce_iv = float(atm_ce["iv"][0]) if not atm_ce.is_empty() and "iv" in atm_ce.columns else 0.0
            pe_iv = float(atm_pe["iv"][0]) if not atm_pe.is_empty() and "iv" in atm_pe.columns else 0.0
            atm_iv = (ce_iv + pe_iv) / 2 if ce_iv > 0 and pe_iv > 0 else max(ce_iv, pe_iv)

        # ── 4c. Expected Move (1SD & 2SD) ──────────────────────────────────────
        dte = max(0, (self.active_expiry - ts.date()).days)
        em_data = expected_move(spot_close, atm_iv, dte)

        # ── 5. Portfolio MTM ───────────────────────────────────────────────────
        net_pnl = 0.0
        greek_exposure = {"delta": 0.0, "gamma": 0.0, "theta": 0.0, "vega": 0.0}
        # Only increment frame_number when timestamp actually changes (not on PLAY/PAUSE)
        if not hasattr(self, '_last_frame_ts') or self._last_frame_ts != ts:
            self._frame_number += 1
            self._last_frame_ts = ts

        if self.positions:
            # Build candle lookup from enriched chain for ALL position expiries
            candle_lookup = {}
            # Get unique expiries from positions
            position_expiries = set(p["expiry"] for p in self.positions)
            for expiry in position_expiries:
                # If expiry is the active one, we already have enriched_chain
                if expiry == self.active_expiry:
                    chain_for_expiry = enriched_chain
                else:
                    # Fetch chain for this expiry
                    raw = self._reader.get_option_chain(
                        underlying=self.underlying,
                        expiry=expiry,
                        timestamp=ts,
                        atm_strike=atm,
                        num_strikes=self._num_strikes,
                    )
                    chain_for_expiry = price_chain(
                        spot=spot_close,
                        chain_df=raw,
                        expiry=expiry,
                        timestamp=ts,
                    )
                for row in chain_for_expiry.iter_rows(named=True):
                    key = (expiry, row["strike"], row["option_type"])
                    candle_lookup[key] = ExecOHLCCandle(
                        timestamp=ts,
                        open=row["open"], high=row["high"],
                        low=row["low"], close=row["close"],
                        volume=row["volume"], open_interest=row["open_interest"],
                    )

            mtm = MTMEngine.compute_portfolio_mtm(
                positions=self.positions,
                candle_lookup=candle_lookup,
                lot_size_map=LOT_SIZES,
            )
            net_pnl = mtm["total_mtm"]

            # Aggregate Greeks from enriched chain for active positions
        # Also attach per-leg Greeks to positions for frontend display
        for pos in self.positions:
            pos_expiry = pos["expiry"]
            if pos_expiry == self.active_expiry:
                chain_for_pos = enriched_chain
            else:
                raw = self._reader.get_option_chain(
                    underlying=self.underlying,
                    expiry=pos_expiry,
                    timestamp=ts,
                    atm_strike=atm,
                    num_strikes=self._num_strikes,
                )
                chain_for_pos = price_chain(
                    spot=spot_close,
                    chain_df=raw,
                    expiry=pos_expiry,
                    timestamp=ts,
                )
            matching = chain_for_pos.filter(
                (pl.col("strike") == pos["strike"]) &
                (pl.col("option_type") == pos["option_type"])
            )
            if matching.is_empty():
                continue
            direction_mult = 1 if pos["direction"] == "BUY" else -1
            qty = pos["qty"]
            # Store per-leg Greeks on position for frontend
            pos["leg_greeks"] = {
                "iv": float(matching["iv"][0]) if "iv" in matching.columns else 0.0,
                "delta": float(matching["delta"][0]) if "delta" in matching.columns else 0.0,
                "gamma": float(matching["gamma"][0]) if "gamma" in matching.columns else 0.0,
                "theta": float(matching["theta"][0]) if "theta" in matching.columns else 0.0,
                "vega": float(matching["vega"][0]) if "vega" in matching.columns else 0.0,
            }
            for g in ["delta", "gamma", "theta", "vega"]:
                if g in matching.columns:
                    greek_exposure[g] += float(matching[g][0]) * direction_mult * qty * lot_size

        # ── Check SL/TP triggers ───────────────────────────────────────────────
        sl_tp_events = self.check_sl_tp()

        return SessionFrame(
            session_id=self.session_id,
            current_timestamp=ts,
            frame_number=self._frame_number,
            underlying=self.underlying,
            spot_open=spot_open,
            spot_high=spot_high,
            spot_low=spot_low,
            spot_close=spot_close,
            previous_day_close=prev_close,
            day_open=self._day_open,
            future_price=future_price,
            vix_close=vix_close,
            lot_size=lot_size,
            net_pnl=net_pnl,
            positions=list(self.positions),
            greek_exposure=greek_exposure,
            option_chain_summary={"atm_strike": atm, "pcr": pcr_data.get("pcr", 1.0)},
            chain_data=enriched_chain.to_dicts(),
            available_expiries=self._available_expiries,
            active_expiry=self.active_expiry,
            pcr=pcr_data.get("pcr", 1.0),
            max_pain_strike=max_pain,
            gex=gex,
            expected_move=em_data,
            trade_log=list(self.trade_log),
            trade_quality=trade_quality_score(self.positions, lot_size),
            sl_tp_events=sl_tp_events,
        )

    # ─── POSITION MANAGEMENT ──────────────────────────────────────────────────

    def add_position(
        self,
        strike: int,
        option_type: str,
        direction: str,
        qty: int,
        execution_mode: Optional[str] = None,
    ) -> dict:
        """
        Adds a new leg to the portfolio.
        Fill price determined by the session's execution mode (or override).
        """
        # Get current candle for this option
        option_candle = self._reader.get_option_candle(
            underlying=self.underlying,
            expiry=self.active_expiry,
            strike=strike,
            option_type=option_type,
            timestamp=self.current_timestamp,
        )

        if option_candle is None:
            return {"error": f"No price data for {self.underlying} {strike}{option_type} at {self.current_timestamp}"}

        # Simulate fill using execution engine with TRUE OHLC
        candle = ExecOHLCCandle(
            timestamp=option_candle.timestamp,
            open=option_candle.open,
            high=option_candle.high,
            low=option_candle.low,
            close=option_candle.close,
            volume=option_candle.volume,
        )
        try:
            mode = ExecutionMode(execution_mode) if execution_mode else self._exec_engine.mode
        except ValueError:
            return {"error": f"Invalid execution mode: {execution_mode}. Must be one of {[m.value for m in ExecutionMode]}"}
        if option_type not in ("CE", "PE"):
            return {"error": "option_type must be CE or PE"}
        if direction.upper() not in ("BUY", "SELL"):
            return {"error": "direction must be BUY or SELL"}
        engine = ExecutionEngine(mode=mode, slippage_bps=self._exec_engine.slippage_bps)
        fill = engine.fill_price(candle, is_buy=(direction.upper() == "BUY"))

        leg = {
            "leg_id": str(uuid.uuid4()),
            "underlying": self.underlying,
            "expiry": self.active_expiry,
            "strike": strike,
            "option_type": option_type,
            "direction": direction.upper(),
            "qty": qty,
            "entry_price": fill.fill_price,
            "entry_timestamp": self.current_timestamp,   # EXACT timestamp preserved
            "execution_mode": fill.execution_mode,
            "slippage_amount": fill.slippage_amount,
            "sl_price": None,
            "tp_price": None,
            "sl_mode": "CLOSE",
            "tp_mode": "CLOSE",
        }

        self.positions.append(leg)
        self.trade_log.append({"action": "OPEN", **leg})
        return leg

    def update_leg_sl_tp(
        self,
        leg_id: str,
        sl_price: Optional[float] = None,
        tp_price: Optional[float] = None,
        sl_mode: Optional[str] = None,
        tp_mode: Optional[str] = None,
    ) -> dict:
        """Updates SL/TP prices and modes for a position leg."""
        leg = next((p for p in self.positions if p["leg_id"] == leg_id), None)
        if not leg:
            return {"error": f"Leg {leg_id} not found"}
        if sl_price is not None:
            leg["sl_price"] = round(sl_price, 2)
        if tp_price is not None:
            leg["tp_price"] = round(tp_price, 2)
        if sl_mode is not None:
            leg["sl_mode"] = sl_mode
        if tp_mode is not None:
            leg["tp_mode"] = tp_mode
        return {
            "leg_id": leg_id,
            "sl_price": leg["sl_price"],
            "tp_price": leg["tp_price"],
            "sl_mode": leg["sl_mode"],
            "tp_mode": leg["tp_mode"],
        }

    def check_sl_tp(self, priority: IntraCandlePriority = IntraCandlePriority.CONSERVATIVE) -> list[dict]:
        """
        Checks all positions for SL/TP triggers using OHLC-based intra-candle simulation.
        Returns triggered legs with exit details.
        """
        triggered = []
        for pos in self.positions:
            if pos.get("sl_price") is None and pos.get("tp_price") is None:
                continue
            
            # Skip SL/TP check on the entry candle — only check from next candle onwards
            entry_ts = pos.get("entry_timestamp")
            if entry_ts and self.current_timestamp <= entry_ts:
                continue
            
            # Get full OHLC candle for this position
            option_candle = self._reader.get_option_candle(
                underlying=pos["underlying"],
                expiry=pos["expiry"],
                strike=pos["strike"],
                option_type=pos["option_type"],
                timestamp=self.current_timestamp,
            )
            if option_candle is None:
                continue
            
            candle = ExecOHLCCandle(
                timestamp=option_candle.timestamp,
                open=option_candle.open,
                high=option_candle.high,
                low=option_candle.low,
                close=option_candle.close,
                volume=option_candle.volume,
            )
            
            result = SLTPExecutor.check_sl_tp(pos, candle, priority)
            if result["triggered"]:
                triggered.append({
                    "leg_id": pos["leg_id"],
                    "trigger": result["type"],
                    "exit_price": result["exit_price"],
                    "exit_mode": result["exit_mode"],
                    "candle_timestamp": self.current_timestamp,
                })
        return triggered

    def close_position(self, leg_id: str, qty: Optional[int] = None) -> dict:
        """Closes a position leg (supports partial close via qty parameter)."""
        leg = next((p for p in self.positions if p["leg_id"] == leg_id), None)
        if not leg:
            return {"error": f"Leg {leg_id} not found"}

        close_price = self._reader.get_position_ltp(
            underlying=leg["underlying"],
            expiry=leg["expiry"],
            strike=leg["strike"],
            option_type=leg["option_type"],
            timestamp=self.current_timestamp,
        )

        if close_price is None:
            return {"error": "No LTP data available for close"}
        close_qty = qty if qty is not None else leg["qty"]
        if close_qty <= 0:
            return {"error": "Invalid close quantity"}
        if close_qty > leg["qty"]:
            return {"error": f"Close quantity {close_qty} exceeds position size {leg['qty']}"}
        direction_mult = 1 if leg["direction"] == "BUY" else -1
        lot_size = LOT_SIZES.get(leg["underlying"], 50)
        realized_pnl = (close_price - leg["entry_price"]) * direction_mult * close_qty * lot_size

        result = {
            "leg_id": leg_id,
            "close_price": close_price,
            "close_timestamp": self.current_timestamp,
            "close_qty": close_qty,
            "realized_pnl": round(realized_pnl, 2),
        }

        # Remove or reduce position
        if close_qty >= leg["qty"]:
            self.positions = [p for p in self.positions if p["leg_id"] != leg_id]
        else:
            leg["qty"] -= close_qty

        self.trade_log.append({"action": "CLOSE", **result})
        return result


    # ─── STRATEGY BUILDER ───────────────────────────────────────────────────────

    def build_strategy(self, template: str, params: Optional[dict] = None) -> list[dict]:
        """
        Builds multi-leg option strategies from named templates.

        Templates:
            SHORT_STRADDLE    : Sell ATM CE + Sell ATM PE
            LONG_STRADDLE     : Buy ATM CE + Buy ATM PE
            SHORT_STRANGLE    : Sell OTM CE + Sell OTM PE (default ±4 intervals)
            LONG_STRANGLE     : Buy OTM CE + Buy OTM PE (default ±4 intervals)
            IRON_CONDOR       : Sell OTM CE/PE, Buy further OTM CE/PE wings
            IRON_FLY          : Sell ATM CE/PE, Buy OTM CE/PE wings
            BULL_CALL_SPREAD  : Buy ITM/ATM CE, Sell OTM CE
            BEAR_PUT_SPREAD   : Buy ITM/ATM PE, Sell OTM PE
            DELTA_NEUTRAL_STRANGLE : Select strikes by target delta (e.g., 0.30)
        """
        params = params or {}
        interval = STRIKE_INTERVALS.get(self.underlying, 50)
        atm = OptionChainReader.calculate_atm_strike(
            self._get_current_spot_close(), self.underlying
        )
        qty = params.get("qty", 1)
        wings = params.get("wing_intervals", 4)
        spread = params.get("spread_intervals", 2)

        templates = {
            "SHORT_STRADDLE": [
                {"strike": atm, "option_type": "CE", "direction": "SELL", "qty": qty},
                {"strike": atm, "option_type": "PE", "direction": "SELL", "qty": qty},
            ],
            "LONG_STRADDLE": [
                {"strike": atm, "option_type": "CE", "direction": "BUY", "qty": qty},
                {"strike": atm, "option_type": "PE", "direction": "BUY", "qty": qty},
            ],
            "SHORT_STRANGLE": [
                {"strike": atm + interval * wings, "option_type": "CE", "direction": "SELL", "qty": qty},
                {"strike": atm - interval * wings, "option_type": "PE", "direction": "SELL", "qty": qty},
            ],
            "LONG_STRANGLE": [
                {"strike": atm + interval * wings, "option_type": "CE", "direction": "BUY", "qty": qty},
                {"strike": atm - interval * wings, "option_type": "PE", "direction": "BUY", "qty": qty},
            ],
            "IRON_CONDOR": [
                {"strike": atm + interval * wings, "option_type": "CE", "direction": "SELL", "qty": qty},
                {"strike": atm - interval * wings, "option_type": "PE", "direction": "SELL", "qty": qty},
                {"strike": atm + interval * wings * 2, "option_type": "CE", "direction": "BUY", "qty": qty},
                {"strike": atm - interval * wings * 2, "option_type": "PE", "direction": "BUY", "qty": qty},
            ],
            "IRON_FLY": [
                {"strike": atm, "option_type": "CE", "direction": "SELL", "qty": qty},
                {"strike": atm, "option_type": "PE", "direction": "SELL", "qty": qty},
                {"strike": atm + interval * wings, "option_type": "CE", "direction": "BUY", "qty": qty},
                {"strike": atm - interval * wings, "option_type": "PE", "direction": "BUY", "qty": qty},
            ],
            "BULL_CALL_SPREAD": [
                {"strike": atm, "option_type": "CE", "direction": "BUY", "qty": qty},
                {"strike": atm + interval * spread, "option_type": "CE", "direction": "SELL", "qty": qty},
            ],
            "BEAR_PUT_SPREAD": [
                {"strike": atm, "option_type": "PE", "direction": "BUY", "qty": qty},
                {"strike": atm - interval * spread, "option_type": "PE", "direction": "SELL", "qty": qty},
            ],
        }

        legs = templates.get(template.upper())
        if not legs:
            raise ValueError(f"Unknown strategy template: {template}. Available: {list(templates.keys())}")

        # Execute each leg
        results = []
        for leg in legs:
            result = self.add_position(
                strike=leg["strike"],
                option_type=leg["option_type"],
                direction=leg["direction"],
                qty=leg["qty"],
            )
            if "error" in result:
                raise ValueError(f"Strategy leg failed: {result['error']}")
            results.append(result)

        return results

    def find_delta_strike(
        self,
        target_delta: float,
        option_type: str,
        side: str = "closest",  # "closest", "above", "below"
    ) -> Optional[int]:
        """
        Finds the strike in the current chain whose delta is closest to target_delta.
        Requires the enriched chain (with Greeks) at the current timestamp.
        """
        ts = self.current_timestamp
        spot = self._get_current_spot_close()
        atm = OptionChainReader.calculate_atm_strike(spot, self.underlying)

        raw_chain = self._reader.get_option_chain(
            underlying=self.underlying,
            expiry=self.active_expiry,
            timestamp=ts,
            atm_strike=atm,
            num_strikes=self._num_strikes,
        )
        if raw_chain.is_empty():
            return None

        enriched = price_chain(spot=spot, chain_df=raw_chain, expiry=self.active_expiry, timestamp=ts)
        if enriched.is_empty() or "delta" not in enriched.columns:
            return None

        filtered = enriched.filter(pl.col("option_type") == option_type)
        if filtered.is_empty():
            return None

        best_strike = None
        best_diff = float("inf")

        for row in filtered.iter_rows(named=True):
            delta = abs(row["delta"]) if option_type == "PE" else row["delta"]
            diff = abs(delta - target_delta)

            if side == "above" and delta < target_delta:
                continue
            if side == "below" and delta > target_delta:
                continue

            if diff < best_diff:
                best_diff = diff
                best_strike = int(row["strike"])

        return best_strike

    def _get_current_spot_close(self) -> float:
        """Helper to get current spot close price."""
        spot = self._reader.get_spot_at_timestamp(self.underlying, self.current_timestamp)
        if spot is None:
            raise ValueError(f"No spot data for {self.underlying} at {self.current_timestamp}")
        return spot.close

    # ─── ANALYTICS ──────────────────────────────────────────────────────────────

    def compute_analytics(self) -> dict:
        """Computes full analytics suite from current session state."""
        from app.quant.analytics import compute_analytics as _compute
        result = _compute(self.trade_log, net_pnl=self._compute_net_pnl_from_log())
        return {
            "sharpe_ratio": result.sharpe_ratio,
            "calmar_ratio": result.calmar_ratio,
            "profit_factor": result.profit_factor,
            "max_drawdown": result.max_drawdown,
            "max_drawdown_pct": result.max_drawdown_pct,
            "win_rate": result.win_rate,
            "expectancy": result.expectancy,
            "total_trades": result.total_trades,
            "winning_trades": result.winning_trades,
            "losing_trades": result.losing_trades,
            "avg_profit": result.avg_profit,
            "avg_loss": result.avg_loss,
            "gross_profit": result.gross_profit,
            "gross_loss": result.gross_loss,
            "net_pnl": result.net_pnl,
            "return_on_max_dd": result.return_on_max_dd,
        }

    def _compute_net_pnl_from_log(self) -> float:
        """Computes realized net PnL from trade log."""
        return sum(
            t.get("realized_pnl", 0.0)
            for t in self.trade_log
            if t.get("action") == "CLOSE"
        )
