#!/bin/bash
# Re-submit all readings so they get a real TxID under chaincode sequence 6
set -e
NETWORK_DIR="$HOME/GitHub/foodBlockChain/fabric/fabric-samples/test-network"
export PATH="$HOME/GitHub/foodBlockChain/fabric/fabric-samples/bin:$PATH"
export FABRIC_CFG_PATH="$HOME/GitHub/foodBlockChain/fabric/fabric-samples/config/"
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE="$NETWORK_DIR/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
export CORE_PEER_MSPCONFIGPATH="$NETWORK_DIR/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
export CORE_PEER_ADDRESS="localhost:7051"
ORDERER_CA="$NETWORK_DIR/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"
ORG1_CA="$NETWORK_DIR/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
ORG2_CA="$NETWORK_DIR/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt"

invoke() {
  peer chaincode invoke \
    -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
    --tls --cafile "$ORDERER_CA" -C foodchannel -n foodchain \
    --peerAddresses localhost:7051 --tlsRootCertFiles "$ORG1_CA" \
    --peerAddresses localhost:9051 --tlsRootCertFiles "$ORG2_CA" \
    -c "$1" 2>&1 | grep -E "status:|Error" || true
  sleep 0.6
}

python3 - <<'PY'
import urllib.request, json, subprocess, sys

ships = json.loads(urllib.request.urlopen('http://localhost:8000/shipments').read())
for s in ships:
    readings = json.loads(urllib.request.urlopen(f'http://localhost:8000/shipment/{s["id"]}/readings').read())
    print(f'==> Re-submitting {s["id"]} ({len(readings)} readings)', flush=True)
    for r in readings:
        args = json.dumps({
            "function": "RecordReading",
            "Args": [
                r["id"], r["shipmentId"], r["stage"],
                str(r["temperature"]), str(r["humidity"]),
                str(r.get("co2") or 0), str(r.get("vibration") or 0),
                r.get("vehicleId") or "",
                r.get("location") or ""
            ]
        })
        subprocess.run(['bash', '-c', f'''
NETWORK_DIR="$HOME/GitHub/foodBlockChain/fabric/fabric-samples/test-network"
export PATH="$HOME/GitHub/foodBlockChain/fabric/fabric-samples/bin:$PATH"
export FABRIC_CFG_PATH="$HOME/GitHub/foodBlockChain/fabric/fabric-samples/config/"
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE="$NETWORK_DIR/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
export CORE_PEER_MSPCONFIGPATH="$NETWORK_DIR/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
export CORE_PEER_ADDRESS="localhost:7051"
peer chaincode invoke \
  -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "$NETWORK_DIR/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C foodchannel -n foodchain \
  --peerAddresses localhost:7051 --tlsRootCertFiles "$NETWORK_DIR/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 --tlsRootCertFiles "$NETWORK_DIR/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c \'{args}\' 2>&1 | grep -E "status:|Error" || true
sleep 0.6
'''], capture_output=False)
print('Done.')
PY
