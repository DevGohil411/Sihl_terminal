"""ATR — Average True Range (Wilder's RMA, TradingView-compatible)"""
import pandas as pd
import numpy as np
from .base import PaneIndicator, SettingField

class ATRIndicator(PaneIndicator):
    name       = "ATR"
    short_name = "ATR"
    description = "Average True Range — volatility measurement (Wilder's RMA)"

    def schema(self):
        return [
            SettingField("length", "Length", "int",   14, min=1, max=200),
            SettingField("color",  "Color",  "color", "#FF5722"),
        ]

    def calculate(self, df: pd.DataFrame) -> dict:
        n  = int(self.settings["length"])
        close = df["close"].values.astype(float)
        high  = df["high"].values.astype(float)
        low   = df["low"].values.astype(float)
        size  = len(df)

        # True Range
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

        # Wilder's RMA (alpha = 1/n) — TradingView-compatible
        atr = np.empty(size)
        atr[0] = tr[0]
        alpha = 1.0 / n
        for i in range(1, size):
            atr[i] = alpha * tr[i] + (1 - alpha) * atr[i - 1]

        return {
            "values": [round(float(v), 2) for v in atr],
            "color":  self.settings["color"],
            "label":  f"ATR {n}",
        }
