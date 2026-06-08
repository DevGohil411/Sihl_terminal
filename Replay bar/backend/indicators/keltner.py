"""Keltner Channels — EMA ± ATR envelope"""
import pandas as pd
from .base import OverlayIndicator, SettingField

class KeltnerChannelsIndicator(OverlayIndicator):
    name       = "Keltner Channels"
    short_name = "KC"
    description = "Keltner Channels — EMA centre ± ATR-based envelope"

    def schema(self):
        return [
            SettingField("ema_length", "EMA Length",  "int",   20,  min=1,  max=500),
            SettingField("atr_length", "ATR Length",  "int",   10,  min=1,  max=200),
            SettingField("mult",       "Multiplier",  "float", 1.5, min=0.1,max=10.0),
            SettingField("color",      "Center Color","color", "#FF9800"),
            SettingField("band_color", "Band Color",  "color", "rgba(255,152,0,0.2)"),
            SettingField("width",      "Width",       "int",   1, min=1, max=6),
        ]

    def calculate(self, df: pd.DataFrame) -> dict:
        n   = int(self.settings["ema_length"])
        an  = int(self.settings["atr_length"])
        m   = float(self.settings["mult"])
        ema = df["close"].ewm(span=n, adjust=False).mean()
        tr  = pd.concat([
            df["high"] - df["low"],
            (df["high"] - df["close"].shift()).abs(),
            (df["low"]  - df["close"].shift()).abs(),
        ], axis=1).max(axis=1)
        atr    = tr.ewm(span=an, adjust=False).mean()
        upper  = (ema + m * atr).round(2)
        lower  = (ema - m * atr).round(2)
        return {
            "basis":      ema.round(2).tolist(),
            "upper":      upper.tolist(),
            "lower":      lower.tolist(),
            "color":      self.settings["color"],
            "band_color": self.settings["band_color"],
            "width":      self.settings["width"],
            "label":      f"KC ({n},{an},{m})",
        }
