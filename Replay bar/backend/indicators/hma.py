"""HMA — Hull Moving Average"""
import pandas as pd
import numpy as np
from .base import OverlayIndicator, SettingField

class HMAIndicator(OverlayIndicator):
    name       = "HMA"
    short_name = "HMA"
    description = "Hull Moving Average — fast, smooth, reduced lag"

    def schema(self):
        return [
            SettingField("length", "Length", "int",    20,  min=2, max=500),
            SettingField("source", "Source", "select", "close",
                         options=["open","high","low","close"]),
            SettingField("color",  "Color",  "color",  "#00BCD4"),
            SettingField("width",  "Width",  "int",    2,  min=1, max=6),
        ]

    @staticmethod
    def _wma(series: pd.Series, length: int) -> pd.Series:
        weights = np.arange(1, length + 1, dtype=float)
        return series.rolling(length).apply(
            lambda x: np.dot(x, weights) / weights.sum(), raw=True
        )

    def calculate(self, df: pd.DataFrame) -> dict:
        src = self._source(df)
        n   = int(self.settings["length"])
        half_wma = self._wma(src, max(1, n // 2))
        full_wma = self._wma(src, n)
        raw  = 2 * half_wma - full_wma
        hma  = self._wma(raw, max(1, int(np.sqrt(n))))
        return {
            "values": hma.round(2).tolist(),
            "color":  self.settings["color"],
            "width":  self.settings["width"],
            "label":  f"HMA {n}",
        }
