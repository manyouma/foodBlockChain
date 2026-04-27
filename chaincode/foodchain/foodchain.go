package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type SmartContract struct {
	contractapi.Contract
}

// A single sensor reading from any point in the supply chain
type SensorReading struct {
	ID          string  `json:"id"`
	ShipmentID  string  `json:"shipmentId"`
	Stage       string  `json:"stage"`
	Temperature float64 `json:"temperature"` // Celsius
	Humidity    float64 `json:"humidity"`    // percent
	CO2         float64 `json:"co2"`
	Vibration   float64 `json:"vibration"`
	VehicleID   string  `json:"vehicleId"`
	Location    string  `json:"location"`
	RecordedBy  string  `json:"recordedBy"`
	Timestamp   string  `json:"timestamp"`
}

// A shipment groups all readings for one batch of lychee
type Shipment struct {
	ID          string `json:"id"`
	Product     string `json:"product"`
	Origin      string `json:"origin"`      // farm the product came from
	Destination string `json:"destination"` // supermarket/warehouse it is headed to
	CreatedAt   string `json:"createdAt"`
	Status      string `json:"status"` // "in_transit", "delivered"
}

func (s *SmartContract) CreateShipment(ctx contractapi.TransactionContextInterface, id string, product string, origin string, destination string) error {
	existing, err := ctx.GetStub().GetState(id)
	if err != nil {
		return fmt.Errorf("failed to read state: %v", err)
	}
	if existing != nil {
		return fmt.Errorf("shipment %s already exists", id)
	}

	shipment := Shipment{
		ID:          id,
		Product:     product,
		Origin:      origin,
		Destination: destination,
		CreatedAt:   time.Now().UTC().Format(time.RFC3339),
		Status:      "in_transit",
	}
	data, _ := json.Marshal(shipment)
	return ctx.GetStub().PutState("SHIPMENT_"+id, data)
}

func (s *SmartContract) RecordReading(ctx contractapi.TransactionContextInterface, id string, shipmentID string, stage string, temperature float64, humidity float64, co2 float64, vibration float64, vehicleID string, location string) error {
	mspID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get caller identity: %v", err)
	}

	reading := SensorReading{
		ID:          id,
		ShipmentID:  shipmentID,
		Stage:       stage,
		Temperature: temperature,
		Humidity:    humidity,
		CO2:         co2,
		Vibration:   vibration,
		VehicleID:   vehicleID,
		Location:    location,
		RecordedBy:  mspID,
		Timestamp:   time.Now().UTC().Format(time.RFC3339),
	}
	data, _ := json.Marshal(reading)
	return ctx.GetStub().PutState("READING_"+id, data)
}

func (s *SmartContract) GetShipment(ctx contractapi.TransactionContextInterface, id string) (*Shipment, error) {
	data, err := ctx.GetStub().GetState("SHIPMENT_" + id)
	if err != nil || data == nil {
		return nil, fmt.Errorf("shipment %s not found", id)
	}
	var shipment Shipment
	json.Unmarshal(data, &shipment)
	return &shipment, nil
}

func (s *SmartContract) GetReading(ctx contractapi.TransactionContextInterface, id string) (*SensorReading, error) {
	data, err := ctx.GetStub().GetState("READING_" + id)
	if err != nil || data == nil {
		return nil, fmt.Errorf("reading %s not found", id)
	}
	var reading SensorReading
	json.Unmarshal(data, &reading)
	return &reading, nil
}

func (s *SmartContract) GetAllReadingsForShipment(ctx contractapi.TransactionContextInterface, shipmentID string) ([]*SensorReading, error) {
	iterator, err := ctx.GetStub().GetStateByRange("READING_", "READING_~")
	if err != nil {
		return nil, err
	}
	defer iterator.Close()

	var results []*SensorReading
	for iterator.HasNext() {
		item, err := iterator.Next()
		if err != nil {
			continue
		}
		var reading SensorReading
		json.Unmarshal(item.Value, &reading)
		if reading.ShipmentID == shipmentID {
			results = append(results, &reading)
		}
	}
	return results, nil
}

func (s *SmartContract) GetAllShipments(ctx contractapi.TransactionContextInterface) ([]*Shipment, error) {
	iterator, err := ctx.GetStub().GetStateByRange("SHIPMENT_", "SHIPMENT_~")
	if err != nil {
		return nil, err
	}
	defer iterator.Close()

	var results []*Shipment
	for iterator.HasNext() {
		item, err := iterator.Next()
		if err != nil {
			continue
		}
		var shipment Shipment
		json.Unmarshal(item.Value, &shipment)
		results = append(results, &shipment)
	}
	return results, nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(&SmartContract{})
	if err != nil {
		panic(fmt.Sprintf("Error creating chaincode: %v", err))
	}
	if err := chaincode.Start(); err != nil {
		panic(fmt.Sprintf("Error starting chaincode: %v", err))
	}
}
