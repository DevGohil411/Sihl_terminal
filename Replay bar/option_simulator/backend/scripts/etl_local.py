"""
ETL Pipeline v2 — Local DuckDB Mode (No ClickHouse Required)
=============================================================
This version stores the processed data in a local DuckDB file
at: d:/option simulator algotest/simulator/data/options.duckdb

When you install ClickHouse later, run etl_pipeline.py to migrate.

DuckDB is production-grade for single-machine use and handles
hundreds of millions of rows with sub-second query latency.

Usage:
    cd "d:\option simulator algotest\simulator\backend"
    python -X utf8 scripts\etl_local.py

What it does:
    1. Creates a persistent DuckDB database file
    2. Loads all GFDLNFO_OPTIONS_*.csv files (OHLC + exact timestamps)
    3. Loads NIFTY 50_minute.csv (spot index data)
    4. Creates optimized indexes for fast chain retrieval
    5. Shows a verification summary
"""

import re
import glob
from pathlib import Path
from datetime import datetime
import polars as pl
import duckdb
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, BarColumn, TextColumn, TimeElapsedColumn

console = Console()

# ─── PATHS ─────────────────────────────────────────────────────────────────────
OPTIONS_DATA_ROOT = Path(r"d:\option simulator algotest\Option data")
SPOT_CSV_PATH     = Path(r"d:\option simulator algotest\Option data\nifty data\NIFTY 50_minute.csv")
DB_PATH           = Path(r"d:\option simulator algotest\simulator\data\options.duckdb")

BATCH_SIZE = 500_000

# ─── MONTH LOOKUP ──────────────────────────────────────────────────────────────
MONTH_MAP = {
    "JAN": 1,  "FEB": 2,  "MAR": 3,  "APR": 4,
    "MAY": 5,  "JUN": 6,  "JUL": 7,  "AUG": 8,
    "SEP": 9,  "OCT": 10, "NOV": 11, "DEC": 12,
}


def setup_database(con: duckdb.DuckDBPyConnection):
    """Creates the schema tables with optimized column types."""
    console.log("[bold cyan]Creating schema...[/]")

    con.execute("""
        CREATE TABLE IF NOT EXISTS historical_options (
            underlying    VARCHAR,
            expiry        DATE,
            strike        INTEGER,
            option_type   VARCHAR(2),
            timestamp     TIMESTAMP,
            open          FLOAT,
            high          FLOAT,
            low           FLOAT,
            close         FLOAT,
            volume        INTEGER,
            open_interest INTEGER,
        )
    """)

    con.execute("""
        CREATE TABLE IF NOT EXISTS historical_spot (
            underlying  VARCHAR,
            timestamp   TIMESTAMP,
            open        FLOAT,
            high        FLOAT,
            low         FLOAT,
            close       FLOAT,
            volume      INTEGER,
        )
    """)

    # Indexes for fast time-series lookups
    try:
        con.execute("CREATE INDEX IF NOT EXISTS idx_opt_chain ON historical_options (underlying, expiry, timestamp, strike)")
        con.execute("CREATE INDEX IF NOT EXISTS idx_spot_ts   ON historical_spot (underlying, timestamp)")
    except Exception:
        pass  # Indexes may already exist

    console.log("[green]✓[/] Schema ready")


def load_spot(con: duckdb.DuckDBPyConnection):
    """
    Loads NIFTY 50_minute.csv into historical_spot.
    CSV format: date,open,high,low,close,volume
    Date format: DD-MM-YYYY HH:MM  (e.g. "09-01-2015 09:15")

    TIMESTAMP RULE: Loaded exactly as parsed — zero modification.
    """
    if not SPOT_CSV_PATH.exists():
        console.log(f"[red]Spot CSV not found: {SPOT_CSV_PATH}[/]")
        return

    console.log(f"\n[bold]Loading spot index data...[/]")

    lf = (
        pl.scan_csv(str(SPOT_CSV_PATH))
        .rename({"date": "raw_ts"})
        .with_columns(
            pl.col("raw_ts")
              .str.strptime(pl.Datetime, "%d-%m-%Y %H:%M", strict=False)
              .alias("timestamp")
        )
        .drop("raw_ts")
        .with_columns(pl.lit("NIFTY").alias("underlying"))
        .select(["underlying", "timestamp", "open", "high", "low", "close", "volume"])
        .filter(pl.col("timestamp").is_not_null())
    )

    df = lf.collect()
    console.log(f"  Rows parsed: [bold]{len(df):,}[/]")

    con.execute("DELETE FROM historical_spot WHERE underlying = 'NIFTY'")
    con.execute("INSERT INTO historical_spot SELECT * FROM df")
    console.log(f"[green]✓[/] Spot data loaded: {len(df):,} rows")


def load_options(con: duckdb.DuckDBPyConnection):
    """
    Recursively finds all GFDLNFO_OPTIONS_*.csv files and loads them.
    Each file is one trading day of all contracts.

    CSV Schema: Ticker, Date, Time, Open, High, Low, Close, Volume, Open Interest
    Ticker:     e.g. BANKNIFTY26MAY2643000PE.NFO
    Date:       DD/MM/YYYY
    Time:       HH:MM:SS  (PRESERVED EXACTLY — 15:15:59 stays 15:15:59)
    """
    csv_files = sorted(glob.glob(str(OPTIONS_DATA_ROOT / "**" / "GFDLNFO_OPTIONS_*.csv"), recursive=True))

    if not csv_files:
        console.log(f"[red]No GFDLNFO_OPTIONS_*.csv files found under {OPTIONS_DATA_ROOT}[/]")
        return

    console.log(f"\n[bold]Found {len(csv_files)} options CSV files.[/]")
    total_rows_inserted = 0

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TextColumn("{task.completed}/{task.total}"),
        TimeElapsedColumn(),
        console=console,
    ) as progress:
        task = progress.add_task("Loading options...", total=len(csv_files))

        for csv_path in csv_files:
            rows = _process_options_file(con, csv_path)
            total_rows_inserted += rows
            progress.update(task, advance=1, description=f"[cyan]{Path(csv_path).name}[/] ({rows:,} rows)")

    console.log(f"\n[green]✓[/] All options loaded: [bold]{total_rows_inserted:,}[/] total rows")


def _process_options_file(con: duckdb.DuckDBPyConnection, csv_path: str) -> int:
    """Processes one daily options CSV file into DuckDB."""
    try:
        df = pl.read_csv(csv_path, has_header=True, infer_schema_length=500)
        df = df.rename({c: c.strip() for c in df.columns})

        # ── 1. Parse exact timestamp (NO ROUNDING) ─────────────────────────────
        # "04/05/2026" + " " + "09:16:59"  ->  datetime(2026,5,4,9,16,59)
        df = df.with_columns(
            (pl.col("Date").str.strip_chars() + " " + pl.col("Time").str.strip_chars())
            .str.strptime(pl.Datetime("us"), "%d/%m/%Y %H:%M:%S", strict=False)
            .alias("timestamp")
        ).drop(["Date", "Time"])

        null_count = df.filter(pl.col("timestamp").is_null()).height
        df = df.filter(pl.col("timestamp").is_not_null())

        if df.is_empty():
            return 0

        # ── 2. Parse ticker into components ────────────────────────────────────
        # BANKNIFTY26MAY2643000PE.NFO  ->  underlying=BANKNIFTY, expiry=2026-05-26,
        #                                   strike=43000, option_type=PE
        ticker = pl.col("Ticker").str.strip_chars()

        df = df.with_columns([
            ticker.str.extract(r"^(NIFTY|BANKNIFTY|FINNIFTY|MIDCPNIFTY)", 1)
                  .alias("underlying"),
            ticker.str.extract(r"^(?:NIFTY|BANKNIFTY|FINNIFTY|MIDCPNIFTY)(\d{2})[A-Z]{3}\d{2,4}\d+(CE|PE)", 1)
                  .cast(pl.Int32).alias("expiry_dd"),
            ticker.str.extract(r"^(?:NIFTY|BANKNIFTY|FINNIFTY|MIDCPNIFTY)\d{2}([A-Z]{3})\d{2,4}", 1)
                  .alias("expiry_mmm"),
            ticker.str.extract(r"^(?:NIFTY|BANKNIFTY|FINNIFTY|MIDCPNIFTY)\d{2}[A-Z]{3}(\d{2,4})", 1)
                  .cast(pl.Int32).alias("expiry_yy_raw"),
            ticker.str.extract(r"(\d+)(?:CE|PE)\.NFO$", 1)
                  .cast(pl.Int32).alias("strike"),
            ticker.str.extract(r"(CE|PE)\.NFO$", 1)
                  .alias("option_type"),
        ])

        # Drop rows where ticker parsing failed (unrecognized format)
        df = df.filter(
            pl.col("underlying").is_not_null() &
            pl.col("strike").is_not_null() &
            pl.col("option_type").is_not_null() &
            pl.col("expiry_mmm").is_not_null()
        )

        # ── 3. Build expiry Date ────────────────────────────────────────────────
        df = df.with_columns(
            pl.when(pl.col("expiry_yy_raw") < 100)
              .then(pl.col("expiry_yy_raw") + 2000)
              .otherwise(pl.col("expiry_yy_raw"))
              .alias("expiry_yyyy")
        )

        month_df = pl.DataFrame({
            "expiry_mmm": ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"],
            "expiry_mm": list(range(1, 13))
        })
        df = df.join(month_df, on="expiry_mmm", how="left")

        df = df.with_columns(
            pl.date(pl.col("expiry_yyyy"), pl.col("expiry_mm"), pl.col("expiry_dd"))
              .alias("expiry")
        )

        # ── 4. Select final columns ─────────────────────────────────────────────
        df_final = df.select([
            "underlying",
            "expiry",
            "strike",
            "option_type",
            "timestamp",
            pl.col("Open").alias("open"),
            pl.col("High").alias("high"),
            pl.col("Low").alias("low"),
            pl.col("Close").alias("close"),
            pl.col("Volume").cast(pl.Int32).alias("volume"),
            pl.col("Open Interest").cast(pl.Int32).alias("open_interest"),
        ]).filter(pl.col("expiry").is_not_null())

        if df_final.is_empty():
            return 0

        # ── 5. Insert into DuckDB ───────────────────────────────────────────────
        con.execute("INSERT INTO historical_options SELECT * FROM df_final")
        return len(df_final)

    except Exception as e:
        console.log(f"  [red]ERROR in {Path(csv_path).name}: {e}[/]")
        return 0


def verify(con: duckdb.DuckDBPyConnection):
    """Prints a quick summary of what was loaded."""
    console.rule("[bold]Verification[/]")

    opt_count  = con.execute("SELECT count() FROM historical_options").fetchone()[0]
    spot_count = con.execute("SELECT count() FROM historical_spot").fetchone()[0]
    underlyings = con.execute("SELECT DISTINCT underlying FROM historical_options ORDER BY 1").fetchall()
    expiries    = con.execute("SELECT DISTINCT expiry FROM historical_options ORDER BY 1 LIMIT 5").fetchall()

    sample = con.execute("""
        SELECT underlying, expiry, strike, option_type, timestamp, open, high, low, close
        FROM historical_options
        LIMIT 3
    """).fetchall()

    console.log(f"[bold]historical_options:[/] {opt_count:,} rows")
    console.log(f"[bold]historical_spot:   [/] {spot_count:,} rows")
    console.log(f"[bold]Underlyings:[/] {[r[0] for r in underlyings]}")
    console.log(f"[bold]Sample expiries:[/] {[str(r[0]) for r in expiries]}")
    console.log("\n[bold]Sample rows (timestamp preserved exactly):[/]")
    for row in sample:
        console.log(f"  {row[0]} | {row[1]} | {row[2]}{row[3]} | ts={row[4]} | O={row[5]} H={row[6]} L={row[7]} C={row[8]}")


def main():
    console.rule("[bold blue]Options Simulator ETL Pipeline (Local DuckDB Mode)[/]")

    # Ensure output directory exists
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    console.log(f"Database path: [bold]{DB_PATH}[/]")
    con = duckdb.connect(str(DB_PATH))

    setup_database(con)
    load_spot(con)
    load_options(con)
    verify(con)

    con.close()
    console.rule("[bold green]ETL Complete[/]")
    console.log(f"Database saved at: [bold]{DB_PATH}[/]")
    console.log("Next step: [bold]uvicorn app.main:app --reload[/]  (from the backend/ directory)")


if __name__ == "__main__":
    main()
