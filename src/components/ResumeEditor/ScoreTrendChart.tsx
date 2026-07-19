import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { ResumeVersion } from "./types";

export default function ScoreTrendChart({ versions }: { versions: ResumeVersion[] }) {
  const chartData = useMemo(() => {
    return [...versions]
      .reverse()
      .map((v) => ({
        name: v.version_name,
        score: v.score || 0,
        date: new Date(v.created_at).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
      }));
  }, [versions]);

  if (chartData.length < 2) {
    return (
      <div style={{
        padding: "16px 12px",
        textAlign: "center",
        color: "var(--ink-faint)",
        fontSize: "11.5px",
        border: "1px dashed var(--border)",
        borderRadius: 8,
        background: "rgba(0,0,0,0.02)",
        marginBottom: "16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
          <TrendingUp size={13} />
          <span>Save at least 2 versions to see score trend analytics.</span>
        </div>
      </div>
    );
  }

  const width = 300;
  const height = 80;
  const paddingX = 20;
  const paddingY = 15;

  const minScore = 0;
  const maxScore = 100;

  const points = chartData.map((d, i) => {
    const x = paddingX + (i / (chartData.length - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - ((d.score - minScore) / (maxScore - minScore)) * (height - 2 * paddingY);
    return { x, y, score: d.score, name: d.name, date: d.date };
  });

  const pathD = points.reduce((acc, p, i) => {
    return acc + `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`;
  }, "");

  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : "";

  return (
    <div style={{
      background: "var(--paper-warm)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      padding: "12px",
      marginBottom: "16px",
    }}>
      <div style={{
        fontSize: 10,
        fontFamily: "DM Mono, monospace",
        color: "var(--ink-muted)",
        marginBottom: 8,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><TrendingUp size={10} /><span>SCORE TREND</span></span>
        <span style={{ fontWeight: 700, color: "var(--accent)" }}>
          {chartData[chartData.length - 1].score - chartData[0].score >= 0 ? "+" : ""}
          {chartData[chartData.length - 1].score - chartData[0].score} pts
        </span>
      </div>
      <div style={{ position: "relative", width: "100%", height: `${height}px` }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "100%", overflow: "visible" }}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {[0, 0.5, 1].map((val, idx) => {
            const y = paddingY + val * (height - 2 * paddingY);
            return (
              <line
                key={idx}
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="var(--border)"
                strokeWidth="0.5"
                strokeDasharray="2 2"
              />
            );
          })}

          {areaD && <path d={areaD} fill="url(#chartGradient)" />}

          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r="3.5"
                fill="var(--paper-card)"
                stroke="var(--accent)"
                strokeWidth="2"
              />
              {i === 0 || i === points.length - 1 || points.length <= 5 ? (
                <text
                  x={p.x}
                  y={p.y - 7}
                  textAnchor="middle"
                  fontSize="8.5"
                  fontWeight="700"
                  fill="var(--ink)"
                  style={{ fontFamily: "Instrument Sans, sans-serif" }}
                >
                  {p.score}
                </text>
              ) : null}
            </g>
          ))}
        </svg>
      </div>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: "9px",
        fontFamily: "DM Mono, monospace",
        color: "var(--ink-faint)",
        marginTop: "4px",
        padding: "0 4px",
      }}>
        <span>{chartData[0].date}</span>
        <span>{chartData[chartData.length - 1].date}</span>
      </div>
    </div>
  );
}
