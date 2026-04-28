import { useEffect, useState } from "react";
import { getShipment, getReadings } from "./api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import ShipmentMap from "./ShipmentMap";
import BlockchainDetail from "./BlockchainDetail";
import DigitalTwin from "./DigitalTwin";
import { useLang } from "./LangContext";

const STAGES = ["farm", "truck", "warehouse", "supermarket"];
const STAGE_ICONS = { farm: "🌱", truck: "🚚", warehouse: "🏭", supermarket: "🛒" };
const THRESHOLDS = { temp: 8, co2: 1000, vibration: 1.5 };

function statVal(readings, key, fn) {
  if (!readings.length) return "—";
  return fn(readings.map(r => r[key])).toFixed(1);
}

export default function ShipmentTracker({ shipmentId, onBack }) {
  const { t } = useLang();
  const [shipment, setShipment] = useState(null);
  const [readings, setReadings] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true); setError(null);
    Promise.all([
      getShipment(shipmentId),
      getReadings(shipmentId),
    ])
      .then(([s, r]) => {
        if (!s) throw new Error("not found");
        setShipment(s); setReadings(r || []);
      })
      .catch(() => setError(t.notFound(shipmentId)))
      .finally(() => setLoading(false));
  }, [shipmentId, t]);

  if (loading) return <div className="dashboard-shell"><div className="section-loading">{t.loading}</div></div>;
  if (error) return <div className="dashboard-shell"><div className="empty-state error-state">{error}</div></div>;

  const stagesReached = [...new Set(readings.map(r => r.stage))];
  const verifiedCount = readings.filter(r => !!r.recordedBy).length;
  const maxTemp = readings.length ? Math.max(...readings.map(r => r.temperature)) : null;
  const tempOk = maxTemp === null || maxTemp <= THRESHOLDS.temp;

  const chartData = readings.map((r, i) => ({
    n: i + 1,
    Temp: r.temperature,
    Humidity: r.humidity,
    CO2: r.co2 ?? null,
    Vibration: r.vibration ?? null,
    stage: t.stageLabels[r.stage] || r.stage,
  }));

  const locName = (loc) => t.locationName(loc.split("::")[0]);

  return (
    <div className="dashboard-shell">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <button className="back-btn" onClick={onBack}>{t.back}</button>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-cur">{t.shipmentId} {shipmentId}</span>
      </div>

      {/* Title row */}
      <div className="tracker-title-row">
        <div>
          <h2 className="tracker-title">{t.productName(shipment.product)} — {shipmentId}</h2>
          <p className="tracker-sub">
        🌱 {t.locationName(shipment.origin)}
        {shipment.destination && <> <span style={{color:"#cbd5e1"}}>→</span> 🏪 {t.locationName(shipment.destination)}</>}
        {" · "}{t.created}: {new Date(shipment.createdAt).toLocaleDateString()}
      </p>
        </div>
        <div className="tracker-badges">
          <span className={`status-badge ${tempOk ? "badge-ok" : "badge-warn"}`}>
            {tempOk ? "✓ " + t.coldChainOk : "⚠ " + t.coldChainWarn}
          </span>
          <span className="verified-pill">🔗 {t.verifiedSummary(verifiedCount, readings.length)}</span>
        </div>
      </div>

      {/* KPI strip */}
      <div className="tracker-kpis">
        <div className="tkpi"><span className="tkpi-v">{maxTemp !== null ? maxTemp.toFixed(1) + "°C" : "—"}</span><span className="tkpi-l">{t.kpiMaxTemp}</span></div>
        <div className="tkpi"><span className="tkpi-v">{statVal(readings, "humidity", vals => Math.max(...vals))}%</span><span className="tkpi-l">{t.kpiMaxHumidity}</span></div>
        <div className="tkpi"><span className="tkpi-v">{statVal(readings, "co2", vals => Math.max(...vals))}</span><span className="tkpi-l">{t.kpiMaxCO2}</span></div>
        <div className="tkpi"><span className="tkpi-v">{statVal(readings, "vibration", vals => Math.max(...vals))}g</span><span className="tkpi-l">{t.kpiMaxVibration}</span></div>
        <div className="tkpi"><span className="tkpi-v">{readings.length}</span><span className="tkpi-l">{t.kpiReadings}</span></div>
        <div className="tkpi"><span className="tkpi-v">{stagesReached.length}/4</span><span className="tkpi-l">{t.kpiStages}</span></div>
      </div>

      {/* Journey bar */}
      <div className="card journey-card">
        <div className="journey">
          {STAGES.map((stage, i) => {
            const reached = stagesReached.includes(stage);
            const current = readings.length && readings[readings.length - 1].stage === stage;
            return (
              <div key={stage} className="journey-step">
                <div className={`step-circle ${reached ? "reached" : ""} ${current ? "current-step" : ""}`}>
                  {STAGE_ICONS[stage]}
                </div>
                <span className={`step-label ${reached ? "reached" : ""}`}>{t.stageLabels[stage]}</span>
                {i < STAGES.length - 1 && <div className={`step-line ${reached ? "reached" : ""}`} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Map + charts in grid */}
      <ShipmentMap readings={readings} t={t} />

      {chartData.length > 0 && (
        <div className="chart-grid">
          <div className="card">
            <h4 className="card-title">{t.chartTempHumidity}</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="n" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={(_, p) => p?.[0]?.payload?.stage || ""} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="Temp" name={t.chartTemp} stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Humidity" name={t.chartHumidity} stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h4 className="card-title">{t.chartCO2Vibration}</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="n" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="co2" orientation="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="vib" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={(_, p) => p?.[0]?.payload?.stage || ""} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Line yAxisId="co2" type="monotone" dataKey="CO2" name={t.chartCO2} stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line yAxisId="vib" type="monotone" dataKey="Vibration" name={t.chartVibration} stroke="#8b5cf6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Digital Twin */}
      <DigitalTwin shipmentId={shipmentId} />

      {/* Blockchain Detail — pipeline + AoI + tx table */}
      {readings.length > 0 && <BlockchainDetail readings={readings} />}

      {/* Sensor readings table */}
      {readings.length > 0 && (
        <div className="card">
          <h4 className="card-title">{t.blockchainRecords(readings.length)}</h4>
          <div className="table-wrap">
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
                  <th>{t.colVehicle}</th>
                  <th>{t.colLocation}</th>
                  <th>{t.colRecordedBy}</th>
                  <th>{t.colTime}</th>
                </tr>
              </thead>
              <tbody>
                {readings.map((r, i) => {
                  const anomaly = r.temperature > THRESHOLDS.temp || r.co2 > THRESHOLDS.co2 || r.vibration > THRESHOLDS.vibration;
                  return (
                    <tr key={r.id} className={anomaly ? "row-warn" : ""}>
                      <td className="td-muted">{i + 1}</td>
                      <td>
                        <span className={`verify-badge ${r.recordedBy ? "verify-ok" : "verify-pending"}`}
                          title={r.recordedBy ? t.verifiedTooltip : t.unverifiedTooltip}>
                          {r.recordedBy ? t.verifiedBadge : t.unverifiedBadge}
                        </span>
                      </td>
                      <td>{STAGE_ICONS[r.stage]} {t.stageLabels[r.stage] || r.stage}</td>
                      <td className={r.temperature > THRESHOLDS.temp ? "cell-warn" : ""}>{r.temperature}</td>
                      <td>{r.humidity}</td>
                      <td className={r.co2 > THRESHOLDS.co2 ? "cell-warn" : ""}>{r.co2 ?? "—"}</td>
                      <td className={r.vibration > THRESHOLDS.vibration ? "cell-warn" : ""}>{r.vibration ?? "—"}</td>
                      <td>{r.vehicleId ? <code>{r.vehicleId}</code> : <span className="td-muted">—</span>}</td>
                      <td>{locName(r.location)}</td>
                      <td><code>{r.recordedBy}</code></td>
                      <td className="td-muted">{new Date(r.timestamp).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
