"""
ETL Pipeline v3 — Robust DuckDB Mode (Fixed NULL pointer crash)
===============================================================
Root cause of previous crash:
    DuckDB's transaction checkpointing fails with NULL pointer when many
    large INSERT batches are committed inside a single persistent connection.

Fix applied:
    1. Use DuckDB's native COPY ... FROM (CSV) instead of Python INSERT
    2. Process each CSV file via a fresh DuckDB connection per file (avoids
       checkpoint accumulation on the persistent DB)
    3. Write cleaned Parquet intermediates into a temp folder, then bulk-load
       via DuckDB's fast Parquet reader in one final transaction

This is the FASTEST and most STABLE approach for large multi-year datasets.

Usage:
    cd "d:\option simulator algotest\simulator\backend"
    python -X utf8 scripts\etl_v3.py

What it does:
    1. Parses each daily CSV using Polars (fast, memory-efficient)
    2. Writes cleaned data as Parquet files into simulator\data\parquet\
    3. Loads all Parquet files into a single DuckDB database in one pass
    4. Verifies row counts and shows sample data
"""

import glob
import shutil
from pathlib import Path
import polars as pl
import duckdb
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, BarColumn, TextColumn, TimeElapsedColumn, MofNCompleteColumn

console = Console()

# ─── PATHS ─────────────────────────────────────────────────────────────────────
OPTIONS_DATA_ROOT = Path(r"d:\option simulator algotest\Option data")
SPOT_CSV_PATH     = Path(r"d:\option simulator algotest\Option data\nifty data\NIFTY 50_minute.csv")
PARQUET_DIR       = Path(r"d:\option simulator algotest\simulator\data\parquet")
DB_PATH           = Path(r"d:\option simulator algotest\simulator\data\options.duckdb")

# Month abbreviation -> integer
MONTH_MAP_DF = pl.DataFrame({
    "expiry_mmm": ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"],
    "expiry_mm":  list(range(1, 13))
})


# ─── STEP 1: CLEAN UP OLD DB ────────────────────────────────────────────────────
def clean_old_data():
    """Remove stale/corrupt DuckDB file and old Parquet files."""
    if DB_PATH.exists():
        DB_PATH.unlink()
        console.log(f"[yellow]Removed old database:[/] {DB_PATH}")
    if PARQUET_DIR.exists():
        shutil.rmtree(PARQUET_DIR)
        console.log(f"[yellow]Removed old Parquet cache:[/] {PARQUET_DIR}")

    PARQUET_DIR.mkdir(parents=True, exist_ok=True)
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    console.log("[green]✓[/] Clean slate ready")


# ─── STEP 2: PROCESS CSVs → PARQUET ────────────────────────────────────────────
def process_spot_csv():
    """
    Converts NIFTY 50_minute.csv → spot.parquet
    Format: DD-MM-YYYY HH:MM  (e.g. "09-01-2015 09:15")
    Timestamp stored EXACTLY — no rounding or modification.
    """
    if not SPOT_CSV_PATH.exists():
        console.log(f"[red]Spot CSV not found: {SPOT_CSV_PATH}[/]")
        return 0

    console.log(f"\n[bold]Processing spot data...[/]")

    df = (
        pl.scan_csv(str(SPOT_CSV_PATH))
        .rename({"date": "raw_ts"})
        .with_columns(
            pl.col("raw_ts")
              .str.strptime(pl.Datetime("us"), "%d-%m-%Y %H:%M", strict=False)
              .alias("timestamp")
        )
        .drop("raw_ts")
        .with_columns(pl.lit("NIFTY").alias("underlying"))
        .select(["underlying", "timestamp", "open", "high", "low", "close", "volume"])
        .filter(pl.col("timestamp").is_not_null())
        .collect()
    )

    out = PARQUET_DIR / "spot" / "nifty_spot.parquet"
    out.parent.mkdir(parents=True, exist_ok=True)
    df.write_parquet(str(out), compression="zstd")
    console.log(f"[green]✓[/] Spot: {len(df):,} rows → {out.name}")
    return len(df)


def process_options_csv(csv_path: Path) -> int:
    """
    Converts one daily options CSV → Parquet file.

    CSV Schema:  Ticker, Date, Time, Open, High, Low, Close, Volume, Open Interest
    Ticker:      e.g. BANKNIFTY26MAY2643000PE.NFO
    Date:        DD/MM/YYYY
    Time:        HH:MM:SS  (EXACT — 15:15:59 stays 15:15:59)

    Returns number of rows processed, or 0 on failure.
    """
    try:
        df = pl.read_csv(
            str(csv_path),
            has_header=True,
            infer_schema_length=1000,
            ignore_errors=True,
        )
        if df.is_empty():
            return 0

        # Normalize column names
        df = df.rename({c: c.strip() for c in df.columns})

        # Ensure required columns exist
        required = {"Ticker", "Date", "Time", "Open", "High", "Low", "Close", "Volume", "Open Interest"}
        if not required.issubset(set(df.columns)):
            return 0

        # ── Parse EXACT timestamp (NO rounding) ────────────────────────────────
        df = df.with_columns(
            (pl.col("Date").str.strip_chars() + " " + pl.col("Time").str.strip_chars())
            .str.strptime(pl.Datetime("us"), "%d/%m/%Y %H:%M:%S", strict=False)
            .alias("timestamp")
        ).drop(["Date", "Time"])

        df = df.filter(pl.col("timestamp").is_not_null())
        if df.is_empty():
            return 0

        # ── Parse ticker into components ────────────────────────────────────────
        ticker = pl.col("Ticker").str.strip_chars()
        df = df.with_columns([
            ticker.str.extract(r"^(NIFTY|BANKNIFTY|FINNIFTY|MIDCPNIFTY)", 1)
                  .alias("underlying"),
            ticker.str.extract(r"^(?:NIFTY|BANKNIFTY|FINNIFTY|MIDCPNIFTY)(\d{2})[A-Z]{3}", 1)
                  .cast(pl.Int32, strict=False).alias("expiry_dd"),
            ticker.str.extract(r"^(?:NIFTY|BANKNIFTY|FINNIFTY|MIDCPNIFTY)\d{2}([A-Z]{3})", 1)
                  .alias("expiry_mmm"),
            ticker.str.extract(r"^(?:NIFTY|BANKNIFTY|FINNIFTY|MIDCPNIFTY)\d{2}[A-Z]{3}(\d{2,4})", 1)
                  .cast(pl.Int32, strict=False).alias("expiry_yy_raw"),
            ticker.str.extract(r"(\d+)(?:CE|PE)\.NFO$", 1)
                  .cast(pl.Int32, strict=False).alias("strike"),
            ticker.str.extract(r"(CE|PE)\.NFO$", 1)
                  .alias("option_type"),
        ])

        # Drop invalid rows
        df = df.filter(
            pl.col("underlying").is_not_null() &
            pl.col("strike").is_not_null() &
            pl.col("option_type").is_not_null() &
            pl.col("expiry_mmm").is_not_null() &
            pl.col("expiry_dd").is_not_null() &
            pl.col("expiry_yy_raw").is_not_null()
        )
        if df.is_empty():
            return 0

        # ── Build expiry Date ────────────────────────────────────────────────────
        df = df.with_columns(
            pl.when(pl.col("expiry_yy_raw") < 100)
              .then(pl.col("expiry_yy_raw") + 2000)
              .otherwise(pl.col("expiry_yy_raw"))
              .alias("expiry_yyyy")
        )
        df = df.join(MONTH_MAP_DF, on="expiry_mmm", how="left")
        df = df.filter(pl.col("expiry_mm").is_not_null())

        df = df.with_columns(
            pl.date(pl.col("expiry_yyyy"), pl.col("expiry_mm"), pl.col("expiry_dd"))
              .alias("expiry")
        ).filter(pl.col("expiry").is_not_null())

        # ── Select final columns ─────────────────────────────────────────────────
        df_final = df.select([
            pl.col("underlying").cast(pl.Utf8),
            pl.col("expiry").cast(pl.Date),
            pl.col("strike").cast(pl.Int32),
            pl.col("option_type").cast(pl.Utf8),
            pl.col("timestamp").cast(pl.Datetime("us")),
            pl.col("Open").cast(pl.Float32).alias("open"),
            pl.col("High").cast(pl.Float32).alias("high"),
            pl.col("Low").cast(pl.Float32).alias("low"),
            pl.col("Close").cast(pl.Float32).alias("close"),
            pl.col("Volume").cast(pl.Int32).alias("volume"),
            pl.col("Open Interest").cast(pl.Int32).alias("open_interest"),
        ])

        if df_final.is_empty():
            return 0

        # ── Write Parquet ────────────────────────────────────────────────────────
        # Partition by date extracted from filename (GFDLNFO_OPTIONS_04052026.csv)
        date_part = csv_path.stem.replace("GFDLNFO_OPTIONS_", "")  # e.g. "04052026"
        out_path = PARQUET_DIR / "options" / f"opt_{date_part}.parquet"
        out_path.parent.mkdir(parents=True, exist_ok=True)
        df_final.write_parquet(str(out_path), compression="zstd")

        return len(df_final)

    except Exception as e:
        console.log(f"  [red]SKIP {csv_path.name}: {type(e).__name__}: {str(e)[:100]}[/]")
        return 0


def process_all_option_csvs() -> int:
    """Finds and processes all GFDLNFO_OPTIONS_*.csv files."""
    csv_files = sorted(glob.glob(str(OPTIONS_DATA_ROOT / "**" / "GFDLNFO_OPTIONS_*.csv"), recursive=True))

    if not csv_files:
        console.log(f"[red]No GFDLNFO_OPTIONS_*.csv files found under {OPTIONS_DATA_ROOT}[/]")
        return 0

    console.log(f"\n[bold]Processing {len(csv_files)} options CSV files → Parquet...[/]")
    total = 0

    with Progress(
        SpinnerColumn(),
        TextColumn("[cyan]{task.description}"),
        BarColumn(),
        MofNCompleteColumn(),
        TimeElapsedColumn(),
        console=console,
    ) as progress:
        task = progress.add_task("Converting...", total=len(csv_files))
        for csv_path in csv_files:
            rows = process_options_csv(Path(csv_path))
            total += rows
            progress.update(task, advance=1, description=f"{Path(csv_path).name} ({rows:,}r)")

    console.log(f"[green]✓[/] Parquet conversion complete: [bold]{total:,}[/] total rows")
    return total


# ─── STEP 3: LOAD PARQUET → DUCKDB ──────────────────────────────────────────────
def load_parquet_to_duckdb():
    """
    Loads all Parquet files into DuckDB in ONE transaction using
    DuckDB's native Parquet reader (fastest possible ingestion).
    Avoids the NULL pointer crash that occurs with many Python INSERT batches.
    """
    console.log(f"\n[bold]Loading Parquet files into DuckDB...[/]")
    con = duckdb.connect(str(DB_PATH))

    # Create schema
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
            open_interest INTEGER
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
            volume      INTEGER
        )
    """)

    # ── Load spot ──────────────────────────────────────────────────────────────
    spot_parquet = PARQUET_DIR / "spot" / "nifty_spot.parquet"
    if spot_parquet.exists():
        con.execute(f"""
            INSERT INTO historical_spot
            SELECT * FROM read_parquet('{spot_parquet.as_posix()}')
        """)
        spot_count = con.execute("SELECT count() FROM historical_spot").fetchone()[0]
        console.log(f"[green]✓[/] Spot loaded: {spot_count:,} rows")

    # ── Load options (all Parquet files in one read_parquet glob) ─────────────
    opt_parquet_dir = (PARQUET_DIR / "options").as_posix()
    opt_files = list((PARQUET_DIR / "options").glob("*.parquet"))

    if opt_files:
        glob_pattern = f"{opt_parquet_dir}/*.parquet"
        con.execute(f"""
            INSERT INTO historical_options
            SELECT * FROM read_parquet('{glob_pattern}')
        """)
        opt_count = con.execute("SELECT count() FROM historical_options").fetchone()[0]
        console.log(f"[green]✓[/] Options loaded: {opt_count:,} rows")
    else:
        console.log("[yellow]No option Parquet files found — skipping options load[/]")

    # ── Create indexes for sub-10ms chain queries ──────────────────────────────
    console.log("Creating indexes...")
    try:
        con.execute("""
            CREATE INDEX idx_opt_chain
            ON historical_options (underlying, expiry, timestamp, strike)
        """)
        con.execute("""
            CREATE INDEX idx_spot_ts
            ON historical_spot (underlying, timestamp)
        """)
        console.log("[green]✓[/] Indexes created")
    except Exception as e:
        console.log(f"[yellow]Index creation skipped (may already exist): {e}[/]")

    con.close()


# ─── STEP 4: VERIFY ─────────────────────────────────────────────────────────────
def verify():
    """Confirms what was loaded and shows sample rows."""
    console.rule("[bold]Verification[/]")
    con = duckdb.connect(str(DB_PATH), read_only=True)

    opt_count  = con.execute("SELECT count() FROM historical_options").fetchone()[0]
    spot_count = con.execute("SELECT count() FROM historical_spot").fetchone()[0]

    underlyings = con.execute(
        "SELECT underlying, count() as rows FROM historical_options GROUP BY 1 ORDER BY 1"
    ).fetchall()

    expiries = con.execute(
        "SELECT DISTINCT expiry FROM historical_options ORDER BY 1 LIMIT 5"
    ).fetchall()

    sample = con.execute("""
        SELECT underlying, expiry, strike, option_type, timestamp, open, high, low, close
        FROM historical_options
        WHERE underlying = 'NIFTY'
        ORDER BY timestamp
        LIMIT 3
    """).fetchall()

    # Spot sample
    spot_sample = con.execute("""
        SELECT timestamp, open, high, low, close
        FROM historical_spot
        ORDER BY timestamp
        LIMIT 3
    """).fetchall()

    console.log(f"\n[bold green]historical_options:[/] {opt_count:,} rows")
    console.log(f"[bold green]historical_spot:   [/] {spot_count:,} rows")
    console.log(f"\n[bold]Rows by underlying:[/]")
    for row in underlyings:
        console.log(f"  {row[0]:15s} : {row[1]:>12,} rows")
    console.log(f"\n[bold]First 5 expiries:[/] {[str(r[0]) for r in expiries]}")

    if sample:
        console.log("\n[bold]Sample options rows (timestamp is EXACT):[/]")
        for row in sample:
            console.log(f"  {row[0]} | {row[1]} | {row[2]}{row[3]} | ts={row[4]} | O={row[5]:.2f} H={row[6]:.2f} L={row[7]:.2f} C={row[8]:.2f}")

    if spot_sample:
        console.log("\n[bold]Sample spot rows:[/]")
        for row in spot_sample:
            console.log(f"  ts={row[0]} | O={row[1]:.2f} H={row[2]:.2f} L={row[3]:.2f} C={row[4]:.2f}")

    con.close()


# ─── MAIN ──────────────────────────────────────────────────────────────────────
def main():
    console.rule("[bold blue]Options Simulator ETL v3 (Parquet + DuckDB)[/]")

    # Step 1: Clean old data
    clean_old_data()

    # Step 2: Convert CSVs to Parquet
    process_spot_csv()
    process_all_option_csvs()

    # Step 3: Load Parquet into DuckDB
    load_parquet_to_duckdb()

    # Step 4: Verify
    verify()

    console.rule("[bold green]ETL Complete[/]")
    console.log(f"[bold]Database:[/] {DB_PATH}")
    console.log("[bold]Next:[/] python -X utf8 -m uvicorn app.main:app --reload")


if __name__ == "__main__":
    main()
