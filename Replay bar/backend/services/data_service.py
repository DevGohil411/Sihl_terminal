import os
import pandas as pd
from typing import Dict
from data.loader import load_minute_data, resample_ohlc, TIMEFRAME_MAP

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CSV_PATH = os.environ.get("CSV_PATH", os.path.join(BASE_DIR, "Data", "NIFTY 50_minute.csv"))

class DataService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.initialize()
        return cls._instance

    def initialize(self):
        print("[DataService] Loading NIFTY 50 1-minute base data...")
        self.df_1m = load_minute_data(CSV_PATH)
        print(f"[DataService] {len(self.df_1m):,} candles loaded.")
        self.tf_cache: Dict[str, pd.DataFrame] = {}

    def get_timeframe(self, tf: str) -> pd.DataFrame:
        if tf not in TIMEFRAME_MAP:
            raise ValueError(f"Unknown timeframe: {tf}")
        if tf not in self.tf_cache:
            print(f"[DataService] Building Timeframe '{tf}'...")
            self.tf_cache[tf] = resample_ohlc(self.df_1m, tf)
            print(f"[DataService] Built '{tf}': {len(self.tf_cache[tf]):,} candles.")
        return self.tf_cache[tf]

# Singleton instance
data_service = DataService()
