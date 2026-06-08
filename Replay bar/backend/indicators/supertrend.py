"""
SuperTrend — TradingView-parity implementation.

Pine Script reference:
  [supertrend, direction] = ta.supertrend(factor, atrPeriod)

Algorithm:
  1. ATR  = RMA(TR, atrPeriod)          # RMA = Wilder's (alpha=1/n)
  2. basic_upper = hl2 + factor * ATR
  3. basic_lower = hl2 - factor * ATR
  4. final_upper[i]:
       if basic_upper[i] < final_upper[i-1] or close[i-1] > final_upper[i-1]:
           final_upper[i] = basic_upper[i]
       else:
           final_upper[i] = final_upper[i-1]
  5. final_lower[i]:
       if basic_lower[i] > final_lower[i-1] or close[i-1] < final_lower[i-1]:
           final_lower[i] = basic_lower[i]
       else:
           final_lower[i] = final_lower[i-1]
  6. direction[i]:
       if supertrend[i-1] == final_upper[i-1]:
           direction[i] = 1  if close[i] > final_upper[i] else -1
       else:
           direction[i] = -1 if close[i] < final_lower[i] else  1
  7. supertrend[i] = final_lower[i] if direction[i] == 1 else final_upper[i]

direction convention: 1 = bullish (line below price), -1 = bearish (line above price)

NOTE: TradingView returns values from bar 0. There is NO warmup period.
The first bar uses tr[0] as the seed ATR and basic bands as seed final bands.
"""
import pandas as pd
import numpy as np
from .base import OverlayIndicator, SettingField


class SuperTrendIndicator(OverlayIndicator):
    name        = "SuperTrend"
    short_name  = "ST"
    description = "SuperTrend — TradingView-parity ATR trend indicator"

    def schema(self):
        return [
            SettingField("atr_length", "ATR Length", "int",   10,  min=1,   max=200),
            SettingField("multiplier", "Multiplier", "float", 3.0, min=0.1, max=20.0),
            SettingField("bull_color", "Bull Color", "color", "#22c55e"),
            SettingField("bear_color", "Bear Color", "color", "#ef4444"),
            SettingField("width",      "Width",      "int",   2,   min=1,   max=6),
            SettingField("show_markers", "Show Signals", "bool", True),
        ]

    def calculate(self, df: pd.DataFrame) -> dict:
        n = int(self.settings["atr_length"])
        k = float(self.settings["multiplier"])

        close = df["close"].values.astype(float)
        high  = df["high"].values.astype(float)
        low   = df["low"].values.astype(float)
        size  = len(df)

        # ── 1. True Range
        prev_close = np.empty(size)
        prev_close[0] = close[0]
        prev_close[1:] = close[:-1]

        tr = np.maximum(
            high - low,
            np.maximum(
                np.abs(high - prev_close),
                np.abs(low  - prev_close)
            )
        )

        # ── 2. ATR via Wilder's RMA  (alpha = 1/n)
        atr = np.empty(size)
        atr[0] = tr[0]
        alpha  = 1.0 / n
        for i in range(1, size):
            atr[i] = alpha * tr[i] + (1 - alpha) * atr[i - 1]

        # ── 3. hl2
        hl2 = (high + low) / 2.0

        # ── 4. Basic bands
        basic_upper = hl2 + k * atr
        basic_lower = hl2 - k * atr

        # ── 5. Final bands  (state-machine, exact TradingView logic)
        final_upper = np.empty(size)
        final_lower = np.empty(size)
        final_upper[0] = basic_upper[0]
        final_lower[0] = basic_lower[0]

        for i in range(1, size):
            # Final Upper: tighten only when price was NOT above previous upper
            if basic_upper[i] < final_upper[i - 1] or close[i - 1] > final_upper[i - 1]:
                final_upper[i] = basic_upper[i]
            else:
                final_upper[i] = final_upper[i - 1]

            # Final Lower: tighten only when price was NOT below previous lower
            if basic_lower[i] > final_lower[i - 1] or close[i - 1] < final_lower[i - 1]:
                final_lower[i] = basic_lower[i]
            else:
                final_lower[i] = final_lower[i - 1]

        # ── 6. Direction & SuperTrend value (exact TradingView flip logic)
        supertrend = np.empty(size)
        direction  = np.empty(size, dtype=int)

        # First bar: default bearish (ST starts above price) — same as TradingView
        supertrend[0] = final_upper[0]
        direction[0]  = -1

        for i in range(1, size):
            prev_st = supertrend[i - 1]

            if prev_st == final_upper[i - 1]:
                # Previously bearish
                if close[i] > final_upper[i]:
                    direction[i]  = 1          # flip to bullish
                    supertrend[i] = final_lower[i]
                else:
                    direction[i]  = -1
                    supertrend[i] = final_upper[i]
            else:
                # Previously bullish
                if close[i] < final_lower[i]:
                    direction[i]  = -1         # flip to bearish
                    supertrend[i] = final_upper[i]
                else:
                    direction[i]  = 1
                    supertrend[i] = final_lower[i]

        # ── 7. Build output lists — NO WARMUP, values from bar 0 like TradingView
        st_list    = [round(float(v), 2) for v in supertrend]
        dir_list   = [int(v) for v in direction]
        hl2_list   = [round(float(v), 2) for v in hl2]
        atr_list   = [round(float(v), 2) for v in atr]
        fub_list   = [round(float(v), 2) for v in final_upper]
        flb_list   = [round(float(v), 2) for v in final_lower]
        bub_list   = [round(float(v), 2) for v in basic_upper]
        blb_list   = [round(float(v), 2) for v in basic_lower]

        return {
            "values":     st_list,
            "direction":  dir_list,
            "hl2":        hl2_list,
            "atr":        atr_list,
            "final_upper": fub_list,
            "final_lower": flb_list,
            "basic_upper": bub_list,
            "basic_lower": blb_list,
            "bull_color": self.settings["bull_color"],
            "bear_color": self.settings["bear_color"],
            "width":      self.settings["width"],
            "show_markers": self.settings.get("show_markers", True),
            "label":      f"SuperTrend ({n},{k})",
        }
