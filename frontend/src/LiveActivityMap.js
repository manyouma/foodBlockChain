import { useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLang } from "./LangContext";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const STAGE_COLORS = { farm: "#10b981", truck: "#f59e0b", warehouse: "#3b82f6", supermarket: "#8b5cf6" };
const STAGE_ICONS = { farm: "🌱", truck: "🚚", warehouse: "🏭", supermarket: "🛒" };
const THRESHOLDS = { temp: 8, co2: 1000, vibration: 1.5 };

function isAnomaly(r) {
  return r.temperature > THRESHOLDS.temp || r.co2 > THRESHOLDS.co2 || r.vibration > THRESHOLDS.vibration;
}

function parseCoords(location) {
  const parts = (location || "").split("::");
  if (parts.length === 3) {
    const lat = parseFloat(parts[1]), lng = parseFloat(parts[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { name: parts[0], lat, lng };
  }
  return null;
}

// Custom pulsing DivIcon for alert markers
function pulseIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div class="pulse-wrap" style="--pc:${color}"><div class="pulse-core"></div><div class="pulse-ring"></div></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export default function LiveActivityMap({ enriched }) {
  const { t } = useLang();

  // Flatten all readings, sort newest first, take 30
  const allReadings = useMemo(() => {
    const flat = enriched.flatMap(s =>
      s.readings.map(r => ({ ...r, shipmentId: s.id, destination: s.destination }))
    );
    flat.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return flat.slice(0, 30);
  }, [enriched]);

  // Map-ready points
  const points = useMemo(() =>
    allReadings
      .map(r => ({ ...r, coords: parseCoords(r.location) }))
      .filter(r => r.coords),
    [allReadings]
  );

  // Per-shipment polylines (only from latest-30 points)
  const polylines = useMemo(() => {
    const byShipment = {};
    points.forEach(p => {
      if (!byShipment[p.shipmentId]) byShipment[p.shipmentId] = [];
      byShipment[p.shipmentId].push([p.coords.lat, p.coords.lng]);
    });
    return Object.entries(byShipment).map(([id, latlngs]) => ({ id, latlngs }));
  }, [points]);

  const center = points.length
    ? [
        points.reduce((s, p) => s + p.coords.lat, 0) / points.length,
        points.reduce((s, p) => s + p.coords.lng, 0) / points.length,
      ]
    : [22.8, 113.0];

  // KPI overlay data
  const alertCount = enriched.filter(s => s.alerts.size > 0).length;
  const inTransitCount = enriched.filter(s => s.currentStage === "truck").length;
  const verifiedCount = enriched.reduce((n, s) => n + s.readings.filter(r => !!r.recordedBy).length, 0);

  return (
    <div className="hero-wrap">
      <MapContainer
        center={center} zoom={7}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={false}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Route lines per shipment */}
        {polylines.map(({ id, latlngs }) => (
          <Polyline key={id} positions={latlngs}
            pathOptions={{ color: "#94a3b8", weight: 1.5, dashArray: "5 4", opacity: 0.5 }} />
        ))}

        {/* Regular readings */}
        {points.filter(p => !isAnomaly(p)).map((p, i) => {
          const age = i; // 0 = newest
          const radius = Math.max(5, 11 - age * 0.3);
          return (
            <CircleMarker key={p.id} center={[p.coords.lat, p.coords.lng]}
              radius={radius}
              pathOptions={{
                color: "#fff", weight: 1.5,
                fillColor: STAGE_COLORS[p.stage] || "#64748b",
                fillOpacity: Math.max(0.45, 0.95 - age * 0.02),
              }}>
              <Popup minWidth={190}><ReadingPopup p={p} t={t} /></Popup>
            </CircleMarker>
          );
        })}

        {/* Alert readings — pulsing divIcon */}
        {points.filter(isAnomaly).map(p => (
          <Marker key={`alert-${p.id}`}
            position={[p.coords.lat, p.coords.lng]}
            icon={pulseIcon("#ef4444")}>
            <Popup minWidth={190}><ReadingPopup p={p} t={t} anomaly /></Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Glassmorphism KPI strip */}
      <div className="hero-kpi-strip">
        <KpiPill icon="📦" value={enriched.length} label={t.kpiTotal} />
        <div className="hero-kpi-divider" />
        <KpiPill icon="🚚" value={inTransitCount} label={t.kpiTransit} accent="#f59e0b" />
        <div className="hero-kpi-divider" />
        <KpiPill icon="⚠️" value={alertCount} label={t.kpiAlerts} accent={alertCount > 0 ? "#ef4444" : "#10b981"} />
        <div className="hero-kpi-divider" />
        <KpiPill icon="🔗" value={verifiedCount} label={t.kpiVerified} accent="#10b981" />
        <div className="hero-kpi-divider" />
        <KpiPill icon="📍" value={points.length} label={t.liveReadings} accent="#8b5cf6" />
      </div>

      {/* Stage legend — top right */}
      <div className="hero-legend">
        {Object.entries(STAGE_COLORS).map(([stage, color]) => (
          <span key={stage} className="hero-legend-item">
            <span className="hero-legend-dot" style={{ background: color }} />
            {t.stageLabels[stage]}
          </span>
        ))}
        <span className="hero-legend-item">
          <span className="hero-legend-dot pulse-preview" />
          {t.alertLabel}
        </span>
      </div>

      {/* Live badge */}
      <div className="hero-live-badge">
        <span className="live-dot" />
        {t.liveLabel}
      </div>
    </div>
  );
}

function KpiPill({ icon, value, label, accent = "#fff" }) {
  return (
    <div className="hero-kpi-pill">
      <span className="hero-kpi-icon">{icon}</span>
      <span className="hero-kpi-val" style={{ color: accent }}>{value}</span>
      <span className="hero-kpi-lbl">{label}</span>
    </div>
  );
}

function ReadingPopup({ p, t, anomaly }) {
  return (
    <div className="map-popup">
      <div className="popup-header">
        {STAGE_ICONS[p.stage]} <strong>{t.stageLabels[p.stage]}</strong>
        <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "#64748b" }}>{p.shipmentId}</span>
        {p.recordedBy && <span className="popup-verified" title={t.verifiedTooltip}>✓</span>}
      </div>
      <table className="popup-table">
        <tbody>
          <tr><td>📍</td><td>{t.locationName(p.coords.name)}</td></tr>
          <tr><td>🌡</td><td style={{ color: p.temperature > THRESHOLDS.temp ? "#ef4444" : "inherit", fontWeight: anomaly ? 700 : 400 }}>{p.temperature}°C</td></tr>
          <tr><td>💧</td><td>{p.humidity}%</td></tr>
          {p.co2 != null && <tr><td>🌿</td><td style={{ color: p.co2 > THRESHOLDS.co2 ? "#ef4444" : "inherit" }}>{p.co2} ppm</td></tr>}
          {p.vibration != null && <tr><td>📳</td><td style={{ color: p.vibration > THRESHOLDS.vibration ? "#ef4444" : "inherit" }}>{p.vibration} g</td></tr>}
          {p.vehicleId && <tr><td>🚚</td><td><code>{p.vehicleId}</code></td></tr>}
          {p.destination && <tr><td>🏪</td><td>{t.locationName(p.destination)}</td></tr>}
          <tr><td>🕐</td><td>{new Date(p.timestamp).toLocaleString()}</td></tr>
        </tbody>
      </table>
    </div>
  );
}
