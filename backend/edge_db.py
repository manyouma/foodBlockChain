"""
Offline edge storage — simulates what runs on a truck with no internet.
Readings are saved to SQLite and synced to Fabric when connectivity returns.
"""
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path(__file__).parent / "edge.db"


def _conn():
    return sqlite3.connect(DB_PATH)


def init_db():
    with _conn() as c:
        c.execute("""
            CREATE TABLE IF NOT EXISTS pending_readings (
                id TEXT PRIMARY KEY,
                shipment_id TEXT NOT NULL,
                stage TEXT NOT NULL,
                temperature REAL NOT NULL,
                humidity REAL NOT NULL,
                co2 REAL NOT NULL DEFAULT 400.0,
                vibration REAL NOT NULL DEFAULT 0.0,
                location TEXT NOT NULL,
                recorded_at TEXT NOT NULL,
                synced INTEGER DEFAULT 0
            )
        """)
        # migrate existing DBs that don't have the new columns
        for col, default in [("co2", "400.0"), ("vibration", "0.0")]:
            try:
                c.execute(f"ALTER TABLE pending_readings ADD COLUMN {col} REAL NOT NULL DEFAULT {default}")
            except Exception:
                pass


def save_reading_offline(shipment_id: str, stage: str, temperature: float,
                         humidity: float, co2: float, vibration: float, location: str) -> str:
    reading_id = f"READ-{uuid.uuid4().hex[:8].upper()}"
    recorded_at = datetime.now(timezone.utc).isoformat()
    with _conn() as c:
        c.execute(
            "INSERT INTO pending_readings(id,shipment_id,stage,temperature,humidity,co2,vibration,location,recorded_at,synced) VALUES (?,?,?,?,?,?,?,?,?,0)",
            (reading_id, shipment_id, stage, temperature, humidity, co2, vibration, location, recorded_at),
        )
    return reading_id


def get_pending_readings() -> list[dict]:
    with _conn() as c:
        c.row_factory = sqlite3.Row
        rows = c.execute(
            "SELECT * FROM pending_readings WHERE synced = 0"
        ).fetchall()
    return [dict(r) for r in rows]


def mark_synced(reading_id: str):
    with _conn() as c:
        c.execute("UPDATE pending_readings SET synced = 1 WHERE id = ?", (reading_id,))


def get_all_readings() -> list[dict]:
    with _conn() as c:
        c.row_factory = sqlite3.Row
        rows = c.execute("SELECT * FROM pending_readings ORDER BY recorded_at").fetchall()
    return [dict(r) for r in rows]
