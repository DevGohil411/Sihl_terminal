import duckdb
con = duckdb.connect()
DATA_PATH = r'd:\option simulator algotest\option data\**\*.csv'

res = con.execute(f"""
    SELECT DISTINCT Ticker 
    FROM read_csv_auto('{DATA_PATH}', union_by_name=True) 
    WHERE Ticker LIKE '%FUT%' OR (Ticker NOT LIKE '%CE.NFO' AND Ticker NOT LIKE '%PE.NFO')
    LIMIT 20
""").fetchall()
print('Non-option Tickers:', res)

res2 = con.execute(f"""
    SELECT *
    FROM read_csv_auto('{DATA_PATH}', union_by_name=True) 
    LIMIT 1
""").fetchall()
print('Sample Row:', res2)
