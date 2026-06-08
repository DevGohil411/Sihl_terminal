import duckdb
con = duckdb.connect()
DATA_PATH = r'd:\option simulator algotest\option data\**\*.csv'
try:
    res = con.execute(f"""
        SELECT DISTINCT Ticker 
        FROM read_csv_auto('{DATA_PATH}', union_by_name=True) 
        WHERE Ticker LIKE '%FUT%' OR (Ticker NOT LIKE '%CE.NFO' AND Ticker NOT LIKE '%PE.NFO')
        LIMIT 20
    """).fetchall()
    print("Found:", res)
except Exception as e:
    print("Error:", e)
