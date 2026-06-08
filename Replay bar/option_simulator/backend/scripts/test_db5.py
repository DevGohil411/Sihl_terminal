import duckdb
DATA_PATH = r"d:\option simulator algotest\option data\**\*.csv"
con = duckdb.connect()
res = con.execute(f"""
    SELECT Ticker 
    FROM read_csv_auto('{DATA_PATH}', union_by_name=True) 
    WHERE Ticker LIKE '%FUT.NFO' OR Ticker LIKE '%-I.NFO'
    LIMIT 5
""").fetchall()
print("Matches:", res)
