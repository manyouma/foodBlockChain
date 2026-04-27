#!/bin/bash
# Seeds shipments using the new chaincode (sequence 4) with vehicleId field.
# Args order: id, shipmentId, stage, temp, humidity, co2, vibration, vehicleId, location
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

echo "==> SHIP009: Full journey, truck 粤B-88821, destination: 华润万家·福田店"
invoke '{"function":"CreateShipment","Args":["SHIP009","Lychee","Maoming Farm, Guangdong"]}'
invoke '{"function":"RecordReading","Args":["R9-001","SHIP009","farm","3.8","88.5","411.0","0.04","","Maoming Farm::21.6618::110.9253"]}'
invoke '{"function":"RecordReading","Args":["R9-002","SHIP009","farm","4.0","87.8","413.0","0.05","","Maoming Packing House::21.6750::110.9400"]}'
invoke '{"function":"RecordReading","Args":["R9-003","SHIP009","truck","4.6","85.2","437.0","0.52","粤B-88821","Maoming Highway S71::22.0000::110.9800"]}'
invoke '{"function":"RecordReading","Args":["R9-004","SHIP009","truck","5.0","84.5","443.0","0.60","粤B-88821","Yunfu Rest Stop::22.9279::111.6933"]}'
invoke '{"function":"RecordReading","Args":["R9-005","SHIP009","truck","5.3","83.9","446.0","0.58","粤B-88821","Foshan Interchange::23.0218::113.1219"]}'
invoke '{"function":"RecordReading","Args":["R9-006","SHIP009","warehouse","2.2","91.0","514.0","0.07","","Guangzhou Cold Storage Hub::23.1291::113.2644"]}'
invoke '{"function":"RecordReading","Args":["R9-007","SHIP009","warehouse","2.0","91.5","510.0","0.06","","Guangzhou Cold Storage Hub::23.1291::113.2644"]}'
invoke '{"function":"RecordReading","Args":["R9-008","SHIP009","truck","4.5","85.0","440.0","0.55","粤A-32209","Guangshen Expressway::22.9000::113.5000"]}'
invoke '{"function":"RecordReading","Args":["R9-009","SHIP009","truck","4.8","84.3","444.0","0.62","粤A-32209","Dongguan Checkpoint::22.7500::113.7500"]}'
invoke '{"function":"RecordReading","Args":["R9-010","SHIP009","supermarket","4.0","80.2","458.0","0.10","","Vanguard Supermarket Futian::22.5200::114.0580"]}'
invoke '{"function":"RecordReading","Args":["R9-011","SHIP009","supermarket","4.2","79.8","460.0","0.11","","Vanguard Supermarket Futian::22.5200::114.0580"]}'

echo "==> SHIP010: Two trucks, destination: 大润发·南山店"
invoke '{"function":"CreateShipment","Args":["SHIP010","Lychee","Huizhou Farm, Guangdong"]}'
invoke '{"function":"RecordReading","Args":["R10-001","SHIP010","farm","3.9","88.0","412.0","0.04","","Huizhou Farm::23.1115::114.4152"]}'
invoke '{"function":"RecordReading","Args":["R10-002","SHIP010","truck","4.7","84.8","441.0","0.57","粤C-55610","Huizhou Expressway::22.9500::114.2000"]}'
invoke '{"function":"RecordReading","Args":["R10-003","SHIP010","truck","5.1","84.0","446.0","0.65","粤C-55610","Shenzhen Northeast::22.7000::114.1000"]}'
invoke '{"function":"RecordReading","Args":["R10-004","SHIP010","warehouse","2.3","90.5","516.0","0.08","","Shenzhen Distribution Center::22.5431::114.0579"]}'
invoke '{"function":"RecordReading","Args":["R10-005","SHIP010","truck","4.4","85.2","438.0","0.48","粤B-71133","Shenzhen Distribution Center::22.5431::114.0579"]}'
invoke '{"function":"RecordReading","Args":["R10-006","SHIP010","supermarket","4.1","80.0","457.0","0.10","","RT-Mart Nanshan::22.5300::113.9300"]}'
invoke '{"function":"RecordReading","Args":["R10-007","SHIP010","supermarket","4.3","79.5","459.0","0.09","","RT-Mart Nanshan::22.5300::113.9300"]}'

echo ""
echo "SHIP009 and SHIP010 created with truck plate numbers."
echo "Trucks used: 粤B-88821, 粤A-32209, 粤C-55610, 粤B-71133"
