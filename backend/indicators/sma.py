"""SMA — Simple Moving Average"""
import pandas as pd
from .base import OverlayIndicator, SettingField

class SMAIndicator(OverlayIndicator):
    name       = "SMA"
    short_name = "SMA"
    description = "Simple Moving Average — equal-weight trend line"

    def schema(self):
        return [
            SettingField("length", "Length", "int",    20,  min=1, max=500),
            SettingField("source", "Source", "select", "close",
                         options=["open","high","low","close"]),
            SettingField("color",  "Color",  "color",  "#FF9800"),
            SettingField("width",  "Width",  "int",    2,  min=1, max=6),
        ]

    def calculate(self, df: pd.DataFrame) -> dict:
        src = self._source(df)
        length = int(self.settings["length"])
        sma = src.rolling(length).mean()
        return {
            "values": sma.round(2).tolist(),
            "color":  self.settings["color"],
            "width":  self.settings["width"],
            "label":  f"SMA {length}",
        }
