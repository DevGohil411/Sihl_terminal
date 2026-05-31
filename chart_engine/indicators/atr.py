"""ATR — Average True Range"""
import pandas as pd
from .base import PaneIndicator, SettingField

class ATRIndicator(PaneIndicator):
    name       = "ATR"
    short_name = "ATR"
    description = "Average True Range — volatility measurement"

    def schema(self):
        return [
            SettingField("length", "Length", "int",   14, min=1, max=200),
            SettingField("color",  "Color",  "color", "#FF5722"),
        ]

    def calculate(self, df: pd.DataFrame) -> dict:
        n  = int(self.settings["length"])
        tr = pd.concat([
            df["high"] - df["low"],
            (df["high"] - df["close"].shift()).abs(),
            (df["low"]  - df["close"].shift()).abs(),
        ], axis=1).max(axis=1)
        atr = tr.ewm(span=n, adjust=False).mean().round(2)
        return {
            "values": atr.tolist(),
            "color":  self.settings["color"],
            "label":  f"ATR {n}",
        }
