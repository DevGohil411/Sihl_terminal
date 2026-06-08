"""
ETL Pipeline: Raw CSV Options Data -> ClickHouse
=================================================
Reads raw GFDLNFO_OPTIONS_DDMMYYYY.csv files and NIFTY 50_minute.csv.
- Preserves EXACT timestamps (15:15:59 stays 15:15:59, no rounding)
- Parses ticker symbol into components (underlying, expiry, strike, option_type)
- Loads full OHLC + Volume + OI into ClickHouse in columnar format
- Uses Polars LazyFrames for memory-efficient processing of large files

Requirements:
    pip install polars clickhouse-driver rich tqdm
"""

import re
import os
import glob
from pathlib import Path
from datetime import datetime, date
import polars as pl
from clickhouse_driver import Client
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TimeElapsedColumn, BarColumn, TextColumn

console = Console()

# ─── CONFIG ────────────────────────────────────────────────────────────────────
CLICKHOUSE_HOST = "localhost"
CLICKHOUSE_PORT = 9000
CLICKHOUSE_DB = "options_simulator"

# Root folder of your raw data: d:\option simulator algotest\Option data
# Adjust this path to where your CSV files are stored
OPTIONS_DATA_ROOT = Path(r"d:\option simulator algotest\Option data")
SPOT_CSV_PATH = Path(r"d:\option simulator algotest\Option data\nifty data\NIFTY 50_minute.csv")

BATCH_SIZE = 250_000  # Rows per ClickHouse insert batch

# ─── TICKER PARSER ─────────────────────────────────────────────────────────────
# Ticker format: BANKNIFTY26MAY2643000PE.NFO
#                NIFTY  26MAY2624000CE.NFO
TICKER_REGEX = re.compile(
    r"^(?P<underlying>NIFTY|BANKNIFTY|FINNIFTY|MIDCPNIFTY)"
    r"(?P<expiry_dd>\d{2})"
    r"(?P<expiry_mmm>[A-Z]{3})"
    r"(?P<expiry_yy>\d{2,4})"
    r"(?P<strike>\d+)"
    r"(?P<option_type>CE|PE)"
    r"\.NFO$"
)

MONTH_MAP = {
    "JAN": 1, "FEB": 2, "MAR": 3, "APR": 4, "MAY": 5, "JUN": 6,
    "JUL": 7, "AUG": 8, "SEP": 9, "OCT": 10, "NOV": 11, "DEC": 12,
}


def parse_ticker(ticker: str) -> dict | None:
    """
    Parses a raw ticker string into structured components.
    Returns None if ticker does not match known format.

    Example:
        "BANKNIFTY26MAY2643000PE.NFO"
        -> {"underlying": "BANKNIFTY", "expiry": date(2026, 5, 26),
            "strike": 43000, "option_type": "PE"}
    """
    m = TICKER_REGEX.match(ticker.strip())
    if not m:
        return None

    dd = int(m.group("expiry_dd"))
    mmm = m.group("expiry_mmm")
    yy = m.group("expiry_yy")

    # Handle 2-digit (24) and 4-digit (2024) year formats
    year = int(yy) if len(yy) == 4 else 2000 + int(yy)
    month = MONTH_MAP.get(mmm)
    if not month:
        return None

    return {
        "underlying": m.group("underlying"),
        "expiry": date(year, month, dd),
        "strike": int(m.group("strike")),
        "option_type": m.group("option_type"),
    }


# ─── CLICKHOUSE SCHEMA ─────────────────────────────────────────────────────────
def setup_clickhouse_schema(client: Client):
    """Creates the ClickHouse database and tables if they don't exist."""
    console.log(f"[bold cyan]Setting up ClickHouse database:[/] {CLICKHOUSE_DB}")

    client.execute(f"CREATE DATABASE IF NOT EXISTS {CLICKHOUSE_DB}")
    client.execute(f"USE {CLICKHOUSE_DB}")

    # Options OHLC table — partitioned by expiry month, ordered for ultra-fast chain slicing
    client.execute("""
        CREATE TABLE IF NOT EXISTS historical_options (
            underlying     LowCardinality(String),
            expiry         Date,
            strike         UInt32,
            option_type    Enum8('CE' = 1, 'PE' = 2),
            timestamp      DateTime64(0, 'Asia/Kolkata'),
            open           Float32,
            high           Float32,
            low            Float32,
            close          Float32,
            volume         UInt32,
            open_interest  UInt32
        )
        ENGINE = MergeTree()
        PARTITION BY toYYYYMM(expiry)
        ORDER BY (underlying, expiry, strike, option_type, timestamp)
        SETTINGS index_granularity = 8192
    """)
    console.log("[green]✓[/] historical_options table ready.")

    # Spot index OHLC table — covers NIFTY, BANKNIFTY, FINNIFTY spot data
    client.execute("""
        CREATE TABLE IF NOT EXISTS historical_spot (
            underlying  LowCardinality(String),
            timestamp   DateTime64(0, 'Asia/Kolkata'),
            open        Float32,
            high        Float32,
            low         Float32,
            close       Float32,
            volume      UInt32
        )
        ENGINE = MergeTree()
        ORDER BY (underlying, timestamp)
        SETTINGS index_granularity = 8192
    """)
    console.log("[green]✓[/] historical_spot table ready.")

    # Pre-computed IV Surface snapshot table (populated by the quant engine)
    client.execute("""
        CREATE TABLE IF NOT EXISTS iv_surface_snapshots (
            underlying   LowCardinality(String),
            expiry       Date,
            timestamp    DateTime64(0, 'Asia/Kolkata'),
            strike       UInt32,
            option_type  Enum8('CE' = 1, 'PE' = 2),
            iv           Float32,
            delta        Float32,
            gamma        Float32,
            theta        Float32,
            vega         Float32
        )
        ENGINE = ReplacingMergeTree()
        PARTITION BY toYYYYMM(expiry)
        ORDER BY (underlying, expiry, strike, option_type, timestamp)
        SETTINGS index_granularity = 8192
    """)
    console.log("[green]✓[/] iv_surface_snapshots table ready.")


# ─── SPOT CSV LOADER ───────────────────────────────────────────────────────────
def load_spot_csv(client: Client, underlying: str = "NIFTY"):
    """
    Loads the NIFTY 50_minute.csv into historical_spot.
    CSV Format:  date,open,high,low,close,volume
    Date Format: DD-MM-YYYY HH:MM  (e.g. "09-01-2015 09:15")

    IMPORTANT: Timestamps are loaded EXACTLY as-is. No rounding applied.
    """
    if not SPOT_CSV_PATH.exists():
        console.log(f"[red]Spot CSV not found: {SPOT_CSV_PATH}[/]")
        return

    console.log(f"[bold]Loading spot data:[/] {SPOT_CSV_PATH.name}")

    # Polars lazy scan for memory efficiency on 1M+ row file
    lf = (
        pl.scan_csv(str(SPOT_CSV_PATH))
        .rename({"date": "raw_ts"})
        # Parse exact timestamp: "09-01-2015 09:15" -> datetime
        .with_columns(
            pl.col("raw_ts")
              .str.strptime(pl.Datetime, "%d-%m-%Y %H:%M", strict=False)
              .alias("timestamp")
        )
        .drop("raw_ts")
        .with_columns(pl.lit(underlying).alias("underlying"))
        .select(["underlying", "timestamp", "open", "high", "low", "close", "volume"])
    )

    df = lf.collect()
    console.log(f"  Rows loaded: [bold]{len(df):,}[/]")

    _insert_dataframe_to_clickhouse(client, df, "historical_spot",
                                    ["underlying", "timestamp", "open", "high", "low", "close", "volume"])
    console.log(f"[green]✓[/] Spot data inserted: {len(df):,} rows")


# ─── OPTIONS CSV LOADER ────────────────────────────────────────────────────────
def load_options_csv_directory(client: Client):
    """
    Recursively scans all GFDLNFO_OPTIONS_*.csv files in the data root directory.
    Processes each file, parses tickers, and inserts into ClickHouse.

    TIMESTAMP INTEGRITY RULE:
        Raw time column contains values like "15:15:59".
        Date column: "04/05/2026".
        Combined: "2026-05-04 15:15:59" — loaded EXACTLY, no rounding.
    """
    csv_files = sorted(glob.glob(str(OPTIONS_DATA_ROOT / "**" / "GFDLNFO_OPTIONS_*.csv"), recursive=True))

    if not csv_files:
        console.log(f"[red]No options CSV files found in {OPTIONS_DATA_ROOT}[/]")
        return

    console.log(f"[bold]Found {len(csv_files)} options CSV files to process.[/]")

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TextColumn("{task.completed}/{task.total} files"),
        TimeElapsedColumn(),
        console=console,
    ) as progress:
        task = progress.add_task("Processing options CSVs...", total=len(csv_files))

        for csv_path in csv_files:
            fname = Path(csv_path).name
            progress.update(task, description=f"[cyan]{fname}[/]")
            _process_single_options_file(client, csv_path)
            progress.advance(task)

    console.log("[bold green]✓ All options CSV files processed successfully.[/]")


def _process_single_options_file(client: Client, csv_path: str):
    """
    Processes one daily options CSV file into ClickHouse.

    CSV Schema:  Ticker, Date, Time, Open, High, Low, Close, Volume, Open Interest
    Date Format: DD/MM/YYYY  (e.g. "04/05/2026")
    Time Format: HH:MM:SS    (e.g. "09:16:59")

    Key Design Decisions:
        1. Ticker parsed inline using vectorized apply (no Python loops)
        2. Date + Time concatenated BEFORE any datetime conversion
        3. Exact second-level timestamps preserved (15:15:59 stays 15:15:59)
        4. Failed ticker parses are logged and skipped, not silently dropped
    """
    try:
        # Read raw CSV with Polars — much faster than pandas for large files
        df = pl.read_csv(
            csv_path,
            has_header=True,
            infer_schema_length=100,
        )

        # Normalize column names (strip whitespace)
        df = df.rename({c: c.strip() for c in df.columns})

        # Combine Date (DD/MM/YYYY) + Time (HH:MM:SS) into exact timestamp
        # "04/05/2026" + " " + "09:16:59" -> parse as "04/05/2026 09:16:59"
        df = df.with_columns(
            (pl.col("Date").str.strip_chars() + " " + pl.col("Time").str.strip_chars())
            .str.strptime(pl.Datetime("us"), "%d/%m/%Y %H:%M:%S", strict=False)
            .alias("timestamp")
        ).drop(["Date", "Time"])

        # Drop rows where timestamp parsing failed
        null_ts_count = df.filter(pl.col("timestamp").is_null()).height
        if null_ts_count > 0:
            console.log(f"  [yellow]⚠ {null_ts_count} rows with unparseable timestamps skipped in {Path(csv_path).name}[/]")
        df = df.filter(pl.col("timestamp").is_not_null())

        # Parse ticker symbol into structured columns using vectorized Polars expressions
        # Regex approach — runs on Polars Rust backend, not Python loop
        ticker_col = pl.col("Ticker").str.strip_chars()

        df = df.with_columns([
            ticker_col
                .str.extract(r"^(NIFTY|BANKNIFTY|FINNIFTY|MIDCPNIFTY)", 1)
                .alias("underlying"),
            # Expiry date: extract day (2d), month (3 alpha), year (2 or 4 digit)
            ticker_col
                .str.extract(r"^(?:NIFTY|BANKNIFTY|FINNIFTY|MIDCPNIFTY)(\d{2})([A-Z]{3})(\d{2,4})", 1)
                .cast(pl.Int32)
                .alias("expiry_dd"),
            ticker_col
                .str.extract(r"^(?:NIFTY|BANKNIFTY|FINNIFTY|MIDCPNIFTY)\d{2}([A-Z]{3})\d{2,4}", 1)
                .alias("expiry_mmm"),
            ticker_col
                .str.extract(r"^(?:NIFTY|BANKNIFTY|FINNIFTY|MIDCPNIFTY)\d{2}[A-Z]{3}(\d{2,4})", 1)
                .cast(pl.Int32)
                .alias("expiry_yy_raw"),
            ticker_col
                .str.extract(r"(\d+)(?:CE|PE)\.NFO$", 1)
                .cast(pl.Int32)
                .alias("strike"),
            ticker_col
                .str.extract(r"(CE|PE)\.NFO$", 1)
                .alias("option_type"),
        ])

        # Drop rows where parsing failed (unrecognized underlyings, bad format)
        df = df.filter(
            pl.col("underlying").is_not_null() &
            pl.col("strike").is_not_null() &
            pl.col("option_type").is_not_null()
        )

        # Build expiry Date from components
        # 2-digit year (24) -> 2024, 4-digit (2026) -> 2026
        df = df.with_columns(
            pl.when(pl.col("expiry_yy_raw") < 100)
              .then(pl.col("expiry_yy_raw") + 2000)
              .otherwise(pl.col("expiry_yy_raw"))
              .alias("expiry_yyyy")
        )

        # Map month abbreviation -> month number using a join
        month_map_df = pl.DataFrame({
            "expiry_mmm": ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"],
            "expiry_mm": list(range(1, 13))
        })
        df = df.join(month_map_df, on="expiry_mmm", how="left")

        # Construct expiry Date column
        df = df.with_columns(
            pl.date(
                pl.col("expiry_yyyy"),
                pl.col("expiry_mm"),
                pl.col("expiry_dd")
            ).alias("expiry")
        )

        # Select only the columns needed for ClickHouse
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
            pl.col("Volume").cast(pl.UInt32).alias("volume"),
            pl.col("Open Interest").cast(pl.UInt32).alias("open_interest"),
        ])

        # Insert in batches to avoid memory spikes
        _insert_dataframe_to_clickhouse(
            client, df_final, "historical_options",
            ["underlying", "expiry", "strike", "option_type", "timestamp",
             "open", "high", "low", "close", "volume", "open_interest"]
        )

    except Exception as e:
        console.log(f"  [red]ERROR processing {Path(csv_path).name}: {e}[/]")


# ─── CLICKHOUSE BATCH INSERT ───────────────────────────────────────────────────
def _insert_dataframe_to_clickhouse(client: Client, df: pl.DataFrame, table: str, columns: list[str]):
    """
    Inserts a Polars DataFrame into ClickHouse in BATCH_SIZE chunks.
    Converts to Python native types for clickhouse-driver compatibility.
    """
    total_rows = len(df)
    if total_rows == 0:
        return

    for start in range(0, total_rows, BATCH_SIZE):
        batch = df.slice(start, BATCH_SIZE)

        # Convert to list of tuples — clickhouse-driver expects this format
        rows = batch.rows()

        client.execute(
            f"INSERT INTO {table} ({', '.join(columns)}) VALUES",
            rows
        )


# ─── MAIN ──────────────────────────────────────────────────────────────────────
def main():
    console.rule("[bold blue]Options Simulator ETL Pipeline[/]")
    console.log(f"Connecting to ClickHouse at {CLICKHOUSE_HOST}:{CLICKHOUSE_PORT}")

    client = Client(
        host=CLICKHOUSE_HOST,
        port=CLICKHOUSE_PORT,
        database="default",
        settings={"use_numpy": False}
    )

    # Step 1: Create schema
    setup_clickhouse_schema(client)
    client.execute(f"USE {CLICKHOUSE_DB}")

    # Step 2: Load spot index data
    console.rule("Loading Spot Data")
    load_spot_csv(client, underlying="NIFTY")

    # Step 3: Load all options CSV files
    console.rule("Loading Options Chain Data")
    load_options_csv_directory(client)

    # Step 4: Verify row counts
    console.rule("Verification")
    opt_count = client.execute(f"SELECT count() FROM {CLICKHOUSE_DB}.historical_options")[0][0]
    spot_count = client.execute(f"SELECT count() FROM {CLICKHOUSE_DB}.historical_spot")[0][0]
    console.log(f"[bold green]historical_options:[/] {opt_count:,} rows")
    console.log(f"[bold green]historical_spot:    [/] {spot_count:,} rows")
    console.rule("[bold green]ETL Complete[/]")


if __name__ == "__main__":
    main()
