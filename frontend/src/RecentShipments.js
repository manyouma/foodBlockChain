import { useEffect, useState } from "react";
import { getShipments, getReadings } from "./api";
import { useLang } from "./LangContext";
import LiveActivityMap from "./LiveActivityMap";

const API = "http://localhost:8000";
const STAGE_ICONS = { farm: "🌱", truck: "🚚", warehouse: "🏭", supermarket: "🛒" };
const STAGE_KEYS = ["farm", "truck", "warehouse", "supermarket"];
const THRESHOLDS = { temp: 8, co2: 1000, vibration: 1.5 };

function getAlerts(readings) {
  const a = new Set();
  readings.forEach(r => {
    if (r.temperature > THRESHOLDS.temp) a.add("temp");
    if (r.co2 > THRESHOLDS.co2) a.add("co2");
    if (r.vibration > THRESHOLDS.vibration) a.add("vibration");
  });
  return a;
}

function parseName(location) {
  return location ? location.split("::")[0] : "";
}

// Returns the unique destination locations for a given stage across all shipments
function destinationsForStage(enriched, stage, t) {
  const seen = new Set();
  enriched.forEach(s => {
    s.readings
      .filter(r => r.stage === stage)
      .forEach(r => seen.add(parseName(r.location)));
  });
  return [...seen].map(name => ({ name, label: t.locationName(name) }));
}


export default function RecentShipments({ onSelect }) {
  const { t } = useLang();
  const [shipments, setShipments] = useState([]);
  const [infoMap, setInfoMap] = useState({});
  const [loading, setLoading] = useState(true);
  // "currentAt" = current stage of the shipment RIGHT NOW
  // "destFilter" = which destination it is headed TO (uses shipment.destination field)
  const [currentAt, setCurrentAt] = useState("all");
  const [destFilter, setDestFilter] = useState("all");
  const [showAbnormal, setShowAbnormal] = useState(false);

  useEffect(() => {
    getShipments()
      .then(list => {
        setShipments(list || []);
        return Promise.all(
          (list || []).map(s =>
            getReadings(s.id).then(readings => ({ id: s.id, readings: readings || [] }))
          )
        );
      })
      .then(results => {
        const map = {};
        results.forEach(r => { map[r.id] = r.readings; });
        setInfoMap(map);
      })
      .catch(() => setShipments([]))
      .finally(() => setLoading(false));
  }, []);

  const enriched = shipments.map(s => {
    const readings = infoMap[s.id] || [];
    const lastStage = readings.length ? readings[readings.length - 1].stage : null;
    return {
      ...s,
      readings,
      currentStage: lastStage,
      alerts: getAlerts(readings),
      stagesVisited: [...new Set(readings.map(r => r.stage))],
    };
  });

  // Unique destinations across all shipments that have one set
  const allDestinations = [...new Set(
    enriched.map(s => s.destination).filter(Boolean)
  )].map(d => ({ name: d, label: t.locationName(d) }));

  const filtered = enriched.filter(s => {
    if (showAbnormal && s.alerts.size === 0) return false;
    // "Current location" filter — where is it RIGHT NOW
    if (currentAt !== "all" && s.currentStage !== currentAt) return false;
    // "Destination" filter — where is it HEADED (explicit field on shipment)
    if (destFilter !== "all" && s.destination !== destFilter) return false;
    return true;
  });

  if (loading) return (
    <div className="dashboard-shell">
      <div className="hero-skeleton" />
      <div className="section-loading">{t.loadingShipments}</div>
    </div>
  );

  return (
    <div className="dashboard-shell">
      <LiveActivityMap enriched={enriched} />

      <div className="section-header">
        <div>
          <h2 className="section-title">{t.recentShipments}</h2>
          <p className="section-sub">{t.recentSubtitle}</p>
        </div>
        <span className="result-count">{t.filterResults(filtered.length)}</span>
      </div>

      {/* Row 1: Current location */}
      <div className="filter-group">
        <span className="filter-group-label">{t.filterCurrentAt}:</span>
        <div className="filter-bar">
          <button className={`filter-btn ${currentAt === "all" ? "active" : ""}`}
            onClick={() => setCurrentAt("all")}>{t.filterAll}</button>
          {STAGE_KEYS.map(s => (
            <button key={s} className={`filter-btn ${currentAt === s ? "active" : ""}`}
              onClick={() => setCurrentAt(s)}>
              {STAGE_ICONS[s]} {t.stageLabels[s]}
            </button>
          ))}
          <button className={`filter-btn filter-alert ${showAbnormal ? "active" : ""}`}
            onClick={() => { setShowAbnormal(v => !v); setCurrentAt("all"); setDestFilter("all"); }}>
            {t.filterAbnormal}
          </button>
        </div>
      </div>

      {/* Row 2: Destination filter */}
      {allDestinations.length > 0 && (
        <div className="filter-group">
          <span className="filter-group-label">{t.filterByDestination}:</span>
          <div className="filter-bar">
            <button className={`subloc-btn ${destFilter === "all" ? "active" : ""}`}
              onClick={() => setDestFilter("all")}>{t.allLocations}</button>
            {allDestinations.map(({ name, label }) => (
              <button key={name} className={`subloc-btn ${destFilter === name ? "active" : ""}`}
                onClick={() => setDestFilter(name)}>{label}</button>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && <div className="empty-state">{t.noShipments}</div>}

      <div className="shipment-grid">
        {filtered.map(s => {
          const tempOk = !s.alerts.has("temp");
          const hasAlerts = s.alerts.size > 0;
          const maxTemp = s.readings.length ? Math.max(...s.readings.map(r => r.temperature)) : null;
          const trucks = [...new Set(s.readings.filter(r => r.stage === "truck" && r.vehicleId).map(r => r.vehicleId))];

          return (
            <div key={s.id} className={`sc ${hasAlerts ? "sc-alert" : ""}`} onClick={() => onSelect(s.id)}>
              <div className="sc-top">
                <span className="sc-id">{s.id}</span>
                {hasAlerts
                  ? <span className="sc-badge sc-badge-alert">⚠ {t.filterAbnormal.replace("⚠ ", "").replace("仅", "")}</span>
                  : <span className="sc-badge sc-badge-ok">{t.coldChainOk}</span>}
              </div>

              <div className="sc-product">{s.product}</div>
              <div className="sc-route">
                <span className="sc-route-from">🌱 {t.locationName(s.origin)}</span>
                {s.destination && <>
                  <span className="sc-route-arrow">→</span>
                  <span className="sc-route-to">🏪 {t.locationName(s.destination)}</span>
                </>}
              </div>

              {s.currentStage && (
                <div className="sc-stage-row">
                  <span className="sc-stage-label">{t.currentStage}</span>
                  <span className="sc-stage-val">{STAGE_ICONS[s.currentStage]} {t.stageLabels[s.currentStage]}</span>
                </div>
              )}

              {trucks.length > 0 && (
                <div className="sc-stage-row">
                  <span className="sc-stage-label">🚚</span>
                  <span className="sc-truck-val">{trucks.join(" · ")}</span>
                </div>
              )}

              <div className="sc-progress">
                {STAGE_KEYS.map((stage, i) => {
                  const visited = s.stagesVisited.includes(stage);
                  const current = s.currentStage === stage;
                  return (
                    <div key={stage} className={`sc-prog-step ${visited ? "visited" : ""} ${current ? "current" : ""}`}>
                      <div className="sc-prog-dot" title={t.stageLabels[stage]} />
                      {i < STAGE_KEYS.length - 1 && <div className="sc-prog-line" />}
                    </div>
                  );
                })}
              </div>

              {hasAlerts && (
                <div className="sc-alerts">
                  {s.alerts.has("temp") && <span className="alert-chip">{t.alertTemp}</span>}
                  {s.alerts.has("co2") && <span className="alert-chip">{t.alertCO2}</span>}
                  {s.alerts.has("vibration") && <span className="alert-chip">{t.alertVibration}</span>}
                </div>
              )}

              <div className="sc-bottom">
                <span className="sc-readings">🔗 {t.readingsCount(s.readings.length)}</span>
                {maxTemp !== null && (
                  <span className={`sc-maxtemp ${tempOk ? "ok" : "warn"}`}>{maxTemp.toFixed(1)}°C max</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
