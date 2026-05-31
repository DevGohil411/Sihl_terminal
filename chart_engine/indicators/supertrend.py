"""SuperTrend — ATR-based trend-following overlay"""
import pandas as pd
import numpy as np
from .base import OverlayIndicator, SettingField

class SuperTrendIndicator(OverlayIndicator):
    name       = "SuperTrend"
    short_name = "ST"
    description = "SuperTrend — ATR-based dynamic trend channel"

    def schema(self):
        return [
            SettingField("atr_length",  "ATR Length", "int",   10,  min=1,  max=100),
            SettingField("multiplier",  "Multiplier", "float", 3.0, min=0.5, max=10.0),
            SettingField("bull_color",  "Bull Color", "color", "#26A69A"),
            SettingField("bear_color",  "Bear Color", "color", "#EF5350"),
            SettingField("width",       "Width",      "int",   2,   min=1,  max=6),
        ]

    def calculate(self, df: pd.DataFrame) -> dict:
        n   = int(self.settings["atr_length"])
        k   = float(self.settings["multiplier"])
        hl2 = (df["high"] + df["low"]) / 2

        # Wilder ATR
        tr  = pd.concat([
            df["high"] - df["low"],
            (df["high"] - df["close"].shift()).abs(),
            (df["low"]  - df["close"].shift()).abs(),
        ], axis=1).max(axis=1)
        atr = tr.ewm(span=n, adjust=False).mean()

        upper_band = hl2 + k * atr
        lower_band = hl2 - k * atr

        supertrend = [None] * len(df)
        direction  = [None] * len(df)

        prev_st  = None
        prev_dir = 1   # 1 = bullish, -1 = bearish

        for i in range(len(df)):
            if i == 0:
                supertrend[i] = upper_band.iloc[i]
                direction[i]  = -1
                prev_st  = upper_band.iloc[i]
                prev_dir = -1
                continue

            ub = upper_band.iloc[i]
            lb = lower_band.iloc[i]
            close = df["close"].iloc[i]

            # Adjust bands to not cross previous bands
            if lb < (prev_lb := lower_band.iloc[i - 1]) or df["close"].iloc[i - 1] < prev_lb:
                lb = lb
            else:
                lb = prev_lb

            if ub > (prev_ub := upper_band.iloc[i - 1]) or df["close"].iloc[i - 1] > prev_ub:
                ub = ub
            else:
                ub = prev_ub

            if prev_dir == -1:
                curr_st  = ub if close <= ub else lb
                curr_dir = -1 if close <= ub else 1
            else:
                curr_st  = lb if close >= lb else ub
                curr_dir = 1  if close >= lb else -1

            supertrend[i] = round(curr_st, 2)
            direction[i]  = curr_dir
            prev_st  = curr_st
            prev_dir = curr_dir

        return {
            "values":     supertrend,
            "direction":  direction,
            "bull_color": self.settings["bull_color"],
            "bear_color": self.settings["bear_color"],
            "width":      self.settings["width"],
            "label":      f"SuperTrend ({n},{k})",
        }
