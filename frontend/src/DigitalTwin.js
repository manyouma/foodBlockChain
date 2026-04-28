import { useEffect, useState } from "react";
import { useLang } from "./LangContext";
import { getTwin } from "./api";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";

function QualityGauge({ pct, t }) {
  // SVG arc gauge
  const r = 52, cx = 64, cy = 64;
  const angle = (pct / 100) * 270 - 135; // -135 to +135 degrees
  const toRad = d => (d * Math.PI) / 180;
  const arcX = cx + r * Math.cos(toRad(angle));
  const arcY = cy + r * Math.sin(toRad(angle));
  const startX = cx + r * Math.cos(toRad(-135));
  const startY = cy + r * Math.sin(toRad(-135));
  const endX = cx + r * Math.cos(toRad(135));
  const endY = cy + r * Math.sin(toRad(135));
  const largeArc = pct > 50 ? 1 : 0;
  const color = pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="dt-gauge-wrap">
      <svg width={128} height={100} viewBox="0 0 128 100">
        {/* Background arc */}
        <path d={`M ${startX} ${startY} A ${r} ${r} 0 1 1 ${endX} ${endY}`}
          fill="none" stroke="#e2e8f0" strokeWidth={10} strokeLinecap="round" />
        {/* Value arc */}
        {pct > 0 && (
          <path d={`M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${arcX} ${arcY}`}
            fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" />
        )}
        <text x={cx} y={cy + 8} textAnchor="middle"
          style={{ fontSize: 22, fontWeight: 800, fill: color }}>{pct}%</text>
        <text x={cx} y={cy + 24} textAnchor="middle"
          style={{ fontSize: 9, fill: "#94a3b8" }}>{t.dtQuality}</text>
      </svg>
    </div>
  );
}

function RslBar({ current, total, t }) {
  const pct = Math.max(0, Math.min(100, (current / total) * 100));
  const color = pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
  const days = Math.floor(current / 24);
  const hours = Math.round(current % 24);
  return (
    <div className="dt-rsl-wrap">
      <div className="dt-rsl-label">
        <span>{t.dtRsl}</span>
        <span style={{ color, fontWeight: 700 }}>{days}{t.dtDays} {hours}{t.dtHours}</span>
      </div>
      <div className="dt-rsl-track">
        <div className="dt-rsl-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="dt-rsl-sub">{t.dtRslBase} {Math.round(total / 24)} {t.dtDays}</div>
    </div>
  );
}

export default function DigitalTwin({ shipmentId }) {
  const { t } = useLang();
  const [twin, setTwin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getTwin(shipmentId).then(d => { setTwin(d); setLoading(false); });
  }, [shipmentId]);

  if (loading) return <div className="card dt-card"><div className="section-loading">{t.loading}</div></div>;
  if (!twin) return null;

  const chartData = twin.timeline.map((p, i) => ({
    n: i + 1,
    quality: p.quality_pct,
    temp: p.temperature,
    stage: t.stageLabels[p.stage] || p.stage,
    rsl: p.rsl_hours,
  }));

  const excursionIndices = twin.timeline
    .map((p, i) => p.temperature > 8 ? i + 1 : null)
    .filter(Boolean);

  return (
    <div className="card dt-card">
      <h4 className="card-title">{t.dtTitle}</h4>
      <p className="dt-subtitle">{t.dtSubtitle}</p>

      <div className="dt-top">
        <QualityGauge pct={twin.current_quality_pct} t={t} />

        <div className="dt-stats">
          <RslBar current={twin.current_rsl_hours} total={twin.rsl_0_hours} t={t} />
          <div className="dt-stat-row">
            <div className="dt-stat">
              <span className="dt-stat-v warn">{twin.hours_lost}h</span>
              <span className="dt-stat-l">{t.dtLost}</span>
            </div>
            <div className="dt-stat">
              <span className="dt-stat-v">{twin.t_ref_celsius}°C</span>
              <span className="dt-stat-l">{t.dtRefTemp}</span>
            </div>
            <div className="dt-stat">
              <span className="dt-stat-v">{twin.rsl_0_days}{t.dtDays}</span>
              <span className="dt-stat-l">{t.dtIdealLife}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dt-chart-wrap">
        <p className="dt-chart-label">{t.dtChartLabel}</p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="qualGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="n" tick={{ fontSize: 10 }} label={{ value: t.readingNum, position: "insideBottom", fontSize: 10, offset: -2 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
            <Tooltip formatter={(v, n, p) => [`${v}%  (${p.payload.temp}°C)`, t.dtQuality]}
              labelFormatter={(_, p) => p?.[0]?.payload?.stage || ""} />
            {excursionIndices.map(i => (
              <ReferenceLine key={i} x={i} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1.5} />
            ))}
            <Area type="monotone" dataKey="quality" stroke="#10b981" strokeWidth={2}
              fill="url(#qualGrad)" dot={{ r: 3, fill: "#10b981" }} />
          </AreaChart>
        </ResponsiveContainer>
        <p className="dt-chart-note">{t.dtExcursionNote}</p>
      </div>

      <div className="dt-arrhenius-note">{t.dtArrheniusNote}</div>
    </div>
  );
}
