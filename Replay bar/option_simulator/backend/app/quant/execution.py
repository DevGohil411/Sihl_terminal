"""
Execution Engine — OHLC-Based Order Fill Simulation
====================================================
Simulates order fills from historical 1-minute OHLC candles.

CORE PRINCIPLE:
    A user's "entry at 10:16" gets filled from the OHLC candle at 10:16.
    The exact execution price depends on the configured ExecutionMode.

    TIMESTAMP INTEGRITY:
        The candle timestamp is PRESERVED EXACTLY as stored in ClickHouse.
        "15:15:59" stays "15:15:59". This engine never rounds or modifies timestamps.

Supported Execution Modes:
    OPEN  — Fill at the candle's Open price
    HIGH  — Fill at the candle's High price
    LOW   — Fill at the candle's Low price
    CLOSE — Fill at the candle's Close price (most common, AlgoTest default)
    MID   — Fill at (High + Low) / 2
    BID   — Simulated Bid = Close - Spread/2
    ASK   — Simulated Ask = Close + Spread/2
    VWAP  — Estimated VWAP from candle using (O+H+L+C)/4 proxy

Usage:
    from quant.execution import ExecutionEngine, ExecutionMode, SpotFrame

    engine = ExecutionEngine(mode=ExecutionMode.MID, slippage_bps=5)
    fill_price = engine.fill_price(candle)
"""

from enum import Enum
from dataclasses import dataclass
from typing import Optional
import math


# ─── EXECUTION MODES ───────────────────────────────────────────────────────────
class ExecutionMode(str, Enum):
    OPEN  = "OPEN"
    HIGH  = "HIGH"
    LOW   = "LOW"
    CLOSE = "CLOSE"
    MID   = "MID"
    BID   = "BID"
    ASK   = "ASK"
    VWAP  = "VWAP"
    LTP   = "LTP"  # Alias for CLOSE but explicitly LTP-based


class SlippageModel(str, Enum):
    FIXED = "FIXED"                          # Fixed bps slippage
    VOLATILITY_ADJUSTED = "VOLATILITY_ADJUSTED"  # Higher VIX = more slippage
    LIQUIDITY_ADJUSTED = "LIQUIDITY_ADJUSTED"    # Lower volume/OI = more slippage


# ─── CANDLE DATA MODEL ─────────────────────────────────────────────────────────
@dataclass
class OHLCCandle:
    """
    Represents a single 1-minute OHLC candle from historical data.
    All timestamp and price values are preserved EXACTLY from source.
    """
    timestamp: object    # datetime — exact, no rounding
    open: float
    high: float
    low: float
    close: float
    volume: int
    open_interest: Optional[int] = None


# ─── FILL MODEL ────────────────────────────────────────────────────────────────
@dataclass
class FillResult:
    """Outcome of a simulated order fill."""
    fill_price: float
    execution_mode: ExecutionMode
    slippage_amount: float      # Absolute slippage applied
    spread_half: float          # Half-spread used (for BID/ASK mode)
    candle_timestamp: object    # Original candle timestamp (exact, unchanged)
    is_valid: bool              # False if fill is logically impossible (e.g. fill > high)


# ─── SPREAD ESTIMATOR ──────────────────────────────────────────────────────────
class DynamicSpreadEstimator:
    """
    Estimates the bid-ask spread for options using a simple but realistic model.

    Spread drivers (simplified for historical simulation):
        1. Underlying Volatility:  Higher IV → wider spreads
        2. Moneyness:              Deep OTM → wider; ATM → narrowest
        3. Volume:                 Low volume → wider spreads
        4. Option Price Level:     Very low priced (< 5 Rs) → special rules

    NSE Tick Size Rules:
        Price < 10    : tick = 0.05
        10 <= Price   : tick = 0.05 (NSE options min tick is always 0.05)
    """

    MIN_TICK = 0.05
    MIN_SPREAD = 0.10   # Minimum spread of 2 ticks

    @staticmethod
    def estimate_spread(candle: OHLCCandle, iv: float = 0.20) -> float:
        """
        Returns the estimated full bid-ask spread for an option candle.

        Formula:
            base_spread = max(MIN_SPREAD, close * 0.001)   # ~0.1% of price
            vol_spread  = iv * 0.5                         # IV-adjusted component
            liq_spread  = max(0, (1000 - volume) * 0.001) # Liquidity penalty
            raw_spread  = base_spread + vol_spread + liq_spread

            # Round to nearest tick
            spread = round(raw_spread / MIN_TICK) * MIN_TICK
        """
        if candle.close <= 0:
            return DynamicSpreadEstimator.MIN_SPREAD

        base = max(DynamicSpreadEstimator.MIN_SPREAD, candle.close * 0.001)
        vol_component = iv * 0.5
        liq_penalty = max(0.0, (1000 - (candle.volume or 0)) * 0.001)

        raw = base + vol_component + liq_penalty

        # Round to nearest NSE tick
        ticks = round(raw / DynamicSpreadEstimator.MIN_TICK)
        return max(2, ticks) * DynamicSpreadEstimator.MIN_TICK  # min 2 ticks


# ─── EXECUTION ENGINE ──────────────────────────────────────────────────────────
class ExecutionEngine:
    """
    Simulates order execution from historical OHLC candles.

    Args:
        mode:         ExecutionMode — How the fill price is determined
        slippage_bps: Basis points of additional slippage (e.g. 5 = 0.05%)
        iv_estimate:  Implied Volatility estimate for spread calculation
    """

    def __init__(
        self,
        mode: ExecutionMode = ExecutionMode.CLOSE,
        slippage_bps: int = 0,
        iv_estimate: float = 0.20,
        slippage_model: SlippageModel = SlippageModel.FIXED,
        vix: float = 15.0,
    ):
        self.mode = mode
        self.slippage_bps = slippage_bps
        self.iv_estimate = iv_estimate
        self.slippage_model = slippage_model
        self.vix = vix
        self._spread_estimator = DynamicSpreadEstimator()

    def fill_price(self, candle: OHLCCandle, is_buy: bool = True) -> FillResult:
        """
        Computes the simulated fill price for a given OHLC candle.

        is_buy:
            True  = Buy order  (pays Ask in bid/ask mode, worst case = High)
            False = Sell order (gets Bid in bid/ask mode, worst case = Low)
        """
        spread = self._spread_estimator.estimate_spread(candle, self.iv_estimate)
        half_spread = spread / 2.0

        # ── Determine base fill price ──────────────────────────────────────────
        if self.mode == ExecutionMode.OPEN:
            base = candle.open
        elif self.mode == ExecutionMode.HIGH:
            base = candle.high
        elif self.mode == ExecutionMode.LOW:
            base = candle.low
        elif self.mode == ExecutionMode.CLOSE:
            base = candle.close
        elif self.mode == ExecutionMode.MID:
            base = (candle.high + candle.low) / 2.0
        elif self.mode == ExecutionMode.BID:
            base = candle.close - half_spread
        elif self.mode == ExecutionMode.ASK:
            base = candle.close + half_spread
        elif self.mode == ExecutionMode.VWAP:
            # OHLC VWAP proxy (accurate within ~2% for liquid options)
            base = (candle.open + candle.high + candle.low + candle.close) / 4.0
        elif self.mode == ExecutionMode.LTP:
            base = candle.close
        else:
            base = candle.close

        # ── Apply slippage ─────────────────────────────────────────────────────
        slippage_amount = 0.0
        if self.slippage_bps > 0 or self.slippage_model != SlippageModel.FIXED:
            effective_bps = self._compute_effective_slippage_bps(candle)
            slippage_amount = base * (effective_bps / 10000.0)
            if is_buy:
                base += slippage_amount   # Worse fill for buyer
            else:
                base -= slippage_amount   # Worse fill for seller

        # ── Round to NSE tick ──────────────────────────────────────────────────
        fill = self._round_to_tick(base)

        # ── Validity check ─────────────────────────────────────────────────────
        # A fill price must be within [Low, High] of the candle (except for ASK)
        is_valid = candle.low <= fill <= (candle.high + half_spread + 1.0)

        return FillResult(
            fill_price=fill,
            execution_mode=self.mode,
            slippage_amount=slippage_amount,
            spread_half=half_spread,
            candle_timestamp=candle.timestamp,  # EXACT — never modified
            is_valid=is_valid,
        )

    def _compute_effective_slippage_bps(self, candle: OHLCCandle) -> float:
        """Computes effective slippage based on the selected slippage model."""
        base_bps = self.slippage_bps

        if self.slippage_model == SlippageModel.FIXED:
            return float(base_bps)

        if self.slippage_model == SlippageModel.VOLATILITY_ADJUSTED:
            # VIX 15 = baseline, every 5 points VIX above 15 adds 1 bps
            vix_penalty = max(0.0, (self.vix - 15.0) / 5.0)
            return base_bps + vix_penalty

        if self.slippage_model == SlippageModel.LIQUIDITY_ADJUSTED:
            # Low volume / low OI = wider slippage
            volume = candle.volume or 0
            oi = candle.open_interest or 0
            # Baseline: 1000 volume + 50000 OI = no extra slippage
            vol_penalty = max(0.0, (1000 - volume) / 100.0)  # +1 bps per 100 volume shortfall
            oi_penalty = max(0.0, (50000 - oi) / 5000.0)      # +1 bps per 5000 OI shortfall
            return base_bps + min(vol_penalty, 20.0) + min(oi_penalty, 20.0)

        return float(base_bps)

    @staticmethod
    def _round_to_tick(price: float, tick: float = 0.05) -> float:
        """Rounds a price to the nearest NSE tick (0.05 paise)."""
        return round(round(price / tick) * tick, 2)


# ─── SL/TP EXECUTION ENGINE ────────────────────────────────────────────────────
class IntraCandlePriority(str, Enum):
    """Determines which trigger fires first when both SL and TP hit in same candle."""
    CONSERVATIVE = "CONSERVATIVE"  # SL first (worst case)
    AGGRESSIVE = "AGGRESSIVE"      # TP first (best case)
    REALISTIC = "REALISTIC"        # Based on candle path (open→high→low→close)


class SLTPExecutor:
    """
    Executes Stop-Loss and Take-Profit orders with intra-candle simulation.
    
    Supports:
    - Separate SL mode and TP mode (OPEN/HIGH/LOW/CLOSE/MID)
    - Intra-candle priority assumptions
    - Auto-close on trigger
    """

    @staticmethod
    def get_price_from_candle(candle: OHLCCandle, mode: ExecutionMode) -> float:
        """Extracts the relevant price from a candle based on execution mode."""
        if mode == ExecutionMode.OPEN:
            return candle.open
        elif mode == ExecutionMode.HIGH:
            return candle.high
        elif mode == ExecutionMode.LOW:
            return candle.low
        elif mode == ExecutionMode.CLOSE:
            return candle.close
        elif mode == ExecutionMode.MID:
            return (candle.high + candle.low) / 2.0
        else:
            return candle.close

    @staticmethod
    def check_sl_tp(
        pos: dict,
        candle: OHLCCandle,
        priority: IntraCandlePriority = IntraCandlePriority.CONSERVATIVE,
    ) -> dict:
        """
        Checks if SL or TP triggers on this candle.
        
        Returns:
            {"triggered": False} — No trigger
            {"triggered": True, "type": "SL", "exit_price": float, "exit_mode": str}
            {"triggered": True, "type": "TP", "exit_price": float, "exit_mode": str}
        """
        sl_price = pos.get("sl_price")
        tp_price = pos.get("tp_price")
        sl_mode = pos.get("sl_mode", "CLOSE")
        tp_mode = pos.get("tp_mode", "CLOSE")
        direction = pos["direction"]
        
        if sl_price is None and tp_price is None:
            return {"triggered": False}
        
        # For SL/TP detection, we check if the candle's range (high/low) crosses the level.
        # This is the correct intra-candle behavior: SL/TP can hit at ANY point in the candle.
        # The sl_mode/tp_mode only affects the EXIT price, not the detection.
        
        # Check if SL triggers (using candle range: low for BUY, high for SELL)
        sl_triggered = False
        sl_hit_price = None
        if sl_price is not None:
            if direction == "BUY":
                # For BUY: SL triggers if LOW drops to or below SL price
                if candle.low <= sl_price:
                    sl_triggered = True
                    # SL hit at the worst price within the candle (conservative)
                    sl_hit_price = min(candle.open, candle.low) if candle.open <= sl_price else sl_price
            else:  # SELL
                # For SELL: SL triggers if HIGH rises to or above SL price
                if candle.high >= sl_price:
                    sl_triggered = True
                    # SL hit at the worst price within the candle
                    sl_hit_price = max(candle.open, candle.high) if candle.open >= sl_price else sl_price
        
        # Check if TP triggers (using candle range: high for BUY, low for SELL)
        tp_triggered = False
        tp_hit_price = None
        if tp_price is not None:
            if direction == "BUY":
                # For BUY: TP triggers if HIGH rises to or above TP price
                if candle.high >= tp_price:
                    tp_triggered = True
                    # TP hit at the best price within the candle
                    tp_hit_price = max(candle.open, candle.high) if candle.open >= tp_price else tp_price
            else:  # SELL
                # For SELL: TP triggers if LOW drops to or below TP price
                if candle.low <= tp_price:
                    tp_triggered = True
                    # TP hit at the best price within the candle
                    tp_hit_price = min(candle.open, candle.low) if candle.open <= tp_price else tp_price
        
        if not sl_triggered and not tp_triggered:
            return {"triggered": False}
        
        # Both triggered in same candle - apply priority
        if sl_triggered and tp_triggered:
            if priority == IntraCandlePriority.CONSERVATIVE:
                # SL first (worst case)
                return {
                    "triggered": True,
                    "type": "SL",
                    "exit_price": sl_hit_price or sl_price,
                    "exit_mode": sl_mode,
                }
            elif priority == IntraCandlePriority.AGGRESSIVE:
                # TP first (best case)
                return {
                    "triggered": True,
                    "type": "TP",
                    "exit_price": tp_hit_price or tp_price,
                    "exit_mode": tp_mode,
                }
            else:  # REALISTIC
                # Based on candle path: open → high → low → close
                return SLTPExecutor._realistic_priority(
                    pos, candle, sl_price, tp_price, sl_mode, tp_mode
                )
        
        # Only one triggered
        if sl_triggered:
            return {
                "triggered": True,
                "type": "SL",
                "exit_price": sl_hit_price or sl_price,
                "exit_mode": sl_mode,
            }
        else:
            return {
                "triggered": True,
                "type": "TP",
                "exit_price": tp_hit_price or tp_price,
                "exit_mode": tp_mode,
            }

    @staticmethod
    def _realistic_priority(
        pos: dict,
        candle: OHLCCandle,
        sl_price: float,
        tp_price: float,
        sl_mode: str,
        tp_mode: str,
    ) -> dict:
        """
        Realistic priority: assumes candle follows open→high→low→close path.
        Checks which level is hit first based on direction.
        """
        direction = pos["direction"]
        
        # For BUY positions:
        # - SL is below entry, TP is above entry
        # - If open is below SL, SL hits immediately
        # - If open is above TP, TP hits immediately
        # - Otherwise, check path: open → high → low → close
        
        if direction == "BUY":
            # Check if SL is hit at open
            if candle.open <= sl_price:
                return {"triggered": True, "type": "SL", "exit_price": candle.open, "exit_mode": "OPEN"}
            # Check if TP is hit at high
            if candle.high >= tp_price:
                return {"triggered": True, "type": "TP", "exit_price": candle.high, "exit_mode": "HIGH"}
            # Check if SL is hit at low
            if candle.low <= sl_price:
                return {"triggered": True, "type": "SL", "exit_price": candle.low, "exit_mode": "LOW"}
        else:  # SELL
            # Check if SL is hit at open
            if candle.open >= sl_price:
                return {"triggered": True, "type": "SL", "exit_price": candle.open, "exit_mode": "OPEN"}
            # Check if SL is hit at high (SL is above entry, comes before TP in open→high→low→close)
            if candle.high >= sl_price:
                return {"triggered": True, "type": "SL", "exit_price": candle.high, "exit_mode": "HIGH"}
            # Check if TP is hit at low
            if candle.low <= tp_price:
                return {"triggered": True, "type": "TP", "exit_price": candle.low, "exit_mode": "LOW"}
        
        # Neither hit during candle path - shouldn't reach here if called correctly
        return {"triggered": False}


# ─── POSITION MTM ENGINE ───────────────────────────────────────────────────────
class MTMEngine:
    """
    Computes Mark-to-Market PnL for a portfolio of option positions.
    Supports full OHLC-based MTM (not just close-based).
    """

    @staticmethod
    def compute_leg_mtm(
        entry_price: float,
        current_candle: OHLCCandle,
        direction: str,      # 'BUY' or 'SELL'
        qty: int,
        lot_size: int,
        execution_mode: ExecutionMode = ExecutionMode.CLOSE,
    ) -> dict:
        """
        Computes the MTM for a single option leg.

        Returns a dict with:
            close_pnl:  MTM using candle close (standard)
            high_pnl:   Best case MTM (favorable extreme)
            low_pnl:    Worst case MTM (adverse extreme)
        """
        mult = 1 if direction.upper() == "BUY" else -1
        contracts = qty * lot_size

        def pnl(current: float) -> float:
            return (current - entry_price) * mult * contracts

        return {
            "close_pnl": round(pnl(current_candle.close), 2),
            "high_pnl":  round(pnl(current_candle.high), 2),
            "low_pnl":   round(pnl(current_candle.low), 2),
            "open_pnl":  round(pnl(current_candle.open), 2),
            "candle_timestamp": current_candle.timestamp,
        }

    @staticmethod
    def compute_portfolio_mtm(
        positions: list[dict],
        candle_lookup: dict,   # {(expiry, strike, opt_type): OHLCCandle}
        lot_size_map: dict,    # {underlying: lot_size}
    ) -> dict:
        """
        Aggregates MTM across all legs in a multi-leg strategy.
        Returns total MTM and per-leg breakdown.
        """
        total_close_pnl = 0.0
        leg_results = []

        for pos in positions:
            key = (pos["expiry"], pos["strike"], pos["option_type"])
            candle = candle_lookup.get(key)

            if candle is None:
                leg_results.append({"leg": pos, "error": "No candle data found", "pnl": 0.0})
                continue

            underlying = pos.get("underlying", "NIFTY")
            lot_size = lot_size_map.get(underlying, 50)

            leg_mtm = MTMEngine.compute_leg_mtm(
                entry_price=pos["entry_price"],
                current_candle=candle,
                direction=pos["direction"],
                qty=pos["qty"],
                lot_size=lot_size,
            )
            total_close_pnl += leg_mtm["close_pnl"]
            leg_results.append({"leg": pos, **leg_mtm})

        return {
            "total_mtm": round(total_close_pnl, 2),
            "legs": leg_results,
        }
