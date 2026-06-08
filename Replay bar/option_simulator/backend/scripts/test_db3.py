import duckdb
DATA_PATH = r"d:\option simulator algotest\option data\**\*.csv"
con = duckdb.connect()
con.execute(f"CREATE VIEW raw_data AS SELECT * FROM read_csv_auto('{DATA_PATH}', union_by_name=True, header=True)")
print("Spot rows in raw_data:", con.execute("SELECT COUNT(*) FROM raw_data WHERE Ticker LIKE '%-I.NFO' OR Ticker LIKE '%FUT.NFO'").fetchall())
