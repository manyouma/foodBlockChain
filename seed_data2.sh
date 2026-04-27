#!/bin/bash
# Seeds 6 additional shipments covering all stages and abnormal scenarios.
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

# ── SHIP003: Stuck at farm, all normal ─────────────────────────────────────
echo "==> SHIP003: At farm (just harvested, normal)"
invoke '{"function":"CreateShipment","Args":["SHIP003","Lychee","Zhanjiang Farm, Guangdong"]}'
invoke '{"function":"RecordReading","Args":["R3-001","SHIP003","farm","3.5","90.1","408.0","0.03","Zhanjiang Farm::21.1947::110.3934",""]}'
invoke '{"function":"RecordReading","Args":["R3-002","SHIP003","farm","3.7","89.5","411.0","0.04","Zhanjiang Farm::21.1947::110.3934",""]}'
invoke '{"function":"RecordReading","Args":["R3-003","SHIP003","farm","3.6","90.8","409.0","0.03","Zhanjiang Packing House::21.2050::110.4100",""]}'

# ── SHIP004: In transit, TEMPERATURE SPIKE (abnormal) ──────────────────────
echo "==> SHIP004: On truck — refrigeration failure, temperature spike"
invoke '{"function":"CreateShipment","Args":["SHIP004","Lychee","Shantou Farm, Guangdong"]}'
invoke '{"function":"RecordReading","Args":["R4-001","SHIP004","farm","4.0","88.0","412.0","0.04","Shantou Farm::23.3541::116.6820",""]}'
invoke '{"function":"RecordReading","Args":["R4-002","SHIP004","farm","4.2","87.5","414.0","0.05","Shantou Packing::23.3600::116.6900",""]}'
invoke '{"function":"RecordReading","Args":["R4-003","SHIP004","truck","5.1","85.0","435.0","0.48","Shantou Highway G15::23.5000::116.5000",""]}'
invoke '{"function":"RecordReading","Args":["R4-004","SHIP004","truck","9.4","82.0","442.0","0.52","Jieyang Rest Stop::23.5448::116.3650",""]}'
invoke '{"function":"RecordReading","Args":["R4-005","SHIP004","truck","14.8","78.0","451.0","0.61","Chaozhou Interchange::23.6618::116.6220",""]}'
invoke '{"function":"RecordReading","Args":["R4-006","SHIP004","truck","18.2","74.0","460.0","0.55","Huizhou Checkpoint::23.1115::114.4152",""]}'
invoke '{"function":"RecordReading","Args":["R4-007","SHIP004","truck","11.3","76.5","448.0","0.50","Dongguan Checkpoint::22.7500::113.7500",""]}'

# ── SHIP005: At warehouse, HIGH CO2 (abnormal — poor ventilation) ──────────
echo "==> SHIP005: At warehouse — CO2 buildup anomaly"
invoke '{"function":"CreateShipment","Args":["SHIP005","Lychee","Meizhou Farm, Guangdong"]}'
invoke '{"function":"RecordReading","Args":["R5-001","SHIP005","farm","3.9","88.5","410.0","0.04","Meizhou Farm::24.2881::116.1178",""]}'
invoke '{"function":"RecordReading","Args":["R5-002","SHIP005","truck","4.8","85.0","438.0","0.53","Meizhou Highway::24.0000::115.8000",""]}'
invoke '{"function":"RecordReading","Args":["R5-003","SHIP005","truck","5.2","84.2","445.0","0.60","Heyuan Interchange::23.7292::114.6982",""]}'
invoke '{"function":"RecordReading","Args":["R5-004","SHIP005","warehouse","2.3","91.0","521.0","0.08","Guangzhou Cold Storage Hub::23.1291::113.2644",""]}'
invoke '{"function":"RecordReading","Args":["R5-005","SHIP005","warehouse","2.5","90.5","698.0","0.07","Guangzhou Cold Storage Hub::23.1291::113.2644",""]}'
invoke '{"function":"RecordReading","Args":["R5-006","SHIP005","warehouse","2.4","91.2","1240.0","0.08","Guangzhou Cold Storage Hub::23.1291::113.2644",""]}'
invoke '{"function":"RecordReading","Args":["R5-007","SHIP005","warehouse","2.6","90.8","1580.0","0.09","Guangzhou Cold Storage Hub::23.1291::113.2644",""]}'

# ── SHIP006: At warehouse, all normal ─────────────────────────────────────
echo "==> SHIP006: At warehouse (normal)"
invoke '{"function":"CreateShipment","Args":["SHIP006","Lychee","Qingyuan Farm, Guangdong"]}'
invoke '{"function":"RecordReading","Args":["R6-001","SHIP006","farm","3.8","89.0","411.0","0.04","Qingyuan Farm::23.6843::113.0513",""]}'
invoke '{"function":"RecordReading","Args":["R6-002","SHIP006","truck","4.6","85.5","436.0","0.55","Guangqing Expressway::23.4000::113.1000",""]}'
invoke '{"function":"RecordReading","Args":["R6-003","SHIP006","truck","5.0","84.0","441.0","0.62","Guangzhou North Bypass::23.3000::113.2000",""]}'
invoke '{"function":"RecordReading","Args":["R6-004","SHIP006","warehouse","2.2","91.5","514.0","0.07","Shenzhen Distribution Center::22.5431::114.0579",""]}'
invoke '{"function":"RecordReading","Args":["R6-005","SHIP006","warehouse","2.0","92.0","510.0","0.06","Shenzhen Distribution Center::22.5431::114.0579",""]}'
invoke '{"function":"RecordReading","Args":["R6-006","SHIP006","warehouse","2.1","91.8","512.0","0.07","Shenzhen Distribution Center::22.5431::114.0579",""]}'

# ── SHIP007: At supermarket, HIGH VIBRATION during transit (abnormal) ──────
echo "==> SHIP007: Delivered — vibration damage during transport"
invoke '{"function":"CreateShipment","Args":["SHIP007","Lychee","Foshan Farm, Guangdong"]}'
invoke '{"function":"RecordReading","Args":["R7-001","SHIP007","farm","4.1","87.8","413.0","0.05","Foshan Farm::23.0218::113.1219",""]}'
invoke '{"function":"RecordReading","Args":["R7-002","SHIP007","truck","5.0","84.5","440.0","0.58","Guangfo Expressway::22.9000::113.2000",""]}'
invoke '{"function":"RecordReading","Args":["R7-003","SHIP007","truck","5.4","83.8","446.0","1.82","Nansha Bridge::22.8000::113.5500",""]}'
invoke '{"function":"RecordReading","Args":["R7-004","SHIP007","truck","5.1","84.0","443.0","2.45","Humen Bridge::22.7800::113.6700",""]}'
invoke '{"function":"RecordReading","Args":["R7-005","SHIP007","truck","4.9","84.3","441.0","3.10","Dongguan Bumpy Section::22.7500::113.7500",""]}'
invoke '{"function":"RecordReading","Args":["R7-006","SHIP007","truck","5.2","83.5","444.0","0.61","Shenzhen Border::22.6500::114.0000",""]}'
invoke '{"function":"RecordReading","Args":["R7-007","SHIP007","warehouse","2.3","90.8","516.0","0.08","Shenzhen Distribution Center::22.5431::114.0579",""]}'
invoke '{"function":"RecordReading","Args":["R7-008","SHIP007","supermarket","4.1","80.5","459.0","0.11","RT-Mart Nanshan::22.5300::113.9300",""]}'
invoke '{"function":"RecordReading","Args":["R7-009","SHIP007","supermarket","4.3","80.0","461.0","0.10","RT-Mart Nanshan::22.5300::113.9300",""]}'

# ── SHIP008: At supermarket, all normal ────────────────────────────────────
echo "==> SHIP008: Delivered to supermarket (all normal)"
invoke '{"function":"CreateShipment","Args":["SHIP008","Lychee","Huizhou Farm, Guangdong"]}'
invoke '{"function":"RecordReading","Args":["R8-001","SHIP008","farm","3.7","89.2","410.0","0.04","Huizhou Farm::23.1115::114.4152",""]}'
invoke '{"function":"RecordReading","Args":["R8-002","SHIP008","farm","3.9","88.8","413.0","0.05","Huizhou Packing::23.1200::114.4200",""]}'
invoke '{"function":"RecordReading","Args":["R8-003","SHIP008","truck","4.5","85.8","437.0","0.50","Huizhou Expressway::22.9500::114.2000",""]}'
invoke '{"function":"RecordReading","Args":["R8-004","SHIP008","truck","4.9","84.9","442.0","0.56","Shenzhen Northeast::22.7000::114.1000",""]}'
invoke '{"function":"RecordReading","Args":["R8-005","SHIP008","warehouse","2.1","91.4","511.0","0.07","Shenzhen Distribution Center::22.5431::114.0579",""]}'
invoke '{"function":"RecordReading","Args":["R8-006","SHIP008","warehouse","2.3","90.9","514.0","0.08","Shenzhen Distribution Center::22.5431::114.0579",""]}'
invoke '{"function":"RecordReading","Args":["R8-007","SHIP008","supermarket","3.9","81.0","457.0","0.10","MixC Mall Shenzhen::22.5400::114.0550",""]}'
invoke '{"function":"RecordReading","Args":["R8-008","SHIP008","supermarket","4.0","80.8","455.0","0.11","MixC Mall Shenzhen::22.5400::114.0550",""]}'
invoke '{"function":"RecordReading","Args":["R8-009","SHIP008","supermarket","4.2","80.3","458.0","0.10","MixC Mall Shenzhen::22.5400::114.0550",""]}'

echo ""
echo "Done! SHIP003–SHIP008 created."
echo "  SHIP003: Farm only (normal)"
echo "  SHIP004: In transit — TEMPERATURE SPIKE (refrigeration failure)"
echo "  SHIP005: Warehouse — HIGH CO2 (poor ventilation)"
echo "  SHIP006: Warehouse (normal)"
echo "  SHIP007: Supermarket — HIGH VIBRATION during transit"
echo "  SHIP008: Supermarket (all normal)"
