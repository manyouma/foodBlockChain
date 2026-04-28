from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import fabric_client as fabric
import edge_db
import math

app = FastAPI(title="FoodChain API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

edge_db.init_db()


# --- Request models ---

class ShipmentRequest(BaseModel):
    product: str
    origin: str
    destination: str = ""

class ReadingRequest(BaseModel):
    shipment_id: str
    stage: str
    temperature: float
    humidity: float
    co2: float = 400.0
    vibration: float = 0.0
    vehicle_id: str = ""
    location: str
    offline: bool = False


# --- Shipment endpoints ---

@app.get("/shipments")
def list_shipments():
    try:
        return fabric.get_all_shipments()
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/shipment/{shipment_id}")
def create_shipment(shipment_id: str, req: ShipmentRequest):
    try:
        return fabric.create_shipment(shipment_id, req.product, req.origin, req.destination)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/shipment/{shipment_id}")
def get_shipment(shipment_id: str):
    try:
        return fabric.get_shipment(shipment_id)
    except RuntimeError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/shipment/{shipment_id}/readings")
def get_readings(shipment_id: str):
    try:
        return fabric.get_readings_for_shipment(shipment_id)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Sensor reading endpoints ---

@app.post("/reading")
def record_reading(req: ReadingRequest):
    if req.offline:
        reading_id = edge_db.save_reading_offline(
            req.shipment_id, req.stage, req.temperature, req.humidity,
            req.co2, req.vibration, req.location
        )
        return {"status": "saved_offline", "reading_id": reading_id}
    try:
        import uuid
        reading_id = f"READ-{uuid.uuid4().hex[:8].upper()}"
        return fabric.record_reading(
            reading_id, req.shipment_id, req.stage,
            req.temperature, req.humidity, req.co2, req.vibration,
            req.vehicle_id, req.location,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Sync endpoint: flush offline readings to blockchain ---

@app.post("/sync")
def sync_offline_readings():
    pending = edge_db.get_pending_readings()
    synced, failed = [], []
    for r in pending:
        try:
            fabric.record_reading(
                r["id"], r["shipment_id"], r["stage"],
                r["temperature"], r["humidity"], r["co2"], r["vibration"],
                r.get("vehicle_id", ""), r["location"],
            )
            edge_db.mark_synced(r["id"])
            synced.append(r["id"])
        except RuntimeError:
            failed.append(r["id"])
    return {"synced": synced, "failed": failed}


@app.get("/pending")
def get_pending():
    return edge_db.get_pending_readings()


@app.get("/health")
def health():
    return {"status": "ok"}


# --- Digital Twin endpoint ---

# Arrhenius parameters for lychee
_Ea  = 70000.0   # activation energy J/mol
_R   = 8.314     # gas constant J/(mol·K)
_T_ref = 275.15  # reference temp: 2°C in Kelvin
_RSL_0 = 504.0   # shelf life at 2°C in hours (~21 days)
_INTERVAL_H = 2.0  # assumed hours between readings

def _k(T_celsius: float) -> float:
    T = T_celsius + 273.15
    return math.exp(-_Ea / _R * (1.0 / T - 1.0 / _T_ref))

@app.get("/shipment/{shipment_id}/twin")
def digital_twin(shipment_id: str):
    try:
        readings = fabric.get_readings_for_shipment(shipment_id)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    if not readings:
        raise HTTPException(status_code=404, detail="No readings found")

    readings = sorted(readings, key=lambda r: r["timestamp"])

    cumulative = 0.0
    timeline = []
    hours_lost = 0.0

    for r in readings:
        rate = _k(r["temperature"])
        step = rate * _INTERVAL_H
        cumulative += step
        # hours lost = extra degradation beyond ideal (rate=1) conditions
        hours_lost += max(0.0, (rate - 1.0) * _INTERVAL_H)
        rsl = max(0.0, _RSL_0 - cumulative)
        timeline.append({
            "readingId":   r["id"],
            "stage":       r["stage"],
            "timestamp":   r["timestamp"],
            "temperature": r["temperature"],
            "rate":        round(rate, 3),
            "rsl_hours":   round(rsl, 1),
            "quality_pct": round(rsl / _RSL_0 * 100, 1),
        })

    last = timeline[-1]
    return {
        "shipmentId":       shipment_id,
        "rsl_0_hours":      _RSL_0,
        "rsl_0_days":       round(_RSL_0 / 24, 1),
        "current_rsl_hours": last["rsl_hours"],
        "current_rsl_days":  round(last["rsl_hours"] / 24, 1),
        "current_quality_pct": last["quality_pct"],
        "hours_lost":       round(hours_lost, 1),
        "t_ref_celsius":    _T_ref - 273.15,
        "timeline":         timeline,
    }
