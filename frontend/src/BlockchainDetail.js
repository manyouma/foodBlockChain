import { useLang } from "./LangContext";

const THRESHOLDS = { temp: 8, co2: 1000, vibration: 1.5 };

// How long ago a timestamp was, as a human string
function ageOf(ts) {
  const sec = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  return `${Math.floor(sec / 86400)}d`;
}

function shortTx(txId) {
  if (!txId) return "—";
  return txId.slice(0, 8) + "…" + txId.slice(-6);
}

// The 5-step Fabric pipeline diagram
function FabricPipeline({ t }) {
  const steps = [
    {
      icon: "📡",
      title: t.pipelineSensor,
      desc: t.pipelineSensorDesc,
      color: "#10b981",
    },
    {
      icon: "✍️",
      title: t.pipelineEndorse,
      desc: t.pipelineEndorseDesc,
      color: "#3b82f6",
    },
    {
      icon: "📬",
      title: t.pipelineOrder,
      desc: t.pipelineOrderDesc,
      color: "#f59e0b",
    },
    {
      icon: "⛓️",
      title: t.pipelineCommit,
      desc: t.pipelineCommitDesc,
      color: "#8b5cf6",
    },
    {
      icon: "🔒",
      title: t.pipelineFinal,
      desc: t.pipelineFinalDesc,
      color: "#ef4444",
    },
  ];

  return (
    <div className="pipeline-wrap">
      <h4 className="card-title" style={{ marginBottom: 16 }}>{t.fabricPipelineTitle}</h4>
      <div className="pipeline-steps">
        {steps.map((s, i) => (
          <div key={i} className="pipeline-step-outer">
            <div className="pipeline-step">
              <div className="pipeline-icon" style={{ background: s.color + "22", border: `1.5px solid ${s.color}` }}>
                {s.icon}
              </div>
              <div className="pipeline-step-title" style={{ color: s.color }}>{s.title}</div>
              <div className="pipeline-step-desc">{s.desc}</div>
            </div>
            {i < steps.length - 1 && <div className="pipeline-arrow">→</div>}
          </div>
        ))}
      </div>
      <div className="pipeline-note">{t.pipelineNote}</div>
    </div>
  );
}

// AoI bar chart — one bar per reading, color = stage
const STAGE_COLORS = { farm: "#10b981", truck: "#f59e0b", warehouse: "#3b82f6", supermarket: "#8b5cf6" };

function AoIChart({ readings, t }) {
  if (!readings.length) return null;

  const now = Date.now();
  const ages = readings.map(r => ({
    id: r.id,
    stage: r.stage,
    ageMin: (now - new Date(r.timestamp)) / 60000,
    anomaly: r.temperature > THRESHOLDS.temp || r.co2 > THRESHOLDS.co2 || r.vibration > THRESHOLDS.vibration,
  }));

  const maxAge = Math.max(...ages.map(a => a.ageMin));

  return (
    <div className="aoi-wrap">
      <h4 className="card-title">{t.aoiTitle}</h4>
      <p className="aoi-subtitle">{t.aoiSubtitle}</p>
      <div className="aoi-chart">
        {ages.map((a, i) => (
          <div key={a.id} className="aoi-col" title={`${a.id}: ${a.ageMin.toFixed(1)} min`}>
            <div className="aoi-bar-wrap">
              <div
                className={`aoi-bar ${a.anomaly ? "aoi-bar-alert" : ""}`}
                style={{
                  height: `${Math.max(4, (a.ageMin / maxAge) * 100)}%`,
                  background: a.anomaly ? "#ef4444" : STAGE_COLORS[a.stage] || "#64748b",
                }}
              />
            </div>
            <div className="aoi-label">{i + 1}</div>
          </div>
        ))}
      </div>
      <div className="aoi-legend">
        {Object.entries(STAGE_COLORS).map(([stage, color]) => (
          <span key={stage} className="aoi-legend-item">
            <span className="aoi-dot" style={{ background: color }} />
            {t.stageLabels[stage]}
          </span>
        ))}
        <span className="aoi-legend-item">
          <span className="aoi-dot" style={{ background: "#ef4444" }} />
          {t.alertLabel}
        </span>
      </div>
    </div>
  );
}

// Per-reading transaction table
function TxTable({ readings, t }) {
  return (
    <div>
      <h4 className="card-title" style={{ marginBottom: 12 }}>{t.txTableTitle}</h4>
      <div className="table-wrap">
        <table className="readings-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{t.colStage}</th>
              <th>{t.txColTxId}</th>
              <th>{t.txColOrg}</th>
              <th>{t.txColAoI}</th>
              <th>{t.txColTime}</th>
              <th>{t.colVerified}</th>
            </tr>
          </thead>
          <tbody>
            {readings.map((r, i) => (
              <tr key={r.id}>
                <td className="td-muted">{i + 1}</td>
                <td>{t.stageLabels[r.stage] || r.stage}</td>
                <td>
                  {r.txId
                    ? <code className="tx-id" title={r.txId}>{shortTx(r.txId)}</code>
                    : <span className="td-muted">—</span>}
                </td>
                <td><code>{r.recordedBy || "—"}</code></td>
                <td className="aoi-cell">
                  <span className="aoi-pill">{ageOf(r.timestamp)}</span>
                </td>
                <td className="td-muted">{new Date(r.timestamp).toLocaleString()}</td>
                <td>
                  <span className={`verify-badge ${r.txId ? "verify-ok" : "verify-pending"}`}>
                    {r.txId ? t.verifiedBadge : t.unverifiedBadge}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function BlockchainDetail({ readings }) {
  const { t } = useLang();

  return (
    <div className="card bc-detail-card">
      <FabricPipeline t={t} />
      <div className="bc-divider" />
      <AoIChart readings={readings} t={t} />
      <div className="bc-divider" />
      <TxTable readings={readings} t={t} />
    </div>
  );
}
