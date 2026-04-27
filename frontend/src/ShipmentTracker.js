import { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import ShipmentMap from "./ShipmentMap";
import { useLang } from "./LangContext";

const API = "http://localhost:8000";
const STAGES = ["farm", "truck", "warehouse", "supermarket"];
const STAGE_ICONS = { farm: "🌱", truck: "🚚", warehouse: "🏭", supermarket: "🛒" };

function locationName(location) {
  return location.split("::")[0];
}

function VerifiedBadge({ reading, t }) {
  const verified = !!reading.recordedBy;
  return (
    <span
      className={`verify-badge ${verified ? "verify-ok" : "verify-pending"}`}
      title={verified ? t.verifiedTooltip : t.unverifiedTooltip}
    >
      {verified ? t.verifiedBadge : t.unverifiedBadge}
    </span>
  );
}

export default function ShipmentTracker({ shipmentId }) {
  const { t } = useLang();
  const [shipment, setShipment] = useState(null);
  const [readings, setReadings] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      axios.get(`${API}/shipment/${shipmentId}`),
      axios.get(`${API}/shipment/${shipmentId}/readings`),
    ])
      .then(([s, r]) => {
        setShipment(s.data);
        setReadings(r.data || []);
      })
      .catch(() => setError(t.notFound(shipmentId)))
      .finally(() => setLoading(false));
  }, [shipmentId, t]);

  if (loading) return <div className="card">{t.loading}</div>;
  if (error) return <div className="card error">{error}</div>;

  const stagesReached = [...new Set(readings.map(r => r.stage))];
  const verifiedCount = readings.filter(r => !!r.recordedBy).length;

  const chartData = readings.map((r, i) => ({
    name: `${i + 1}`,
    [t.colTemp.replace(" (°C)", "")]: r.temperature,
    [t.colHumidity.replace(" (%)", "").replace("（%）", "")]: r.humidity,
    CO2: r.co2 ?? null,
    [t.colVibration.replace(" (g)", "").replace("（g）", "")]: r.vibration ?? null,
    stage: t.stageLabels[r.stage] || r.stage,
  }));

  const tempKey = t.colTemp.replace(" (°C)", "");
  const humKey = t.colHumidity.replace(" (%)", "").replace("（%）", "");
  const vibKey = t.colVibration.replace(" (g)", "").replace("（g）", "");

  const maxTemp = readings.length ? Math.max(...readings.map(r => r.temperature)) : null;
  const tempOk = maxTemp !== null && maxTemp <= 8;

  return (
    <div>
      {/* Header */}
      <div className="card">
        <div className="shipment-header">
          <div>
            <h3>{shipment.product}</h3>
            <p className="origin">{t.origin}: {shipment.origin}</p>
            <p className="origin">{t.created}: {new Date(shipment.createdAt).toLocaleString()}</p>
            <p className="origin">{t.status}: {shipment.status}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
            <div className={`badge ${tempOk ? "badge-ok" : "badge-warn"}`}>
              {tempOk ? t.coldChainOk : t.coldChainWarn}
            </div>
            <div className="verified-summary">
              <span className="check-icon">✓</span>
              {t.verifiedSummary(verifiedCount, readings.length)}
            </div>
          </div>
        </div>

        {/* Journey progress */}
        <div className="journey">
          {STAGES.map((stage, i) => {
            const reached = stagesReached.includes(stage);
            return (
              <div key={stage} className="journey-step">
                <div className={`step-circle ${reached ? "reached" : ""}`}>
                  {STAGE_ICONS[stage]}
                </div>
                <span className={reached ? "step-label reached" : "step-label"}>
                  {t.stageLabels[stage]}
                </span>
                {i < STAGES.length - 1 && (
                  <div className={`step-line ${reached ? "reached" : ""}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Map */}
      <ShipmentMap readings={readings} t={t} />

      {/* Temp & Humidity chart */}
      {chartData.length > 0 && (
        <>
          <div className="card">
            <h4>{t.chartTempHumidity}</h4>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" label={{ value: t.readingNum, position: "insideBottom", offset: -10 }} />
                <YAxis />
                <Tooltip labelFormatter={(_, p) => p?.[0]?.payload?.stage || ""} />
                <Legend verticalAlign="top" />
                <Line type="monotone" dataKey={tempKey} stroke="#e74c3c" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey={humKey} stroke="#3498db" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h4>{t.chartCO2Vibration}</h4>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" label={{ value: t.readingNum, position: "insideBottom", offset: -10 }} />
                <YAxis yAxisId="co2" orientation="left" />
                <YAxis yAxisId="vib" orientation="right" />
                <Tooltip labelFormatter={(_, p) => p?.[0]?.payload?.stage || ""} />
                <Legend verticalAlign="top" />
                <Line yAxisId="co2" type="monotone" dataKey="CO2" stroke="#f6ad55" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="vib" type="monotone" dataKey={vibKey} stroke="#9f7aea" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Table */}
      {readings.length > 0 && (
        <div className="card">
          <h4>{t.blockchainRecords(readings.length)}</h4>
          <div style={{ overflowX: "auto" }}>
            <table className="readings-table">
              <thead>
                <tr>
                  <th>{t.colNum}</th>
                  <th>{t.colVerified}</th>
                  <th>{t.colStage}</th>
                  <th>{t.colTemp}</th>
                  <th>{t.colHumidity}</th>
                  <th>{t.colCO2}</th>
                  <th>{t.colVibration}</th>
                  <th>{t.colLocation}</th>
                  <th>{t.colRecordedBy}</th>
                  <th>{t.colTime}</th>
                </tr>
              </thead>
              <tbody>
                {readings.map((r, i) => (
                  <tr key={r.id} className={r.temperature > 8 ? "row-warn" : ""}>
                    <td style={{ color: "#a0aec0" }}>{i + 1}</td>
                    <td><VerifiedBadge reading={r} t={t} /></td>
                    <td>{STAGE_ICONS[r.stage]} {t.stageLabels[r.stage] || r.stage}</td>
                    <td>{r.temperature}</td>
                    <td>{r.humidity}</td>
                    <td>{r.co2 ?? "—"}</td>
                    <td>{r.vibration ?? "—"}</td>
                    <td>{locationName(r.location)}</td>
                    <td><code>{r.recordedBy}</code></td>
                    <td>{new Date(r.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {readings.length === 0 && (
        <div className="card">{t.noReadings}</div>
      )}
    </div>
  );
}
