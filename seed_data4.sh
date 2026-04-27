#!/bin/bash
# Seed script for chaincode sequence 5 — includes destination field.
# CreateShipment args: id, product, origin, destination
# RecordReading args: id, shipmentId, stage, temp, humidity, co2, vibration, vehicleId, location
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
  sleep 1
}

echo "==> SHIP011 → Vanguard Supermarket Futian"
invoke '{"function":"CreateShipment","Args":["SHIP011","Lychee","Maoming Farm, Guangdong","Vanguard Supermarket Futian"]}'
invoke '{"function":"RecordReading","Args":["S11-001","SHIP011","farm","3.8","88.5","411.0","0.04","","Maoming Farm::21.6618::110.9253"]}'
invoke '{"function":"RecordReading","Args":["S11-002","SHIP011","truck","4.7","85.0","440.0","0.55","粤B-88821","Maoming Highway S71::22.0000::110.9800"]}'
invoke '{"function":"RecordReading","Args":["S11-003","SHIP011","truck","5.1","84.2","445.0","0.61","粤B-88821","Yunfu Rest Stop::22.9279::111.6933"]}'
invoke '{"function":"RecordReading","Args":["S11-004","SHIP011","warehouse","2.2","91.0","514.0","0.07","","Guangzhou Cold Storage Hub::23.1291::113.2644"]}'
invoke '{"function":"RecordReading","Args":["S11-005","SHIP011","truck","4.5","85.2","439.0","0.53","粤A-32209","Guangshen Expressway::22.9000::113.5000"]}'
invoke '{"function":"RecordReading","Args":["S11-006","SHIP011","supermarket","4.0","80.2","458.0","0.10","","Vanguard Supermarket Futian::22.5200::114.0580"]}'

echo "==> SHIP012 → RT-Mart Nanshan (in transit)"
invoke '{"function":"CreateShipment","Args":["SHIP012","Lychee","Huizhou Farm, Guangdong","RT-Mart Nanshan"]}'
invoke '{"function":"RecordReading","Args":["S12-001","SHIP012","farm","3.9","88.0","412.0","0.04","","Huizhou Farm::23.1115::114.4152"]}'
invoke '{"function":"RecordReading","Args":["S12-002","SHIP012","truck","4.8","84.5","443.0","0.60","粤C-55610","Huizhou Expressway::22.9500::114.2000"]}'
invoke '{"function":"RecordReading","Args":["S12-003","SHIP012","truck","5.2","83.8","447.0","0.65","粤C-55610","Dongguan Checkpoint::22.7500::113.7500"]}'

echo "==> SHIP013 → MixC Mall Shenzhen"
invoke '{"function":"CreateShipment","Args":["SHIP013","Lychee","Qingyuan Farm, Guangdong","MixC Mall Shenzhen"]}'
invoke '{"function":"RecordReading","Args":["S13-001","SHIP013","farm","3.7","89.0","410.0","0.04","","Qingyuan Farm::23.6843::113.0513"]}'
invoke '{"function":"RecordReading","Args":["S13-002","SHIP013","truck","4.9","84.0","442.0","0.58","粤B-71133","Guangqing Expressway::23.4000::113.1000"]}'
invoke '{"function":"RecordReading","Args":["S13-003","SHIP013","warehouse","2.1","91.3","511.0","0.07","","Shenzhen Distribution Center::22.5431::114.0579"]}'
invoke '{"function":"RecordReading","Args":["S13-004","SHIP013","truck","4.4","85.0","438.0","0.50","粤A-19920","Shenzhen Distribution Center::22.5431::114.0579"]}'
invoke '{"function":"RecordReading","Args":["S13-005","SHIP013","supermarket","4.1","80.0","457.0","0.10","","MixC Mall Shenzhen::22.5400::114.0550"]}'

echo "==> SHIP014 → Guangzhou Cold Storage Hub (warehouse destination)"
invoke '{"function":"CreateShipment","Args":["SHIP014","Lychee","Zhanjiang Farm, Guangdong","Guangzhou Cold Storage Hub"]}'
invoke '{"function":"RecordReading","Args":["S14-001","SHIP014","farm","3.6","89.5","409.0","0.03","","Zhanjiang Farm::21.1947::110.3934"]}'
invoke '{"function":"RecordReading","Args":["S14-002","SHIP014","truck","4.6","85.3","436.0","0.54","粤K-00882","Maoming Highway S71::22.0000::110.9800"]}'
invoke '{"function":"RecordReading","Args":["S14-003","SHIP014","warehouse","2.0","92.0","510.0","0.06","","Guangzhou Cold Storage Hub::23.1291::113.2644"]}'

echo ""
echo "Done. SHIP011–014 created with explicit destinations."
