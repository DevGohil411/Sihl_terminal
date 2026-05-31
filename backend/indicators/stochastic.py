"""Stochastic Oscillator — %K and %D lines"""
import pandas as pd
from .base import PaneIndicator, SettingField

class StochasticIndicator(PaneIndicator):
    name       = "Stochastic"
    short_name = "Stoch"
    description = "Stochastic Oscillator — momentum %K and %D"

    def schema(self):
        return [
            SettingField("k_length",  "%K Length",   "int",   14, min=1, max=200),
            SettingField("d_smooth",  "%D Smooth",   "int",   3,  min=1, max=50),
            SettingField("upper",     "Overbought",  "int",   80, min=50, max=100),
            SettingField("lower",     "Oversold",    "int",   20, min=0,  max=50),
            SettingField("k_color",   "%K Color",    "color", "#2196F3"),
            SettingField("d_color",   "%D Color",    "color", "#FF9800"),
        ]

    def calculate(self, df: pd.DataFrame) -> dict:
        k = int(self.settings["k_length"])
        d = int(self.settings["d_smooth"])
        low_k  = df["low"].rolling(k).min()
        high_k = df["high"].rolling(k).max()
        pct_k  = (100 * (df["close"] - low_k) / (high_k - low_k).replace(0, 1)).round(2)
        pct_d  = pct_k.rolling(d).mean().round(2)
        return {
            "k":       pct_k.tolist(),
            "d":       pct_d.tolist(),
            "upper":   int(self.settings["upper"]),
            "lower":   int(self.settings["lower"]),
            "k_color": self.settings["k_color"],
            "d_color": self.settings["d_color"],
            "label":   f"Stoch ({k},{d})",
            "y_min":   0,
            "y_max":   100,
        }
