"""
chart_engine/indicators/__init__.py
All indicators auto-registered here.
"""
from .base import Indicator, OverlayIndicator, PaneIndicator
from .ema import EMAIndicator
from .sma import SMAIndicator
from .wma import WMAIndicator
from .hma import HMAIndicator
from .vwap import VWAPIndicator
from .supertrend import SuperTrendIndicator
from .rsi import RSIIndicator
from .macd import MACDIndicator
from .stochastic import StochasticIndicator
from .cci import CCIIndicator
from .atr import ATRIndicator
from .bollinger import BollingerBandsIndicator
from .keltner import KeltnerChannelsIndicator
from .obv import OBVIndicator
from .fvg import FVGIndicator
from .orderblocks import OrderBlocksIndicator
from .imbalance import ImbalanceZonesIndicator

# ── Registry: label → class ──────────────────────────────────────────────────
INDICATOR_REGISTRY = {
    "EMA":           EMAIndicator,
    "SMA":           SMAIndicator,
    "WMA":           WMAIndicator,
    "HMA":           HMAIndicator,
    "VWAP":          VWAPIndicator,
    "SuperTrend":    SuperTrendIndicator,
    "RSI":           RSIIndicator,
    "MACD":          MACDIndicator,
    "Stochastic":    StochasticIndicator,
    "CCI":           CCIIndicator,
    "ATR":           ATRIndicator,
    "Bollinger Bands": BollingerBandsIndicator,
    "Keltner Channels": KeltnerChannelsIndicator,
    "OBV":           OBVIndicator,
    "FVG":           FVGIndicator,
    "Order Blocks":  OrderBlocksIndicator,
    "Imbalance Zones": ImbalanceZonesIndicator,
}

__all__ = ["Indicator", "OverlayIndicator", "PaneIndicator", "INDICATOR_REGISTRY"]
