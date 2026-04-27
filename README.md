# FoodChain — Blockchain-Verified Produce Supply Chain

**Live demo → [manyouma.github.io/foodBlockChain](https://manyouma.github.io/foodBlockChain)**

A full-stack traceability platform for fresh produce (lychee / 荔枝) that records every step of the cold chain — from farm to supermarket — on an immutable blockchain ledger. Consumers and regulators can verify the complete journey of any shipment by scanning a QR code.

![Dashboard screenshot](https://manyouma.github.io/foodBlockChain/og-preview.png)

---

## What it does

- **End-to-end tracking** across four stages: Farm → In Transit → Warehouse → Supermarket
- **Sensor data** logged at every checkpoint: temperature, humidity, CO₂, vibration, and truck plate number
- **Anomaly detection** with automatic alerts when cold-chain thresholds are breached (temp > 8 °C, CO₂ > 1000 ppm, vibration > 1.5 g)
- **Live map** showing the latest 30 readings across all active shipments with pulsing alert markers
- **Bilingual UI** — switch between English and Simplified Chinese (中文) at any time
- **Offline-first trucks** — readings are stored locally on the truck's SQLite database when out of coverage, then automatically synced to the blockchain when connectivity is restored

---

## Why Hyperledger Fabric?

The core trust problem in food supply chains is that no single party — farm, logistics company, or retailer — should be able to alter records after the fact. Hyperledger Fabric solves this in four ways:

### 1. Tamper-proof ledger
Every sensor reading is written to an append-only distributed ledger using `PutState`. Once committed, no participant can modify or delete it. If a truck driver tries to hide a temperature excursion, the on-chain record already exists and cannot be changed.

### 2. Permissioned identities
Unlike public blockchains, Fabric uses a Membership Service Provider (MSP). Each organisation — farm, logistics company, supermarket — holds its own X.509 certificate. Transactions are signed with the submitter's identity, so every reading carries a cryptographic proof of who recorded it (`recordedBy` field).

### 3. Multi-org endorsement
Chaincode transactions require endorsement from **both** Org1 (farm / logistics) and Org2 (retailer / regulator) before they are committed. A single compromised node cannot forge a reading — consensus requires multiple independent parties to agree.

### 4. Full audit trail
The ledger stores the complete history of every `READING_*` and `SHIPMENT_*` key. Regulators can query the entire cold-chain history for any batch, with timestamps, GPS coordinates, and sensor values — no reliance on self-reported paper records.

---

## Tech stack

| Layer | Technology |
|---|---|
| Blockchain | Hyperledger Fabric 3.1 (2-org test network) |
| Smart contract | Go (`fabric-contract-api-go`) |
| Backend API | Python / FastAPI |
| Edge storage | SQLite (offline-first sync) |
| Frontend | React 19, react-leaflet, Recharts |
| Map tiles | OpenStreetMap |
| Hosting | GitHub Pages (demo mode with static fallback data) |

---

## Project structure

```
foodBlockChain/
├── chaincode/foodchain/   # Go smart contract (CreateShipment, RecordReading, GetAllShipments …)
├── backend/               # FastAPI server + SQLite edge DB + Fabric peer CLI client
├── frontend/              # React dashboard (bilingual, map, charts, blockchain badges)
└── fabric/                # Hyperledger Fabric test-network (Docker)
```

---

## Running locally

> Requires: Docker (via Colima on Apple Silicon), Go, Python 3.11+, Node 18+

### 1. Start the Fabric network

```bash
cd fabric/fabric-samples/test-network
./network.sh up createChannel -c foodchannel -ca
./network.sh deployCC -ccn foodchain -ccp ~/GitHub/foodBlockChain/chaincode/foodchain \
  -ccl go -c foodchannel -ccv 5.0 -ccs 5
```

### 2. Start the backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Seed demo data

```bash
chmod +x seed_data4.sh && ./seed_data4.sh
```

### 4. Start the frontend

```bash
cd frontend
npm install && npm start
```

Open [http://localhost:3000](http://localhost:3000).

---

## Smart contract API

| Function | Arguments | Description |
|---|---|---|
| `CreateShipment` | id, product, origin, destination | Register a new shipment batch |
| `RecordReading` | id, shipmentId, stage, temp, humidity, co2, vibration, vehicleId, location | Append a sensor reading |
| `GetAllShipments` | — | List all shipments |
| `GetAllReadingsForShipment` | shipmentId | All readings for one shipment |
| `GetShipment` | id | Single shipment details |
| `GetReading` | id | Single reading details |

Location values are encoded as `Name::latitude::longitude` so the frontend can parse GPS coordinates without requiring a chaincode schema change.

---

## License

MIT
