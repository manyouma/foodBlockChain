#!/bin/bash
# Seeds realistic lychee cold-chain data with temperature, humidity, CO2, and vibration.
# Location format: "Name::lat::lng"
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
    --tls --cafile "$ORDERER_CA" \
    -C foodchannel -n foodchain \
    --peerAddresses localhost:7051 --tlsRootCertFiles "$ORG1_CA" \
    --peerAddresses localhost:9051 --tlsRootCertFiles "$ORG2_CA" \
    -c "$1" 2>&1 | grep -E "status:|Error" || true
  sleep 1
}

# Args order: id, shipmentId, stage, temperature, humidity, co2, vibration, location

echo "==> Creating shipment SHIP002..."
invoke '{"function":"CreateShipment","Args":["SHIP002","Lychee","Maoming Farm, Guangdong"]}'

echo "==> Farm readings (low temp, low CO2, minimal vibration)"
invoke '{"function":"RecordReading","Args":["R2-001","SHIP002","farm","3.8","88.0","412.0","0.05","Maoming Farm::21.6618::110.9253",""]}'
invoke '{"function":"RecordReading","Args":["R2-002","SHIP002","farm","4.1","87.5","415.0","0.04","Maoming Farm::21.6618::110.9253",""]}'
invoke '{"function":"RecordReading","Args":["R2-003","SHIP002","farm","3.9","89.2","410.0","0.06","Maoming Packing House::21.6750::110.9400",""]}'

echo "==> Truck readings (higher vibration on the road)"
invoke '{"function":"RecordReading","Args":["R2-004","SHIP002","truck","4.5","86.0","430.0","0.42","Maoming Highway S71::22.0000::110.9800",""]}'
invoke '{"function":"RecordReading","Args":["R2-005","SHIP002","truck","5.1","85.3","445.0","0.58","Yunfu Rest Stop::22.9279::111.6933",""]}'
invoke '{"function":"RecordReading","Args":["R2-006","SHIP002","truck","4.8","84.7","438.0","0.51","Foshan Interchange::23.0218::113.1219",""]}'
invoke '{"function":"RecordReading","Args":["R2-007","SHIP002","truck","5.3","83.9","452.0","0.63","Guangzhou Ring Road::23.1291::113.2644",""]}'

echo "==> Warehouse readings (very cold, CO2 slightly elevated from produce respiration)"
invoke '{"function":"RecordReading","Args":["R2-008","SHIP002","warehouse","2.1","91.0","520.0","0.08","Guangzhou Cold Storage Hub::23.1291::113.2644",""]}'
invoke '{"function":"RecordReading","Args":["R2-009","SHIP002","warehouse","2.3","90.5","515.0","0.07","Guangzhou Cold Storage Hub::23.1291::113.2644",""]}'
invoke '{"function":"RecordReading","Args":["R2-010","SHIP002","warehouse","2.0","92.1","510.0","0.06","Guangzhou Cold Storage Hub::23.1291::113.2644",""]}'

echo "==> Truck to Shenzhen (vibration spikes on highway)"
invoke '{"function":"RecordReading","Args":["R2-011","SHIP002","truck","4.2","85.0","441.0","0.55","Guangshen Expressway::22.9000::113.5000",""]}'
invoke '{"function":"RecordReading","Args":["R2-012","SHIP002","truck","4.7","84.2","448.0","0.72","Dongguan Checkpoint::22.7500::113.7500",""]}'
invoke '{"function":"RecordReading","Args":["R2-013","SHIP002","truck","5.0","83.5","443.0","0.49","Shenzhen North::22.6273::114.0579",""]}'

echo "==> Shenzhen distribution warehouse"
invoke '{"function":"RecordReading","Args":["R2-014","SHIP002","warehouse","2.5","90.0","518.0","0.09","Shenzhen Distribution Center::22.5431::114.0579",""]}'
invoke '{"function":"RecordReading","Args":["R2-015","SHIP002","warehouse","2.2","91.3","512.0","0.07","Shenzhen Distribution Center::22.5431::114.0579",""]}'

echo "==> Supermarket"
invoke '{"function":"RecordReading","Args":["R2-016","SHIP002","supermarket","4.0","80.0","460.0","0.11","Vanguard Supermarket Futian::22.5200::114.0580",""]}'
invoke '{"function":"RecordReading","Args":["R2-017","SHIP002","supermarket","4.2","79.5","458.0","0.10","Vanguard Supermarket Futian::22.5200::114.0580",""]}'

echo ""
echo "==> Adding more readings to SHIP001..."
invoke '{"function":"RecordReading","Args":["R1-002","SHIP001","truck","5.2","84.0","439.0","0.61","Guangdong Highway::23.5000::113.5000",""]}'
invoke '{"function":"RecordReading","Args":["R1-003","SHIP001","warehouse","2.4","90.8","517.0","0.08","Guangzhou Cold Storage Hub::23.1291::113.2644",""]}'
invoke '{"function":"RecordReading","Args":["R1-004","SHIP001","warehouse","2.1","91.5","511.0","0.07","Guangzhou Cold Storage Hub::23.1291::113.2644",""]}'
invoke '{"function":"RecordReading","Args":["R1-005","SHIP001","truck","4.9","84.5","446.0","0.68","Shenzhen North::22.6273::114.0579",""]}'
invoke '{"function":"RecordReading","Args":["R1-006","SHIP001","supermarket","4.3","80.2","461.0","0.12","Vanguard Supermarket Futian::22.5200::114.0580",""]}'

echo ""
echo "All done! Try SHIP001 and SHIP002 in the dashboard."
