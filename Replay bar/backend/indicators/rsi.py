"""RSI — Relative Strength Index"""
import pandas as pd
import numpy as np
from .base import PaneIndicator, SettingField

class RSIIndicator(PaneIndicator):
    name       = "RSI"
    short_name = "RSI"
    description = "Relative Strength Index — momentum oscillator 0-100"

    def schema(self):
        return [
            SettingField("length",     "Length",          "int",   14,  min=1,  max=200),
            SettingField("source",     "Source",          "select","close",
                         options=["open","high","low","close"]),
            SettingField("upper",      "Overbought",      "int",   70,  min=50, max=100),
            SettingField("lower",      "Oversold",        "int",   30,  min=0,  max=50),
            SettingField("color",      "Line Color",      "color", "#9C27B0"),
            SettingField("ob_color",   "OB Fill",         "color", "rgba(244,67,54,0.15)"),
            SettingField("os_color",   "OS Fill",         "color", "rgba(76,175,80,0.15)"),
        ]

    def calculate(self, df: pd.DataFrame) -> dict:
        src    = self._source(df)
        length = int(self.settings["length"])
        delta  = src.diff()
        gain   = delta.clip(lower=0)
        loss   = (-delta).clip(lower=0)
        avg_gain = gain.ewm(alpha=1/length, adjust=False).mean()
        avg_loss = loss.ewm(alpha=1/length, adjust=False).mean()
        rs  = avg_gain / avg_loss.replace(0, np.nan)
        rsi = 100 - (100 / (1 + rs))
        rsi = rsi.replace([np.inf, -np.inf], 100).round(2)
        rsi_list = [x if pd.notnull(x) else None for x in rsi]

        return {
            "values": rsi_list,
            "upper":  int(self.settings["upper"]),
            "lower":  int(self.settings["lower"]),
            "color":  self.settings["color"],
            "ob_color": self.settings["ob_color"],
            "os_color": self.settings["os_color"],
            "label":  f"RSI {length}",
            "y_min":  0,
            "y_max":  100,
        }
