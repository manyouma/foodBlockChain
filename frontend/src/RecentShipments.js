import { useEffect, useState } from "react";
import axios from "axios";
import { useLang } from "./LangContext";

const API = "http://localhost:8000";

const STATUS_COLORS = { in_transit: "#ed8936", delivered: "#48bb78" };
const STAGE_ICONS = { farm: "🌱", truck: "🚚", warehouse: "🏭", supermarket: "🛒" };

export default function RecentShipments({ onSelect }) {
  const { t } = useLang();
  const [shipments, setShipments] = useState([]);
  const [readingCounts, setReadingCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/shipments`)
      .then(res => {
        const list = res.data || [];
        setShipments(list);
        // fetch reading counts for each shipment in parallel
        Promise.all(
          list.map(s =>
            axios.get(`${API}/shipment/${s.id}/readings`)
              .then(r => ({ id: s.id, count: (r.data || []).length, readings: r.data || [] }))
              .catch(() => ({ id: s.id, count: 0, readings: [] }))
          )
        ).then(results => {
          const counts = {};
          results.forEach(r => { counts[r.id] = { count: r.count, readings: r.readings }; });
          setReadingCounts(counts);
        });
      })
      .catch(() => setShipments([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="card subtle">{t.loadingShipments}</div>;
  if (!shipments.length) return <div className="card subtle">{t.noShipments}</div>;

  return (
    <div className="recent-section">
      <h3 className="recent-title">{t.recentShipments}</h3>
      <p className="recent-subtitle">{t.recentSubtitle}</p>
      <div className="shipment-grid">
        {shipments.map(s => {
          const info = readingCounts[s.id];
          const stages = info ? [...new Set(info.readings.map(r => r.stage))] : [];
          const maxTemp = info?.readings.length
            ? Math.max(...info.readings.map(r => r.temperature))
            : null;
          const tempOk = maxTemp === null || maxTemp <= 8;

          return (
            <div key={s.id} className="shipment-card" onClick={() => onSelect(s.id)}>
              <div className="sc-header">
                <span className="sc-id">{s.id}</span>
                <span
                  className="sc-status"
                  style={{ background: STATUS_COLORS[s.status] || "#a0aec0" }}
                >{s.status}</span>
              </div>
              <div className="sc-product">🍈 {s.product}</div>
              <div className="sc-origin">📍 {s.origin}</div>
              <div className="sc-stages">
                {stages.map(st => (
                  <span key={st} className="sc-stage-chip">{STAGE_ICONS[st]}</span>
                ))}
                {info && (
                  <span className="sc-count">
                    🔗 {t.readingsCount(info.count)}
                  </span>
                )}
              </div>
              <div className="sc-footer">
                <span className={`sc-temp ${tempOk ? "ok" : "warn"}`}>
                  {tempOk ? "✓ " + t.coldChainOk.replace("✓ ", "") : t.coldChainWarn}
                </span>
                <span className="sc-date">
                  {new Date(s.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
