/**
 * API abstraction layer.
 * - In development (REACT_APP_API_URL set or localhost): calls the FastAPI backend.
 * - On GitHub Pages or when backend is unreachable: falls back to /demo-data.json.
 */

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

let _demoData = null;
async function loadDemo() {
  if (_demoData) return _demoData;
  const base = process.env.PUBLIC_URL || "";
  const res = await fetch(`${base}/demo-data.json`);
  _demoData = await res.json();
  return _demoData;
}

async function apiFetch(path) {
  try {
    const res = await fetch(`${API_URL}${path}`);
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  } catch {
    return null; // signal fallback
  }
}

export async function getShipments() {
  const data = await apiFetch("/shipments");
  if (data) return data;
  const demo = await loadDemo();
  return demo.shipments;
}

export async function getShipment(id) {
  const data = await apiFetch(`/shipment/${id}`);
  if (data) return data;
  const demo = await loadDemo();
  return demo.shipments.find(s => s.id === id) || null;
}

export async function getReadings(shipmentId) {
  const data = await apiFetch(`/shipment/${shipmentId}/readings`);
  if (data) return data;
  const demo = await loadDemo();
  return demo.readings[shipmentId] || [];
}

export async function getTwin(shipmentId) {
  const data = await apiFetch(`/shipment/${shipmentId}/twin`);
  if (data) return data;
  const demo = await loadDemo();
  return demo.twins?.[shipmentId] || null;
}
