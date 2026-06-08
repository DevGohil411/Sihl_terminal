import duckdb
import time
from pathlib import Path

DB_PATH = Path(r"d:\option simulator algotest\simulator\data\spot_v3.duckdb")
SPOT_DATA_PATH = r"d:\option simulator algotest\option data\index data\*.csv"

def import_spot():
    print("[*] Starting Spot Data Import into separate DB...")
    start_time = time.time()
    
    con = duckdb.connect(str(DB_PATH))
    
    print("[*] Reading Spot CSVs...")
    con.execute(f"CREATE OR REPLACE VIEW raw_spot AS SELECT *, filename FROM read_csv_auto('{SPOT_DATA_PATH}', header=True, filename=True, union_by_name=True)")
    con.execute("DROP TABLE IF EXISTS historical_spot;")
    
    print("[*] Creating 'historical_spot' table...")
    con.execute("""
        CREATE TABLE historical_spot AS 
        WITH parsed AS (
            SELECT 
                CASE 
                    WHEN filename LIKE '%NIFTY 50_minute.csv%' THEN 'NIFTY'
                    WHEN filename LIKE '%NIFTY BANK_minute.csv%' THEN 'BANKNIFTY'
                    WHEN filename LIKE '%NIFTY FIN SERVICE_minute.csv%' THEN 'FINNIFTY'
                    WHEN filename LIKE '%INDIA VIX_minute.csv%' THEN 'INDIAVIX'
                    ELSE 'UNKNOWN'
                END AS underlying,
                try_cast(date as TIMESTAMP) as timestamp,
                open::FLOAT as open,
                high::FLOAT as high,
                low::FLOAT as low,
                close::FLOAT as close,
                volume::INTEGER as volume
            FROM raw_spot
        )
        SELECT * FROM parsed WHERE underlying != 'UNKNOWN' AND timestamp IS NOT NULL;
    """)
    print("[+] historical_spot table populated.")
    print(con.execute("SELECT underlying, count(*) FROM historical_spot GROUP BY underlying").fetchall())
    
    con.execute("CREATE INDEX IF NOT EXISTS idx_spot_lookup ON historical_spot(underlying, timestamp);")
    print(f"[*] Spot Import completed in {time.time() - start_time:.2f} seconds.")
    con.close()

if __name__ == "__main__":
    import_spot()
