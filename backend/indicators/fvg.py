"""FVG — Fair Value Gaps (Smart Money Concept)"""
import pandas as pd
from .base import OverlayIndicator, SettingField

class FVGIndicator(OverlayIndicator):
    name       = "FVG"
    short_name = "FVG"
    description = "Fair Value Gaps — 3-candle imbalance zones (Smart Money)"

    def schema(self):
        return [
            SettingField("bull_color", "Bull FVG",  "color", "rgba(38,166,154,0.25)"),
            SettingField("bear_color", "Bear FVG",  "color", "rgba(239,83,80,0.25)"),
            SettingField("min_size",   "Min Gap %", "float", 0.0, min=0.0, max=5.0),
        ]

    def calculate(self, df: pd.DataFrame) -> dict:
        fvgs = []
        min_size = float(self.settings["min_size"])
        n = len(df)
        for i in range(1, n - 1):
            prev = df.iloc[i - 1]
            curr = df.iloc[i]
            nxt  = df.iloc[i + 1]

            # Bullish FVG: candle[i-1].high < candle[i+1].low
            if prev["high"] < nxt["low"]:
                gap_size = (nxt["low"] - prev["high"]) / prev["high"] * 100
                if gap_size >= min_size:
                    fvgs.append({
                        "type":   "bull",
                        "top":    round(float(nxt["low"]), 2),
                        "bottom": round(float(prev["high"]), 2),
                        "start":  i - 1,
                        "label":  f"Bull FVG @ {curr['datetime_str'][:10]}",
                    })

            # Bearish FVG: candle[i-1].low > candle[i+1].high
            elif prev["low"] > nxt["high"]:
                gap_size = (prev["low"] - nxt["high"]) / prev["low"] * 100
                if gap_size >= min_size:
                    fvgs.append({
                        "type":   "bear",
                        "top":    round(float(prev["low"]), 2),
                        "bottom": round(float(nxt["high"]), 2),
                        "start":  i - 1,
                        "label":  f"Bear FVG @ {curr['datetime_str'][:10]}",
                    })

        return {
            "zones":      fvgs,
            "bull_color": self.settings["bull_color"],
            "bear_color": self.settings["bear_color"],
            "label":      "FVG",
        }
