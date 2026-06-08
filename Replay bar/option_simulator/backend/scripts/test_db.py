import duckdb
from datetime import date, datetime
from app.engine.replay import ReplaySession, ReplayAction

session = ReplaySession(
    underlying="NIFTY",
    session_date=date(2024, 1, 1),
)
print("Session initialized successfully!")
print("Session ID:", session.session_id)
print("Timeline length:", len(session._timeline))
print("Start Time:", session.current_timestamp)
print("Expiries:", session._available_expiries)
frame = session.dispatch(ReplayAction.SOD)
print("First frame spot price:", frame.spot_close)
print("Enriched Option Chain rows:", len(frame.chain_data))





