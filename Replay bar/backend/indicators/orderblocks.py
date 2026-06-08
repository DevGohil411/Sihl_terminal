"""Order Blocks — Smart Money institutional entry zones"""
import pandas as pd
from .base import OverlayIndicator, SettingField

class OrderBlocksIndicator(OverlayIndicator):
    name       = "Order Blocks"
    short_name = "OB"
    description = "Order Blocks — last opposing candle before strong displacement"

    def schema(self):
        return [
            SettingField("swing_length", "Swing Length", "int",   5,    min=2,  max=50),
            SettingField("bull_color",   "Bull OB",      "color", "rgba(38,166,154,0.3)"),
            SettingField("bear_color",   "Bear OB",      "color", "rgba(239,83,80,0.3)"),
            SettingField("max_blocks",   "Max Blocks",   "int",   10,   min=1,  max=50),
        ]

    def calculate(self, df: pd.DataFrame) -> dict:
        n     = int(self.settings["swing_length"])
        maxb  = int(self.settings["max_blocks"])
        blocks = []

        highs  = df["high"].values
        lows   = df["low"].values
        closes = df["close"].values
        opens  = df["open"].values
        m = len(df)

        for i in range(n, m - n):
            # Swing High detection
            if highs[i] == max(highs[i - n: i + n + 1]):
                # Find last bullish candle before this high
                for j in range(i - 1, max(0, i - 15), -1):
                    if closes[j] > opens[j]:
                        blocks.append({
                            "type":   "bear",
                            "top":    round(float(highs[j]),  2),
                            "bottom": round(float(lows[j]),   2),
                            "start":  j,
                            "label":  f"Bear OB",
                        })
                        break

            # Swing Low detection
            if lows[i] == min(lows[i - n: i + n + 1]):
                # Find last bearish candle before this low
                for j in range(i - 1, max(0, i - 15), -1):
                    if closes[j] < opens[j]:
                        blocks.append({
                            "type":   "bull",
                            "top":    round(float(highs[j]),  2),
                            "bottom": round(float(lows[j]),   2),
                            "start":  j,
                            "label":  f"Bull OB",
                        })
                        break

        # Keep the N most recent blocks
        blocks = blocks[-maxb:]

        return {
            "zones":      blocks,
            "bull_color": self.settings["bull_color"],
            "bear_color": self.settings["bear_color"],
            "label":      "OB",
        }
