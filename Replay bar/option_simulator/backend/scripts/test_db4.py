import duckdb
DATA_PATH = r"d:\option simulator algotest\option data\**\*.csv"
con = duckdb.connect()
con.execute(f"CREATE VIEW raw_data AS SELECT * FROM read_csv_auto('{DATA_PATH}', union_by_name=True, header=True)")
print("Sample:", con.execute("SELECT DISTINCT Ticker FROM raw_data WHERE Ticker NOT LIKE '%CE.NFO' AND Ticker NOT LIKE '%PE.NFO' LIMIT 10").fetchall())
