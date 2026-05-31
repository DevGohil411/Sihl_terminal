"""WMA — Weighted Moving Average"""
import pandas as pd
import numpy as np
from .base import OverlayIndicator, SettingField

class WMAIndicator(OverlayIndicator):
    name       = "WMA"
    short_name = "WMA"
    description = "Weighted Moving Average — linearly weighted trend line"

    def schema(self):
        return [
            SettingField("length", "Length", "int",    20,  min=1, max=500),
            SettingField("source", "Source", "select", "close",
                         options=["open","high","low","close"]),
            SettingField("color",  "Color",  "color",  "#9C27B0"),
            SettingField("width",  "Width",  "int",    2,  min=1, max=6),
        ]

    def calculate(self, df: pd.DataFrame) -> dict:
        src = self._source(df).values
        length = int(self.settings["length"])
        weights = np.arange(1, length + 1)
        out = [None] * len(src)
        for i in range(length - 1, len(src)):
            window = src[i - length + 1: i + 1]
            if not np.isnan(window).any():
                out[i] = round(float(np.dot(weights, window) / weights.sum()), 2)
        return {
            "values": out,
            "color":  self.settings["color"],
            "width":  self.settings["width"],
            "label":  f"WMA {length}",
        }
