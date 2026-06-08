import polars as pl
from pathlib import Path
DATA_PATH = Path(r"d:\option simulator algotest\option data")
files = list(DATA_PATH.rglob("*.csv"))
for f in files[:20]:
    try:
        df = pl.read_csv(f, ignore_errors=True)
        res = df.filter(pl.col("Ticker").str.contains("-I.NFO|FUT.NFO"))
        if not res.is_empty():
            print(f"Found {len(res)} spot rows in {f}")
    except Exception as e:
        print(f"Error {f}: {e}")
