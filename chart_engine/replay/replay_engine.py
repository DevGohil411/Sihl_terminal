"""
chart_engine/replay/replay_engine.py
─────────────────────────────────────────────────────────────────────────────
Server-side replay state tracker.

The ORIGINAL JavaScript replay logic from Replay_bar.py is preserved 1:1.
This module mirrors its "no-lookahead" guarantee on the Python/API side:
any data slice returned is strictly df.iloc[:replay_index+1].

The JS frontend recreates the exact same calculateTraces() logic from
Replay_bar.py, so the imbalance zone growth, mitigation locking, and
first-touch detection are pixel-for-pixel identical.
─────────────────────────────────────────────────────────────────────────────
"""
from __future__ import annotations
import pandas as pd


class ReplayEngine:
    """
    Manages replay cursor state and enforces no-lookahead slicing.

    This is a thin wrapper — all the heavy simulation logic runs in the
    browser (JavaScript), exactly as it did in Replay_bar.py.
    """

    def __init__(self, df: pd.DataFrame):
        self._df   = df.reset_index(drop=True)
        self._total = len(df)
        self._index = min(40, self._total - 1)   # same default as original

    # ── Properties ────────────────────────────────────────────────────────────

    @property
    def index(self) -> int:
        return self._index

    @property
    def total(self) -> int:
        return self._total

    # ── Navigation ────────────────────────────────────────────────────────────

    def step_forward(self) -> bool:
        """Advance one bar. Returns False if already at end."""
        if self._index < self._total - 1:
            self._index += 1
            return True
        return False

    def step_back(self) -> bool:
        """Go back one bar. Returns False if already at start."""
        if self._index > 0:
            self._index -= 1
            return True
        return False

    def reset(self):
        self._index = min(40, self._total - 1)

    def scrub_to(self, idx: int):
        """Jump cursor to arbitrary index (clamped to valid range)."""
        self._index = max(0, min(idx, self._total - 1))

    # ── Data access (NO LOOKAHEAD) ─────────────────────────────────────────

    def visible_slice(self) -> pd.DataFrame:
        """
        Returns ONLY the bars up to and including the current replay index.
        This is the SAME guarantee as allCandles.slice(0, currentIndex+1)
        in the original Replay_bar.py JavaScript.
        """
        return self._df.iloc[: self._index + 1].copy()

    def current_bar(self) -> dict:
        row = self._df.iloc[self._index]
        return {
            "datetime": str(row["datetime_str"]),
            "open":     float(row["open"]),
            "high":     float(row["high"]),
            "low":      float(row["low"]),
            "close":    float(row["close"]),
            "volume":   float(row.get("volume", 0)),
            "index":    int(self._index),
            "total":    int(self._total),
        }

    def status_text(self) -> str:
        bar = self.current_bar()
        return (f"📅 {bar['datetime'][:10]}  "
                f"⏰ {bar['datetime'][11:]}  "
                f"#{self._index + 1} of {self._total}")
