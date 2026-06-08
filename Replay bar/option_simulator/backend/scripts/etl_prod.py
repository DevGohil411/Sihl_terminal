import duckdb
import time
from pathlib import Path

# Paths
DB_PATH = Path(r"d:\option simulator algotest\simulator\data\options_v3.duckdb")
DATA_PATH = r"d:\option simulator algotest\option data\**\*.csv"

def run_etl():
    print("[*] Starting Production ETL Pipeline...")
    start_time = time.time()
    
    # 1. Connect to DuckDB and set pragmas
    # We remove the existing DB and create a fresh one
    if DB_PATH.exists():
        DB_PATH.unlink()
        
    con = duckdb.connect(str(DB_PATH))
    con.execute("PRAGMA threads=8;")
    con.execute("PRAGMA memory_limit='8GB';")
    
    print("[*] Creating unified view of 165M rows...")
    con.execute(f"CREATE VIEW raw_data AS SELECT * FROM read_csv_auto('{DATA_PATH}', union_by_name=True, header=True)")
    
    print("[*] Building 'historical_options' table (Parsing Tickers)...")
    con.execute("""
        CREATE TABLE historical_options AS 
        WITH raw_fixed AS (
            SELECT 
                Ticker, Date, Time, Open, High, Low, Close, Volume, "Open Interest",
                replace(CAST(Date AS VARCHAR), '/', '-') || ' ' || lpad(CAST(Time AS VARCHAR), 8, '0') AS ts_str
            FROM raw_data
            WHERE Ticker LIKE '%CE.NFO' OR Ticker LIKE '%PE.NFO'
        ),
        parsed AS (
            SELECT 
                regexp_extract(Ticker, '^([A-Z]+)(\d{2}[A-Z]{3}\d{2})(\d+)(CE|PE)\.NFO$', 1) AS underlying,
                strptime(regexp_extract(Ticker, '^([A-Z]+)(\d{2}[A-Z]{3}\d{2})(\d+)(CE|PE)\.NFO$', 2), '%d%b%y')::DATE AS expiry,
                regexp_extract(Ticker, '^([A-Z]+)(\d{2}[A-Z]{3}\d{2})(\d+)(CE|PE)\.NFO$', 3)::INTEGER AS strike,
                regexp_extract(Ticker, '^([A-Z]+)(\d{2}[A-Z]{3}\d{2})(\d+)(CE|PE)\.NFO$', 4) AS option_type,
                Ticker,
                COALESCE(
                    try_strptime(ts_str, '%d-%m-%Y %H:%M:%S'),
                    try_strptime(ts_str, '%m-%d-%Y %H:%M:%S'),
                    try_strptime(ts_str, '%Y-%m-%d %H:%M:%S')
                ) AS timestamp,
                Open::FLOAT as open,
                High::FLOAT as high,
                Low::FLOAT as low,
                Close::FLOAT as close,
                Volume::INTEGER as volume,
                COALESCE("Open Interest", 0)::INTEGER as open_interest
            FROM raw_fixed
        )
        SELECT * FROM parsed WHERE underlying IS NOT NULL;
    """)
    print("[+] historical_options table created.")
    
    print("[*] Building 'historical_spot' table (Continuous Futures & Spot)...")
    con.execute("""
        CREATE TABLE historical_spot AS 
        WITH raw_fixed AS (
            SELECT 
                Ticker, Date, Time, Open, High, Low, Close, Volume,
                replace(CAST(Date AS VARCHAR), '/', '-') || ' ' || lpad(CAST(Time AS VARCHAR), 8, '0') AS ts_str
            FROM raw_data
            WHERE Ticker LIKE '%-I.NFO' OR Ticker LIKE '%FUT.NFO'
        )
        SELECT 
            CASE 
                WHEN Ticker LIKE '%-I.NFO' THEN regexp_extract(Ticker, '^([A-Z]+)-I\.NFO$', 1)
                ELSE regexp_extract(Ticker, '^([A-Z]+)(\d{2}[A-Z]{3}\d{2})FUT\.NFO$', 1)
            END AS underlying,
            COALESCE(
                try_strptime(ts_str, '%d-%m-%Y %H:%M:%S'),
                try_strptime(ts_str, '%m-%d-%Y %H:%M:%S'),
                try_strptime(ts_str, '%Y-%m-%d %H:%M:%S')
            ) AS timestamp,
            Open::FLOAT as open,
            High::FLOAT as high,
            Low::FLOAT as low,
            Close::FLOAT as close,
            Volume::INTEGER as volume
        FROM raw_fixed
    """)
    print("[+] historical_spot table created.")
    
    print("[*] Creating indices for sub-10ms replay performance...")
    con.execute("CREATE INDEX idx_options_lookup ON historical_options(underlying, expiry, timestamp, strike);")
    con.execute("CREATE INDEX idx_options_timestamp ON historical_options(timestamp);")
    con.execute("CREATE INDEX idx_spot_lookup ON historical_spot(underlying, timestamp);")
    print("[+] Indices created.")
    
    print(f"[*] ETL completed in {time.time() - start_time:.2f} seconds.")
    con.close()

if __name__ == "__main__":
    run_etl()
