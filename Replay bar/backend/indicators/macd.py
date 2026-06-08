"""MACD — Moving Average Convergence/Divergence"""
import pandas as pd
from .base import PaneIndicator, SettingField

class MACDIndicator(PaneIndicator):
    name       = "MACD"
    short_name = "MACD"
    description = "MACD — trend momentum crossover system"

    def schema(self):
        return [
            SettingField("fast",         "Fast Length",    "int",   12,  min=1, max=200),
            SettingField("slow",         "Slow Length",    "int",   26,  min=1, max=500),
            SettingField("signal",       "Signal Length",  "int",   9,   min=1, max=100),
            SettingField("source",       "Source",         "select","close",
                         options=["open","high","low","close"]),
            SettingField("macd_color",   "MACD Color",     "color", "#2196F3"),
            SettingField("signal_color", "Signal Color",   "color", "#FF9800"),
            SettingField("bull_color",   "Hist Bull",      "color", "#26A69A"),
            SettingField("bear_color",   "Hist Bear",      "color", "#EF5350"),
        ]

    def calculate(self, df: pd.DataFrame) -> dict:
        src    = self._source(df)
        fast   = int(self.settings["fast"])
        slow   = int(self.settings["slow"])
        sig    = int(self.settings["signal"])
        ema_f  = src.ewm(span=fast, adjust=False).mean()
        ema_s  = src.ewm(span=slow, adjust=False).mean()
        macd   = (ema_f - ema_s).round(2)
        signal = macd.ewm(span=sig, adjust=False).mean().round(2)
        hist   = (macd - signal).round(2)
        return {
            "macd":         macd.tolist(),
            "signal":       signal.tolist(),
            "histogram":    hist.tolist(),
            "macd_color":   self.settings["macd_color"],
            "signal_color": self.settings["signal_color"],
            "bull_color":   self.settings["bull_color"],
            "bear_color":   self.settings["bear_color"],
            "label":        f"MACD ({fast},{slow},{sig})",
        }
