import duckdb
from pathlib import Path
import time

DB_PATH = r"d:\option simulator algotest\simulator\data\options_v3.duckdb"
DATA_PATH = Path(r"d:\option simulator algotest\option data")

def recover_spot():
    con = duckdb.connect(DB_PATH)
    files = list(DATA_PATH.rglob("*.csv"))
    print(f"Scanning {len(files)} files for Spot/Futures data...")
    
    con.execute("""
        CREATE TABLE IF NOT EXISTS historical_spot_temp AS 
        SELECT * FROM historical_spot LIMIT 0;
    """)
    
    count = 0
    for f in files:
        try:
            # We read each file directly as strings to avoid schema crashes
            res = con.execute(f"""
                INSERT INTO historical_spot
                WITH raw_f AS (
                    SELECT 
                        column0 AS Ticker, column1 AS Date, column2 as Time,
                        column3 AS Open, column4 AS High, column5 AS Low, column6 AS Close, column7 AS Volume
                    FROM read_csv_auto('{str(f)}', all_varchar=True, header=True)
                    WHERE column0 LIKE '%-I.NFO' OR column0 LIKE '%FUT.NFO'
                )
                SELECT 
                    CASE 
                        WHEN Ticker LIKE '%-I.NFO' THEN regexp_extract(Ticker, '^([A-Z]+)-I\.NFO$', 1)
                        ELSE regexp_extract(Ticker, '^([A-Z]+)(\d{{2}}[A-Z]{{3}}\d{{2}})FUT\.NFO$', 1)
                    END AS underlying,
                    COALESCE(
                        try_strptime(replace(Date, '/', '-') || ' ' || lpad(Time, 8, '0'), '%d-%m-%Y %H:%M:%S'),
                        try_strptime(replace(Date, '/', '-') || ' ' || lpad(Time, 8, '0'), '%m-%d-%Y %H:%M:%S'),
                        try_strptime(replace(Date, '/', '-') || ' ' || lpad(Time, 8, '0'), '%Y-%m-%d %H:%M:%S')
                    ) AS timestamp,
                    Open::FLOAT as open,
                    High::FLOAT as high,
                    Low::FLOAT as low,
                    Close::FLOAT as close,
                    Volume::INTEGER as volume
                FROM raw_f
                WHERE Ticker IS NOT NULL
            """)
            inserted = con.execute("SELECT COUNT(*) FROM historical_spot").fetchone()[0]
            if inserted > count:
                print(f"Found {inserted - count} spot rows in {f.name}")
                count = inserted
        except Exception as e:
            pass
            
    print(f"Recovered {count} spot rows!")
    con.close()

if __name__ == "__main__":
    recover_spot()
