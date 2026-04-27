import subprocess
import json
import os
from pathlib import Path

NETWORK_DIR = Path.home() / "GitHub/foodBlockChain/fabric/fabric-samples/test-network"
BIN_DIR = Path.home() / "GitHub/foodBlockChain/fabric/fabric-samples/bin"

BASE_ENV = {
    **os.environ,
    "PATH": f"{BIN_DIR}:{os.environ['PATH']}",
    "FABRIC_CFG_PATH": str(Path.home() / "GitHub/foodBlockChain/fabric/fabric-samples/config"),
    "CORE_PEER_TLS_ENABLED": "true",
    "CORE_PEER_LOCALMSPID": "Org1MSP",
    "CORE_PEER_TLS_ROOTCERT_FILE": str(NETWORK_DIR / "organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"),
    "CORE_PEER_MSPCONFIGPATH": str(NETWORK_DIR / "organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"),
    "CORE_PEER_ADDRESS": "localhost:7051",
}

ORDERER_CA = str(NETWORK_DIR / "organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem")
ORG1_CA = str(NETWORK_DIR / "organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt")
ORG2_CA = str(NETWORK_DIR / "organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt")


def _invoke(function: str, args: list[str]) -> dict:
    args_json = json.dumps({"function": function, "Args": args})
    cmd = [
        "peer", "chaincode", "invoke",
        "-o", "localhost:7050",
        "--ordererTLSHostnameOverride", "orderer.example.com",
        "--tls", "--cafile", ORDERER_CA,
        "-C", "foodchannel", "-n", "foodchain",
        "--peerAddresses", "localhost:7051", "--tlsRootCertFiles", ORG1_CA,
        "--peerAddresses", "localhost:9051", "--tlsRootCertFiles", ORG2_CA,
        "-c", args_json,
    ]
    result = subprocess.run(cmd, env=BASE_ENV, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"Invoke failed: {result.stderr}")
    return {"status": "ok"}


def _query(function: str, args: list[str]) -> dict | list:
    args_json = json.dumps({"function": function, "Args": args})
    cmd = [
        "peer", "chaincode", "query",
        "-C", "foodchannel", "-n", "foodchain",
        "-c", args_json,
    ]
    result = subprocess.run(cmd, env=BASE_ENV, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"Query failed: {result.stderr}")
    return json.loads(result.stdout.strip())


def create_shipment(shipment_id: str, product: str, origin: str, destination: str = "") -> dict:
    return _invoke("CreateShipment", [shipment_id, product, origin, destination])


def record_reading(reading_id: str, shipment_id: str, stage: str,
                   temperature: float, humidity: float, co2: float,
                   vibration: float, vehicle_id: str, location: str) -> dict:
    return _invoke("RecordReading", [
        reading_id, shipment_id, stage,
        str(temperature), str(humidity), str(co2), str(vibration), vehicle_id, location,
    ])


def get_shipment(shipment_id: str) -> dict:
    return _query("GetShipment", [shipment_id])


def get_reading(reading_id: str) -> dict:
    return _query("GetReading", [reading_id])


def get_all_shipments() -> list:
    result = _query("GetAllShipments", [])
    return result if result else []


def get_readings_for_shipment(shipment_id: str) -> list:
    result = _query("GetAllReadingsForShipment", [shipment_id])
    return result if result else []
