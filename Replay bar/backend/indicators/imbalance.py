"""Imbalance Zones — Volume Imbalance detector (original engine feature)"""
import pandas as pd
from .base import OverlayIndicator, SettingField

class ImbalanceZonesIndicator(OverlayIndicator):
    name       = "Imbalance Zones"
    short_name = "IMB"
    description = "Imbalance Zones — candle body overlap analysis for supply/demand"

    def schema(self):
        return [
            SettingField("bull_color", "Bull Zone",   "color", "rgba(76,175,80,0.18)"),
            SettingField("bear_color", "Bear Zone",   "color", "rgba(244,67,54,0.18)"),
            SettingField("min_size",   "Min Size %",  "float", 0.0, min=0.0, max=5.0),
        ]

    def calculate(self, df: pd.DataFrame) -> dict:
        zones = []
        min_size = float(self.settings["min_size"])
        n = len(df)

        for i in range(1, n):
            prev = df.iloc[i - 1]
            curr = df.iloc[i]

            # Bullish imbalance: current candle's low > previous candle's high
            if curr["low"] > prev["high"]:
                gap = (curr["low"] - prev["high"]) / prev["high"] * 100
                if gap >= min_size:
                    zones.append({
                        "type":   "bull",
                        "top":    round(float(curr["low"]),  2),
                        "bottom": round(float(prev["high"]), 2),
                        "start":  i - 1,
                        "label":  "Bull Imbalance",
                    })

            # Bearish imbalance: current candle's high < previous candle's low
            elif curr["high"] < prev["low"]:
                gap = (prev["low"] - curr["high"]) / prev["low"] * 100
                if gap >= min_size:
                    zones.append({
                        "type":   "bear",
                        "top":    round(float(prev["low"]),  2),
                        "bottom": round(float(curr["high"]), 2),
                        "start":  i - 1,
                        "label":  "Bear Imbalance",
                    })

        return {
            "zones":      zones,
            "bull_color": self.settings["bull_color"],
            "bear_color": self.settings["bear_color"],
            "label":      "Imbalance",
        }
