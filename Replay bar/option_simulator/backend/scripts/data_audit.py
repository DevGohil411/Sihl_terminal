import duckdb
import glob
import time
from pathlib import Path

DATA_PATH = r"d:\option simulator algotest\option data\**\*.csv"

def run_audit():
    print("Starting data audit using DuckDB...")
    start_time = time.time()
    
    con = duckdb.connect()
    
    # We use ignore_errors=True in case some files have malformed lines, though ideally we shouldn't need it.
    print(f"Reading CSVs from {DATA_PATH}...")
    
    # Create a view to query easily
    con.execute(f"CREATE VIEW raw_data AS SELECT * FROM read_csv_auto('{DATA_PATH}', union_by_name=True)")
    
    # 1. Total Rows
    total_rows = con.execute("SELECT COUNT(*) FROM raw_data").fetchone()[0]
    print(f"Total Rows: {total_rows}")
    
    # 2. Date Range
    dates = con.execute("SELECT MIN(Date), MAX(Date) FROM raw_data").fetchone()
    print(f"Date Range: {dates[0]} to {dates[1]}")
    
    # 3. Available Symbols
    # The 'Ticker' column usually contains the symbol, expiry, etc. E.g., NIFTY24APR22000CE.NFO
    # We can extract the underlying symbol using regex or substring. 
    # Let's just look at a few examples first to write the correct regex.
    sample_tickers = con.execute("SELECT Ticker FROM raw_data LIMIT 10").fetchall()
    print("Sample Tickers:", [t[0] for t in sample_tickers])
    
    print(f"Audit step 1 completed in {time.time() - start_time:.2f} seconds.")

if __name__ == "__main__":
    run_audit()
