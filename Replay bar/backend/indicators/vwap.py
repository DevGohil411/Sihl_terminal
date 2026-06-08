"""VWAP — Volume Weighted Average Price (session-anchored)"""
import pandas as pd
from .base import OverlayIndicator, SettingField

class VWAPIndicator(OverlayIndicator):
    name       = "VWAP"
    short_name = "VWAP"
    description = "Volume Weighted Average Price — session-anchored institutional reference"

    def schema(self):
        return [
            SettingField("color",        "Color",        "color", "#FFEB3B"),
            SettingField("width",        "Width",        "int",   2, min=1, max=6),
            SettingField("show_bands",   "Show Bands",   "bool",  True),
            SettingField("band_mult",    "Band Mult",    "float", 1.0, min=0.1, max=5.0),
            SettingField("band_color",   "Band Color",   "color", "rgba(255,235,59,0.2)"),
        ]

    def calculate(self, df: pd.DataFrame) -> dict:
        tp = (df["high"] + df["low"] + df["close"]) / 3
        vol = df["volume"].replace(0, 1)  # avoid div-by-zero on zero-volume data

        # Reset at each new trading day
        df2 = df.copy()
        df2["_date"] = df2["datetime"].dt.date
        df2["_tp"]   = tp
        df2["_vol"]  = vol

        cumvol = df2.groupby("_date")["_vol"].cumsum()
        cumtpv = df2.groupby("_date").apply(
            lambda g: (g["_tp"] * g["_vol"]).cumsum()
        ).reset_index(level=0, drop=True)

        vwap = (cumtpv / cumvol).round(2)

        # Upper / lower bands (1 std-dev of TP from VWAP per session)
        df2["_dev2"] = (tp - vwap) ** 2 * vol
        cum_dev2 = df2.groupby("_date")["_dev2"].cumsum()
        std = (cum_dev2 / cumvol).pow(0.5)
        mult = float(self.settings["band_mult"])
        upper = (vwap + mult * std).round(2)
        lower = (vwap - mult * std).round(2)

        return {
            "values": vwap.tolist(),
            "upper":  upper.tolist() if self.settings["show_bands"] else [],
            "lower":  lower.tolist() if self.settings["show_bands"] else [],
            "color":  self.settings["color"],
            "width":  self.settings["width"],
            "band_color": self.settings["band_color"],
            "label":  "VWAP",
        }
