"""Bollinger Bands — volatility envelope around SMA"""
import pandas as pd
from .base import OverlayIndicator, SettingField

class BollingerBandsIndicator(OverlayIndicator):
    name       = "Bollinger Bands"
    short_name = "BB"
    description = "Bollinger Bands — SMA ± standard deviation envelope"

    def schema(self):
        return [
            SettingField("length",    "Length",    "int",   20,  min=1,   max=500),
            SettingField("mult",      "Multiplier","float", 2.0, min=0.1, max=10.0),
            SettingField("source",    "Source",    "select","close",
                         options=["open","high","low","close"]),
            SettingField("color",     "Mid Color", "color", "#9E9E9E"),
            SettingField("fill_color","Fill",      "color", "rgba(33,150,243,0.08)"),
            SettingField("band_color","Band Color","color", "#2196F3"),
            SettingField("width",     "Width",     "int",   1, min=1, max=6),
        ]

    def calculate(self, df: pd.DataFrame) -> dict:
        src    = self._source(df)
        n      = int(self.settings["length"])
        m      = float(self.settings["mult"])
        basis  = src.rolling(n).mean()
        std    = src.rolling(n).std()
        upper  = (basis + m * std).round(2)
        lower  = (basis - m * std).round(2)
        return {
            "basis":      basis.round(2).tolist(),
            "upper":      upper.tolist(),
            "lower":      lower.tolist(),
            "color":      self.settings["color"],
            "band_color": self.settings["band_color"],
            "fill_color": self.settings["fill_color"],
            "width":      self.settings["width"],
            "label":      f"BB ({n},{m})",
        }
