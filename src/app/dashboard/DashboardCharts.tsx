"use client";
import Link from "next/link";
import SpotlightCard from "@/components/SpotlightCard";
import { Target, ClipboardList, Star } from "lucide-react";
import { useScoreChart } from "@/hooks/useScoreChart";
import { useDashboardData } from "@/hooks/useDashboardData";

type ScoreChartData = ReturnType<typeof useScoreChart>["scoreChartData"];
type FunnelData = ReturnType<typeof useDashboardData>["funnelData"];
type Application = ReturnType<typeof useDashboardData>["applications"][number];

interface Props {
  loading: boolean;
  applications: Application[];
  funnelData: FunnelData;
  scoreChartData: ScoreChartData;
  chartPeriod: number;
  hoveredPoint: number | null;
  setChartPeriod: (p: 0 | 5 | 10) => void;
  setHoveredPoint: (i: number | null) => void;
}

export default function DashboardCharts({
  loading,
  applications,
  funnelData,
  scoreChartData,
  chartPeriod,
  hoveredPoint,
  setChartPeriod,
  setHoveredPoint,
}: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8">
      {/* Chart 1: Score Progression */}
      <SpotlightCard className="glass-card bg-paper-card p-6 rounded-2xl border border-border flex flex-col justify-between min-h-[300px] relative overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-bold text-ink mb-0.5 font-display">Score Progression</h3>
            <p className="text-xs text-ink-muted">ATS score improvement over your resume revisions</p>
          </div>
          {/* Period selector */}
          <div className="flex items-center gap-1 bg-paper-warm/40 border border-border rounded-lg p-0.5">
            {([5, 10, 0] as const).map((p) => (
              <button
                key={p}
                onClick={() => { setChartPeriod(p); setHoveredPoint(null); }}
                className="cursor-pointer transition-all duration-150"
                style={{
                  padding: "3px 10px",
                  borderRadius: 7,
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: "DM Mono, monospace",
                  border: "none",
                  background: chartPeriod === p ? "var(--accent)" : "transparent",
                  color: chartPeriod === p ? "#fff" : "var(--ink-muted)",
                }}
              >
                {p === 0 ? "All" : `Last ${p}`}
              </button>
            ))}
          </div>
        </div>

        {/* Stats row */}
        {scoreChartData && (
          <div className="flex gap-4 mb-3">
            {[
              { label: "Latest", value: scoreChartData.lastScore, suffix: "/100" },
              { label: "Best",   value: scoreChartData.bestScore, suffix: "/100" },
              {
                label: "Trend",
                value: scoreChartData.delta,
                prefix: scoreChartData.delta > 0 ? "+" : "",
                suffix: " pts",
                color: scoreChartData.delta > 0 ? "#10b981" : scoreChartData.delta < 0 ? "#ef4444" : "var(--ink-muted)",
              },
            ].map((s) => (
              <div key={s.label} style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 9, fontFamily: "DM Mono, monospace", color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{s.label}</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: (s as { color?: string }).color ?? "var(--ink)", fontFamily: "DM Serif Display, serif", lineHeight: 1.2 }}>
                  {(s as { prefix?: string }).prefix ?? ""}{s.value}{s.suffix}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 flex items-center justify-center relative">
          {loading ? (
            <div className="w-full" style={{ padding: "8px 0" }}>
              <div className="skeleton" style={{ height: 160, borderRadius: 10 }} />
            </div>
          ) : scoreChartData ? (
            <div className="w-full relative">
              <svg
                viewBox={`0 0 ${scoreChartData.svgW} ${scoreChartData.svgH}`}
                className="w-full h-auto"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <linearGradient id="scoreAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.00" />
                  </linearGradient>
                </defs>
                {scoreChartData.yGridValues.map((val) => {
                  const yVal = scoreChartData.yOf(val);
                  return (
                    <g key={val}>
                      <line x1={scoreChartData.padding.left} y1={yVal} x2={scoreChartData.svgW - scoreChartData.padding.right} y2={yVal} stroke="var(--border)" strokeWidth={1} strokeDasharray="4,4" />
                      <text x={scoreChartData.padding.left - 8} y={yVal + 3} textAnchor="end" fill="var(--ink-faint)" fontSize={9} fontFamily="DM Mono, monospace">{val}</text>
                    </g>
                  );
                })}
                {scoreChartData.milestones.map((m) => {
                  const y = scoreChartData.yOf(m.value);
                  return (
                    <g key={m.value}>
                      <line x1={scoreChartData.padding.left} y1={y} x2={scoreChartData.svgW - scoreChartData.padding.right} y2={y} stroke={m.color} strokeWidth={1} strokeOpacity={0.5} strokeDasharray="6,3" />
                      <text x={scoreChartData.svgW - scoreChartData.padding.right + 4} y={y + 3} fill={m.color} fontSize={8} fontFamily="DM Mono, monospace" fontWeight={700} opacity={0.85}>{m.label}</text>
                    </g>
                  );
                })}
                {scoreChartData.areaPath && <path d={scoreChartData.areaPath} fill="url(#scoreAreaGradient)" />}
                {scoreChartData.smoothPath && <path d={scoreChartData.smoothPath} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />}
                {hoveredPoint !== null && scoreChartData.points[hoveredPoint] && (
                  <line x1={scoreChartData.points[hoveredPoint].x} y1={scoreChartData.padding.top} x2={scoreChartData.points[hoveredPoint].x} y2={scoreChartData.svgH - scoreChartData.padding.bottom} stroke="var(--accent)" strokeOpacity={0.3} strokeWidth={1.5} strokeDasharray="2,2" />
                )}
                {scoreChartData.points.map((pt, idx) => {
                  const isBest = idx === scoreChartData.bestIdx;
                  const isHovered = hoveredPoint === idx;
                  return (
                    <g key={idx}>
                      {isBest && <circle cx={pt.x} cy={pt.y} r={11} fill="#f59e0b" opacity={0.15} />}
                      <circle cx={pt.x} cy={pt.y} r={isHovered ? 6 : isBest ? 5.5 : 4} fill={isHovered ? "var(--accent)" : isBest ? "#f59e0b" : "var(--paper-card)"} stroke={isBest ? "#f59e0b" : "var(--accent)"} strokeWidth={2} className="cursor-pointer transition-all duration-150" onMouseEnter={() => setHoveredPoint(idx)} onMouseLeave={() => setHoveredPoint(null)} />
                      {isBest && !isHovered && <text x={pt.x} y={pt.y - 10} textAnchor="middle" fontSize={9} fill="#f59e0b" fontWeight={700} fontFamily="DM Mono, monospace">★ {pt.score}</text>}
                      {isHovered && <circle cx={pt.x} cy={pt.y} r={10} fill="var(--accent)" fillOpacity={0.15} pointerEvents="none" />}
                    </g>
                  );
                })}
                {[0, Math.floor(scoreChartData.points.length / 2), scoreChartData.points.length - 1]
                  .filter((val, i, self) => self.indexOf(val) === i && scoreChartData.points[val])
                  .map((val) => {
                    const pt = scoreChartData.points[val];
                    return <text key={val} x={pt.x} y={scoreChartData.svgH - 10} textAnchor="middle" fill="var(--ink-faint)" fontSize={9} fontFamily="DM Mono, monospace">{pt.date}</text>;
                  })}
              </svg>
              {hoveredPoint !== null && scoreChartData.points[hoveredPoint] && (
                <div
                  className="absolute top-2 glass-card bg-paper-card border border-accent-border px-3 py-2 rounded-xl text-left pointer-events-none shadow-md z-20 transition-all duration-200"
                  style={{
                    right: scoreChartData.points[hoveredPoint].x < scoreChartData.svgW / 2 ? "8px" : "auto",
                    left: scoreChartData.points[hoveredPoint].x < scoreChartData.svgW / 2 ? "auto" : "8px",
                  }}
                >
                  <div className="text-[10px] font-mono text-accent uppercase tracking-wider font-semibold">{scoreChartData.points[hoveredPoint].date}</div>
                  <div className="text-sm font-bold text-ink truncate max-w-[150px]">{scoreChartData.points[hoveredPoint].role}</div>
                  <div className="text-xl font-bold text-ink mt-0.5">
                    Score: <span className="text-accent">{scoreChartData.points[hoveredPoint].score}</span>/100
                    {hoveredPoint === scoreChartData.bestIdx && (
                      <span className="ml-1.5 text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5"><Star size={9} fill="currentColor" /> Personal Best</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-6 border border-dashed border-border rounded-xl w-full flex flex-col items-center justify-center bg-paper-warm/20">
              <Target size={32} className="text-ink-muted mb-2" />
              <div className="text-sm font-bold text-ink mb-1">Unlock progression chart</div>
              <p className="text-xs text-ink-muted max-w-[250px] mb-4">Upload and analyze multiple versions of your resume to see your scores track over time.</p>
              <Link href="/" className="text-xs font-semibold text-accent border border-accent-border hover:bg-accent-bg px-3 py-1.5 rounded-lg no-underline transition-all">Analyze Now</Link>
            </div>
          )}
        </div>
      </SpotlightCard>

      {/* Chart 2: Pipeline Funnel */}
      <SpotlightCard className="glass-card bg-paper-card p-6 rounded-2xl border border-border flex flex-col justify-between min-h-[300px]">
        <div>
          <h3 className="text-lg font-bold text-ink mb-1 font-display">Application Pipeline</h3>
          <p className="text-xs text-ink-muted mb-4">Status of active job search tracker opportunities</p>
        </div>
        <div className="flex-1 flex flex-col justify-center gap-3">
          {loading ? (
            <div className="text-ink-muted text-sm font-mono flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-accent/20 border-t-accent rounded-full animate-spin" /> Loading pipeline...
            </div>
          ) : applications.length > 0 ? (
            funnelData.stages.map((stage, idx) => {
              const percent = Math.round((stage.count / funnelData.maxCount) * 100);
              return (
                <div key={idx} className="group">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold text-ink flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                      {stage.label}
                    </span>
                    <span className="text-ink-muted font-mono">{stage.count} active</span>
                  </div>
                  <div className="h-2.5 w-full bg-paper-warm rounded-full overflow-hidden border border-border relative">
                    <div className="h-full rounded-full transition-all duration-500 ease-out group-hover:brightness-105" style={{ width: `${percent}%`, backgroundColor: stage.color, boxShadow: `0 0 10px ${stage.color}22` }} />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center p-6 border border-dashed border-border rounded-xl w-full flex flex-col items-center justify-center bg-paper-warm/20">
              <ClipboardList size={32} className="text-ink-muted mb-2" />
              <div className="text-sm font-bold text-ink mb-1">No tracked applications</div>
              <p className="text-xs text-ink-muted max-w-[250px] mb-4">Use our job tracker to manage your applications, screening schedules, and interview progress.</p>
              <Link href="/dashboard/applications" className="text-xs font-semibold text-accent border border-accent-border hover:bg-accent-bg px-3 py-1.5 rounded-lg no-underline transition-all">Go to Job Tracker</Link>
            </div>
          )}
        </div>
      </SpotlightCard>
    </div>
  );
}
