"""CCI — Commodity Channel Index"""
import pandas as pd
from .base import PaneIndicator, SettingField

class CCIIndicator(PaneIndicator):
    name       = "CCI"
    short_name = "CCI"
    description = "Commodity Channel Index — deviation from average price"

    def schema(self):
        return [
            SettingField("length", "Length",     "int",   20,  min=1, max=200),
            SettingField("upper",  "Overbought", "int",   100, min=0, max=500),
            SettingField("lower",  "Oversold",   "int",   -100,min=-500,max=0),
            SettingField("color",  "Color",      "color", "#E91E63"),
        ]

    def calculate(self, df: pd.DataFrame) -> dict:
        n  = int(self.settings["length"])
        tp = (df["high"] + df["low"] + df["close"]) / 3
        ma = tp.rolling(n).mean()
        md = tp.rolling(n).apply(lambda x: abs(x - x.mean()).mean(), raw=True)
        cci = ((tp - ma) / (0.015 * md.replace(0, 1))).round(2)
        return {
            "values": cci.tolist(),
            "upper":  int(self.settings["upper"]),
            "lower":  int(self.settings["lower"]),
            "color":  self.settings["color"],
            "label":  f"CCI {n}",
        }
