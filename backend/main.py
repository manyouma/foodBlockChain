from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import fabric_client as fabric
import edge_db

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
