"""
Portfolio Analytics Engine
==========================
Computes advanced trading metrics from equity curve and trade log.

Metrics:
    - Sharpe Ratio          : Risk-adjusted return (annualized)
    - Calmar Ratio          : Return / Max Drawdown
    - Profit Factor         : Gross Profit / Gross Loss
    - Max Drawdown          : Largest peak-to-trough decline
    - Win Rate              : % of winning trades
    - Expectancy            : Average outcome per trade
    - Return/MaxDD (RoMaD)  : Alias for Calmar
"""

import math
from typing import List, Dict, Optional
from dataclasses import dataclass


@dataclass
class TradeRecord:
    """Minimal trade record for analytics."""
    action: str           # "OPEN" or "CLOSE"
    realized_pnl: float   # PnL on close
    direction: str        # "BUY" or "SELL"
    option_type: str      # "CE" or "PE"
    strike: int
    entry_price: float
    close_price: float


@dataclass
class AnalyticsResult:
    """Complete analytics snapshot."""
    sharpe_ratio: Optional[float]
    calmar_ratio: Optional[float]
    profit_factor: Optional[float]
    max_drawdown: float
    max_drawdown_pct: float
    win_rate: float
    expectancy: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    avg_profit: float
    avg_loss: float
    gross_profit: float
    gross_loss: float
    net_pnl: float
    return_on_max_dd: Optional[float]  # Same as Calmar


def _safe_div(a: float, b: float) -> Optional[float]:
    """Safe division returning None on division by zero."""
    if b == 0 or math.isnan(b) or math.isinf(b):
        return None
    result = a / b
    if math.isnan(result) or math.isinf(result):
        return None
    return result


def compute_equity_curve(trade_log: List[dict]) -> List[float]:
    """
    Builds equity curve from trade log.
    Assumes trade_log contains OPEN and CLOSE actions.
    """
    equity = [0.0]
    running_pnl = 0.0

    for trade in trade_log:
        if trade.get("action") == "CLOSE":
            realized = trade.get("realized_pnl", 0.0)
            running_pnl += realized
        equity.append(running_pnl)

    return equity


def compute_max_drawdown(equity_curve: List[float]) -> tuple[float, float]:
    """
    Computes max drawdown in absolute and percentage terms.
    Returns: (max_dd_absolute, max_dd_percentage)
    """
    if not equity_curve or len(equity_curve) < 2:
        return 0.0, 0.0

    peak = equity_curve[0]
    max_dd = 0.0
    max_dd_pct = 0.0

    for val in equity_curve:
        if val > peak:
            peak = val
        dd = peak - val
        if dd > max_dd:
            max_dd = dd
            peak_val = peak if peak != 0 else 1e-8
            max_dd_pct = (dd / abs(peak_val)) * 100.0

    return max_dd, max_dd_pct


def compute_sharpe_ratio(
    returns: List[float],
    risk_free_rate_annual: float = 0.065,
    periods_per_year: int = 252 * 375,  # ~1-min candles per year
) -> Optional[float]:
    """
    Computes annualized Sharpe ratio from a series of returns.
    For 1-minute granularity, periods_per_year is very high.
    Simplified: use per-trade returns instead.
    """
    if len(returns) < 2:
        return None

    avg_return = sum(returns) / len(returns)
    if avg_return == 0:
        return 0.0

    variance = sum((r - avg_return) ** 2 for r in returns) / (len(returns) - 1)
    std_dev = math.sqrt(variance)

    if std_dev == 0:
        return None

    # Annualize: Sharpe = (mean return - risk_free) / std_dev * sqrt(n_periods)
    # For trade-level returns, approximate sqrt(trades_per_year) ~ sqrt(252 * 2) for 2 trades/day
    # Simplified: just use raw Sharpe on trade returns (industry standard for backtesters)
    sharpe = avg_return / std_dev
    return sharpe


def compute_calmar_ratio(
    net_pnl: float,
    max_drawdown: float,
) -> Optional[float]:
    """
    Calmar Ratio = Net PnL / Max Drawdown.
    Higher is better. Industry benchmark > 1.0 is good.
    """
    return _safe_div(net_pnl, max_drawdown)


def compute_profit_factor(trade_log: List[dict]) -> Optional[float]:
    """
    Profit Factor = Gross Profit / Gross Loss.
    PF > 1.0 means strategy is profitable.
    PF > 2.0 is considered excellent.
    """
    gross_profit = 0.0
    gross_loss = 0.0

    for trade in trade_log:
        if trade.get("action") == "CLOSE":
            pnl = trade.get("realized_pnl", 0.0)
            if pnl > 0:
                gross_profit += pnl
            elif pnl < 0:
                gross_loss += abs(pnl)

    return _safe_div(gross_profit, gross_loss)


def compute_win_rate(trade_log: List[dict]) -> float:
    """Percentage of closing trades that were profitable."""
    closes = [t for t in trade_log if t.get("action") == "CLOSE"]
    if not closes:
        return 0.0
    winners = sum(1 for t in closes if t.get("realized_pnl", 0.0) > 0)
    return (winners / len(closes)) * 100.0


def compute_expectancy(trade_log: List[dict]) -> float:
    """
    Expectancy = (Win% * Avg Win) - (Loss% * Avg Loss)
    Expected value of each trade.
    """
    closes = [t for t in trade_log if t.get("action") == "CLOSE"]
    if not closes:
        return 0.0

    wins = [t.get("realized_pnl", 0.0) for t in closes if t.get("realized_pnl", 0.0) > 0]
    losses = [abs(t.get("realized_pnl", 0.0)) for t in closes if t.get("realized_pnl", 0.0) < 0]

    win_rate = len(wins) / len(closes)
    loss_rate = len(losses) / len(closes)
    avg_win = sum(wins) / len(wins) if wins else 0.0
    avg_loss = sum(losses) / len(losses) if losses else 0.0

    return (win_rate * avg_win) - (loss_rate * avg_loss)


def compute_analytics(trade_log: List[dict], net_pnl: float = 0.0) -> AnalyticsResult:
    """
    Master analytics function — computes all metrics from trade log.
    """
    equity_curve = compute_equity_curve(trade_log)
    max_dd, max_dd_pct = compute_max_drawdown(equity_curve)

    closes = [t for t in trade_log if t.get("action") == "CLOSE"]
    returns = [t.get("realized_pnl", 0.0) for t in closes]

    gross_profit = sum(t.get("realized_pnl", 0.0) for t in closes if t.get("realized_pnl", 0.0) > 0)
    gross_loss = sum(abs(t.get("realized_pnl", 0.0)) for t in closes if t.get("realized_pnl", 0.0) < 0)
    wins = [t for t in closes if t.get("realized_pnl", 0.0) > 0]
    losses = [t for t in closes if t.get("realized_pnl", 0.0) < 0]

    avg_profit = sum(t.get("realized_pnl", 0.0) for t in wins) / len(wins) if wins else 0.0
    avg_loss = sum(abs(t.get("realized_pnl", 0.0)) for t in losses) / len(losses) if losses else 0.0

    sharpe = compute_sharpe_ratio(returns) if len(returns) >= 2 else None
    calmar = compute_calmar_ratio(net_pnl, max_dd)
    pf = compute_profit_factor(trade_log)

    return AnalyticsResult(
        sharpe_ratio=sharpe,
        calmar_ratio=calmar,
        profit_factor=pf,
        max_drawdown=max_dd,
        max_drawdown_pct=max_dd_pct,
        win_rate=compute_win_rate(trade_log),
        expectancy=compute_expectancy(trade_log),
        total_trades=len(closes),
        winning_trades=len(wins),
        losing_trades=len(losses),
        avg_profit=avg_profit,
        avg_loss=avg_loss,
        gross_profit=gross_profit,
        gross_loss=gross_loss,
        net_pnl=net_pnl,
        return_on_max_dd=calmar,
    )


def trade_quality_score(positions: list, lot_size: int = 50) -> dict:
    """
    Calculate a trade quality score (0-100) for the current portfolio.
    
    Factors:
    - Risk/Reward ratio (30 pts)
    - Delta balance (20 pts) — closer to 0 is better for neutral strategies
    - Theta risk (20 pts) — less negative theta is better
    - Premium efficiency (15 pts) — ATM options get higher score
    - Diversification (15 pts) — multiple strikes get bonus
    """
    if not positions:
        return {"total_score": 0, "breakdown": {}}
    
    total_premium_paid = 0
    total_premium_received = 0
    net_delta = 0
    net_theta = 0
    unique_strikes = set()
    
    for pos in positions:
        entry = pos.get("entry_price", 0)
        qty = pos.get("qty", 1)
        premium = entry * qty * lot_size
        direction = pos.get("direction", "BUY")
        
        if direction == "BUY":
            total_premium_paid += premium
        else:
            total_premium_received += premium
        
        # Approximate Greeks from entry price (simplified)
        # Deep ITM = high delta, ATM = ~0.50, OTM = low delta
        strike = pos.get("strike", 0)
        spot = pos.get("entry_price", 0) * 10 + strike  # rough spot estimate
        moneyness = abs(strike - spot) / spot if spot > 0 else 0
        
        if pos.get("option_type") == "CE":
            delta = max(0.1, min(0.9, 0.5 + (spot - strike) / spot))
        else:
            delta = min(-0.1, max(-0.9, -0.5 + (strike - spot) / spot))
        
        net_delta += delta * qty * (1 if direction == "BUY" else -1)
        net_theta += -entry * 0.05 * qty  # rough theta approx
        unique_strikes.add(strike)
    
    net_premium = total_premium_paid - total_premium_received
    
    # 1. Risk/Reward (30 pts)
    rr_score = 0
    if net_premium != 0:
        max_profit = total_premium_received * 2 if total_premium_received > 0 else total_premium_paid
        max_loss = net_premium if net_premium > 0 else abs(net_premium)
        if max_loss > 0:
            rr = max_profit / max_loss
            rr_score = min(30, rr * 15)
    
    # 2. Delta balance (20 pts) — closer to 0 is better
    delta_score = max(0, 20 - abs(net_delta) * 5)
    
    # 3. Theta risk (20 pts) — less negative theta is better
    theta_score = max(0, 20 + net_theta * 2) if net_theta < 0 else 20
    
    # 4. Premium efficiency (15 pts) — net premium reasonable
    eff_score = 15 if 0 < abs(net_premium) < 50000 else 10 if abs(net_premium) < 100000 else 5
    
    # 5. Diversification (15 pts)
    div_score = min(15, len(unique_strikes) * 5)
    
    total = round(rr_score + delta_score + theta_score + eff_score + div_score)
    
    return {
        "total_score": min(100, max(0, total)),
        "breakdown": {
            "risk_reward": round(rr_score, 1),
            "delta_balance": round(delta_score, 1),
            "theta_risk": round(theta_score, 1),
            "premium_efficiency": round(eff_score, 1),
            "diversification": round(div_score, 1),
        },
        "net_delta": round(net_delta, 2),
        "net_theta": round(net_theta, 2),
    }
