"""
chart_engine/indicators/base.py
─────────────────────────────────────────────────────────────────────────────
Abstract Indicator Framework
Every indicator in the library inherits from Indicator.
Two concrete base classes:
  • OverlayIndicator  — drawn on the main price chart
  • PaneIndicator     — rendered in a separate sub-panel below the chart

The calculate() method receives a pandas DataFrame (OHLCV + datetime) and
returns a dict of series/scalars that the JS renderer consumes.

The schema() method returns the user-editable settings definition consumed
by the Settings Popup in the UI.
─────────────────────────────────────────────────────────────────────────────
"""
from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any
import pandas as pd


@dataclass
class SettingField:
    """Describes a single editable parameter in the Settings Popup."""
    key:      str              # parameter key name
    label:    str              # human-readable label
    type:     str              # "int" | "float" | "color" | "select" | "bool"
    default:  Any             # default value
    options:  list = field(default_factory=list)  # for "select" type
    min:      Any = None
    max:      Any = None


class Indicator(ABC):
    """
    Abstract base for all indicators.

    Attributes
    ----------
    name        : Display name shown in the library and legend
    short_name  : Short code used in legend (e.g. "EMA 20")
    description : One-line description for the search popup
    settings    : Dict of current parameter values
    """

    name:        str = "Unnamed Indicator"
    short_name:  str = "IND"
    description: str = ""

    def __init__(self, **kwargs):
        # Merge schema defaults with any user-supplied overrides
        defaults = {f.key: f.default for f in self.schema()}
        defaults.update(kwargs)
        self.settings: dict[str, Any] = defaults

    # ── Must implement ────────────────────────────────────────────────────────

    @abstractmethod
    def schema(self) -> list[SettingField]:
        """Return the list of editable settings fields."""
        ...

    @abstractmethod
    def calculate(self, df: pd.DataFrame) -> dict[str, Any]:
        """
        Compute indicator values from OHLCV DataFrame.

        Parameters
        ----------
        df : DataFrame with columns [datetime, open, high, low, close, volume]
             Already sliced to replay boundary (no lookahead).

        Returns
        -------
        dict whose keys/structure depends on indicator type.
        The JS renderer reads these keys by name.
        """
        ...

    # ── Optional helpers ──────────────────────────────────────────────────────

    def to_json_payload(self, df: pd.DataFrame) -> dict:
        """
        Full serialisable payload sent to the front-end.
        Wraps calculate() output with metadata.
        """
        data = self.calculate(df)
        return {
            "indicator": self.name,
            "short_name": self.short_name,
            "type": self.__class__.__bases__[0].__name__,   # OverlayIndicator | PaneIndicator
            "settings": self.settings,
            "data": data,
        }

    # ── Safe source series retrieval ──────────────────────────────────────────
    def _source(self, df: pd.DataFrame) -> pd.Series:
        src = self.settings.get("source", "close")
        if src not in df.columns:
            src = "close"
        return df[src].copy()


class OverlayIndicator(Indicator, ABC):
    """
    Indicator that overlays on the main price panel.
    Examples: EMA, VWAP, SuperTrend, Bollinger Bands
    """
    overlay = True
    pane    = False


class PaneIndicator(Indicator, ABC):
    """
    Indicator that lives in its own sub-panel beneath the chart.
    Examples: RSI, MACD, Stochastic, OBV
    """
    overlay = False
    pane    = True
