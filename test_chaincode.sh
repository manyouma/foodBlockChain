#!/bin/bash
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

echo "==> Creating shipment SHIP001..."
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "$ORDERER_CA" \
  -C foodchannel -n foodchain \
  --peerAddresses localhost:7051 --tlsRootCertFiles "$ORG1_CA" \
  --peerAddresses localhost:9051 --tlsRootCertFiles "$ORG2_CA" \
  -c '{"function":"CreateShipment","Args":["SHIP001","Lychee","Guangdong Farm, China"]}'

sleep 2

echo ""
echo "==> Recording a sensor reading..."
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "$ORDERER_CA" \
  -C foodchannel -n foodchain \
  --peerAddresses localhost:7051 --tlsRootCertFiles "$ORG1_CA" \
  --peerAddresses localhost:9051 --tlsRootCertFiles "$ORG2_CA" \
  -c '{"function":"RecordReading","Args":["READ001","SHIP001","farm","4.5","85.2","Guangdong Farm",""]}'

sleep 2

echo ""
echo "==> Querying shipment..."
peer chaincode query -C foodchannel -n foodchain \
  -c '{"function":"GetShipment","Args":["SHIP001"]}' | python3 -m json.tool

echo ""
echo "==> Querying sensor reading..."
peer chaincode query -C foodchannel -n foodchain \
  -c '{"function":"GetReading","Args":["READ001"]}' | python3 -m json.tool
