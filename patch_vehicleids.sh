#!/bin/bash
# Patch missing vehicleId fields — re-submits truck readings with same ID (PutState overwrites)
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
  sleep 0.8
}

echo "==> Patching SHIP001 truck readings (粤A-12305)"
invoke '{"function":"RecordReading","Args":["R1-002","SHIP001","truck","5.2","84","439","0.61","粤A-12305","Guangdong Highway::23.5000::113.5000"]}'
invoke '{"function":"RecordReading","Args":["R1-005","SHIP001","truck","4.9","84.5","446","0.68","粤A-12305","Shenzhen North::22.6273::114.0579"]}'

echo "==> Patching SHIP002 truck readings (粤B-55512)"
invoke '{"function":"RecordReading","Args":["R2-004","SHIP002","truck","4.5","86","430","0.42","粤B-55512","Maoming Highway S71::22.0000::110.9800"]}'
invoke '{"function":"RecordReading","Args":["R2-005","SHIP002","truck","5.1","85.3","445","0.58","粤B-55512","Yunfu Rest Stop::22.9279::111.6933"]}'
invoke '{"function":"RecordReading","Args":["R2-006","SHIP002","truck","4.8","84.7","438","0.51","粤B-55512","Foshan Interchange::23.0218::113.1219"]}'
invoke '{"function":"RecordReading","Args":["R2-007","SHIP002","truck","5.3","83.9","452","0.63","粤B-55512","Guangzhou Ring Road::23.1291::113.2644"]}'
invoke '{"function":"RecordReading","Args":["R2-011","SHIP002","truck","4.2","85","441","0.55","粤B-55512","Guangshen Expressway::22.9000::113.5000"]}'
invoke '{"function":"RecordReading","Args":["R2-012","SHIP002","truck","4.7","84.2","448","0.72","粤B-55512","Dongguan Checkpoint::22.7500::113.7500"]}'
invoke '{"function":"RecordReading","Args":["R2-013","SHIP002","truck","5","83.5","443","0.49","粤B-55512","Shenzhen North::22.6273::114.0579"]}'

echo "==> Patching SHIP004 truck readings (粤D-77301)"
invoke '{"function":"RecordReading","Args":["R4-003","SHIP004","truck","5.1","85","435","0.48","粤D-77301","Shantou Highway G15::23.5000::116.5000"]}'
invoke '{"function":"RecordReading","Args":["R4-004","SHIP004","truck","9.4","82","442","0.52","粤D-77301","Jieyang Rest Stop::23.5448::116.3650"]}'
invoke '{"function":"RecordReading","Args":["R4-005","SHIP004","truck","14.8","78","451","0.61","粤D-77301","Chaozhou Interchange::23.6618::116.6220"]}'
invoke '{"function":"RecordReading","Args":["R4-006","SHIP004","truck","18.2","74","460","0.55","粤D-77301","Huizhou Checkpoint::23.1115::114.4152"]}'
invoke '{"function":"RecordReading","Args":["R4-007","SHIP004","truck","11.3","76.5","448","0.5","粤D-77301","Dongguan Checkpoint::22.7500::113.7500"]}'

echo "==> Patching SHIP005 truck readings (粤M-44208)"
invoke '{"function":"RecordReading","Args":["R5-002","SHIP005","truck","4.8","85","438","0.53","粤M-44208","Meizhou Highway::24.0000::115.8000"]}'
invoke '{"function":"RecordReading","Args":["R5-003","SHIP005","truck","5.2","84.2","445","0.6","粤M-44208","Heyuan Interchange::23.7292::114.6982"]}'

echo "==> Patching SHIP006 truck readings (粤B-91642)"
invoke '{"function":"RecordReading","Args":["R6-002","SHIP006","truck","4.6","85.5","436","0.55","粤B-91642","Guangqing Expressway::23.4000::113.1000"]}'
invoke '{"function":"RecordReading","Args":["R6-003","SHIP006","truck","5","84","441","0.62","粤B-91642","Guangzhou North Bypass::23.3000::113.2000"]}'

echo "==> Patching SHIP007 truck readings (粤A-28819)"
invoke '{"function":"RecordReading","Args":["R7-002","SHIP007","truck","5","84.5","440","0.58","粤A-28819","Guangfo Expressway::22.9000::113.2000"]}'
invoke '{"function":"RecordReading","Args":["R7-003","SHIP007","truck","5.4","83.8","446","1.82","粤A-28819","Nansha Bridge::22.8000::113.5500"]}'
invoke '{"function":"RecordReading","Args":["R7-004","SHIP007","truck","5.1","84","443","2.45","粤A-28819","Humen Bridge::22.7800::113.6700"]}'
invoke '{"function":"RecordReading","Args":["R7-005","SHIP007","truck","4.9","84.3","441","3.1","粤A-28819","Dongguan Bumpy Section::22.7500::113.7500"]}'
invoke '{"function":"RecordReading","Args":["R7-006","SHIP007","truck","5.2","83.5","444","0.61","粤A-28819","Shenzhen Border::22.6500::114.0000"]}'

echo "==> Patching SHIP008 truck readings (粤C-66710)"
invoke '{"function":"RecordReading","Args":["R8-003","SHIP008","truck","4.5","85.8","437","0.5","粤C-66710","Huizhou Expressway::22.9500::114.2000"]}'
invoke '{"function":"RecordReading","Args":["R8-004","SHIP008","truck","4.9","84.9","442","0.56","粤C-66710","Shenzhen Northeast::22.7000::114.1000"]}'

echo ""
echo "Done. All 25 records patched with vehicleId."
