import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const STAGE_COLORS = {
  farm: "#48bb78",
  truck: "#ed8936",
  warehouse: "#4299e1",
  supermarket: "#9f7aea",
};
const STAGE_ICONS = { farm: "🌱", truck: "🚚", warehouse: "🏭", supermarket: "🛒" };

function parseCoords(location) {
  const parts = location.split("::");
  if (parts.length === 3) {
    const lat = parseFloat(parts[1]);
    const lng = parseFloat(parts[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { name: parts[0], lat, lng };
  }
  return null;
}

function ReadingPopup({ p, t }) {
  const stageLabel = t?.stageLabels?.[p.stage] || p.stage;
  return (
    <div className="map-popup">
      <div className="popup-header">
        {STAGE_ICONS[p.stage]} <strong>{stageLabel}</strong>
        {p.recordedBy && (
          <span className="popup-verified" title={t?.verifiedTooltip}>✓</span>
        )}
      </div>
      <table className="popup-table">
        <tbody>
          <tr><td>📍</td><td>{t?.locationName ? t.locationName(p.name) : p.name}</td></tr>
          <tr><td>🌡</td><td>{p.temperature}°C</td></tr>
          <tr><td>💧</td><td>{p.humidity}%</td></tr>
          {p.co2 != null && <tr><td>🌿</td><td>{p.co2} ppm CO₂</td></tr>}
          {p.vibration != null && <tr><td>📳</td><td>{p.vibration} g</td></tr>}
          {p.recordedBy && <tr><td>🏢</td><td><code>{p.recordedBy}</code></td></tr>}
          {p.timestamp && (
            <tr><td>🕐</td><td>{new Date(p.timestamp).toLocaleString()}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function ShipmentMap({ readings, t }) {
  const points = readings
    .map(r => ({ ...parseCoords(r.location), ...r }))
    .filter(p => p && p.lat != null);

  if (points.length === 0) return null;

  const center = [
    points.reduce((s, p) => s + p.lat, 0) / points.length,
    points.reduce((s, p) => s + p.lng, 0) / points.length,
  ];
  const polyline = points.map(p => [p.lat, p.lng]);

  // One named marker per unique lat/lng (the first reading at that location)
  const seen = new Set();
  const stops = points.filter(p => {
    const key = `${p.lat},${p.lng}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <div className="card">
      <h4>{t?.journeyMap || "Journey Map"}</h4>
      <MapContainer center={center} zoom={7} style={{ height: 400, borderRadius: 8 }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Polyline positions={polyline} color="#718096" weight={2} dashArray="6 4" />

        {/* Every reading = a coloured dot with full popup */}
        {points.map((p, i) => (
          <CircleMarker
            key={i}
            center={[p.lat, p.lng]}
            radius={7}
            pathOptions={{
              color: STAGE_COLORS[p.stage] || "#718096",
              fillColor: STAGE_COLORS[p.stage] || "#718096",
              fillOpacity: 0.85,
              weight: p.recordedBy ? 2 : 1,
            }}
          >
            <Popup minWidth={200}>
              <ReadingPopup p={p} t={t} />
            </Popup>
          </CircleMarker>
        ))}

        {/* Named pin markers at each unique stop */}
        {stops.map((p, i) => (
          <Marker key={`stop-${i}`} position={[p.lat, p.lng]}>
            <Popup minWidth={200}>
              <ReadingPopup p={p} t={t} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="map-legend">
        {Object.entries(STAGE_COLORS).map(([stage, color]) => (
          <span key={stage} className="legend-item">
            <span className="legend-dot" style={{ background: color }} />
            {t?.stageLabels?.[stage] || stage}
          </span>
        ))}
      </div>
    </div>
  );
}
