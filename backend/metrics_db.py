"""
Stores per-transaction timing measurements for AoI research experiments.
"""
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

METRICS_PATH = Path(__file__).parent / "metrics.db"


def _conn():
    return sqlite3.connect(METRICS_PATH)


def init_metrics_db():
    with _conn() as c:
        c.execute("""
            CREATE TABLE IF NOT EXISTS tx_metrics (
                id          TEXT PRIMARY KEY,
                shipment_id TEXT,
                stage       TEXT,
                sensor_time TEXT,   -- when the reading was "sensed" (simulated)
                submit_time TEXT,   -- when we called peer chaincode invoke
                commit_time TEXT,   -- when the invoke returned (tx committed)
                latency_ms  REAL,   -- commit_time - submit_time in ms
                experiment  TEXT,   -- experiment label e.g. "rate_0.5", "offline_30m"
                lambda_rate REAL    -- submissions per second during this experiment
            )
        """)


def record_tx(reading_id: str, shipment_id: str, stage: str,
              sensor_time: str, submit_time: str, commit_time: str,
              latency_ms: float, experiment: str = "default", lambda_rate: float = 0):
    with _conn() as c:
        c.execute("""
            INSERT OR REPLACE INTO tx_metrics
            VALUES (?,?,?,?,?,?,?,?,?)
        """, (reading_id, shipment_id, stage, sensor_time,
              submit_time, commit_time, latency_ms, experiment, lambda_rate))


def get_metrics(experiment: str = None) -> list[dict]:
    with _conn() as c:
        c.row_factory = sqlite3.Row
        if experiment:
            rows = c.execute(
                "SELECT * FROM tx_metrics WHERE experiment=? ORDER BY submit_time",
                (experiment,)
            ).fetchall()
        else:
            rows = c.execute(
                "SELECT * FROM tx_metrics ORDER BY submit_time"
            ).fetchall()
    return [dict(r) for r in rows]


def get_experiments() -> list[str]:
    with _conn() as c:
        rows = c.execute(
            "SELECT DISTINCT experiment, COUNT(*) as n FROM tx_metrics GROUP BY experiment"
        ).fetchall()
    return [{"experiment": r[0], "count": r[1]} for r in rows]
