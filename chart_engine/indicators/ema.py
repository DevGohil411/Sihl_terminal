"""EMA — Exponential Moving Average"""
import pandas as pd
from .base import OverlayIndicator, SettingField

class EMAIndicator(OverlayIndicator):
    name       = "EMA"
    short_name = "EMA"
    description = "Exponential Moving Average — trend-following overlay"

    def schema(self):
        return [
            SettingField("length", "Length",  "int",    20,  min=1, max=500),
            SettingField("source", "Source",  "select", "close",
                         options=["open","high","low","close"]),
            SettingField("color",  "Color",   "color",  "#2196F3"),
            SettingField("width",  "Width",   "int",    2,   min=1, max=6),
        ]

    def calculate(self, df: pd.DataFrame) -> dict:
        src = self._source(df)
        length = int(self.settings["length"])
        ema = src.ewm(span=length, adjust=False).mean()
        return {
            "values": ema.round(2).tolist(),
            "color":  self.settings["color"],
            "width":  self.settings["width"],
            "label":  f"EMA {length}",
        }
