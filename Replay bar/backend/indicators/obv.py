"""OBV — On Balance Volume"""
import pandas as pd
from .base import PaneIndicator, SettingField

class OBVIndicator(PaneIndicator):
    name       = "OBV"
    short_name = "OBV"
    description = "On Balance Volume — cumulative volume trend indicator"

    def schema(self):
        return [
            SettingField("color", "Color", "color", "#00BCD4"),
            SettingField("width", "Width", "int",   2, min=1, max=6),
        ]

    def calculate(self, df: pd.DataFrame) -> dict:
        direction = df["close"].diff().apply(lambda x: 1 if x > 0 else (-1 if x < 0 else 0))
        obv = (direction * df["volume"]).fillna(0).cumsum().round(0)
        return {
            "values": obv.tolist(),
            "color":  self.settings["color"],
            "width":  self.settings["width"],
            "label":  "OBV",
        }
