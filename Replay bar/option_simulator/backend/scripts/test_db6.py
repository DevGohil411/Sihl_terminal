import duckdb
DATA_PATH = r"d:\option simulator algotest\option data\**\*.csv"
con = duckdb.connect()
res = con.execute(f"""
    SELECT Ticker 
    FROM read_csv_auto('{DATA_PATH}', union_by_name=True) 
    WHERE Ticker LIKE '%FUT%' OR (Ticker NOT LIKE '%CE%' AND Ticker NOT LIKE '%PE%')
    LIMIT 5
""").fetchall()
print("Matches:", res)
