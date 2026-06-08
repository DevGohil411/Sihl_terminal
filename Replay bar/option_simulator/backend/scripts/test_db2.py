import duckdb
con = duckdb.connect(r"d:\option simulator algotest\simulator\data\options_v3.duckdb", read_only=True)
print("Spot count:", con.execute("SELECT COUNT(*) FROM historical_spot").fetchall())
print("Options count:", con.execute("SELECT COUNT(*) FROM historical_options").fetchall())
