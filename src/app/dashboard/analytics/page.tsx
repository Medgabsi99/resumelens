"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import SpotlightCard from "@/components/SpotlightCard";
import { useDashboardData } from "@/hooks/useDashboardData";
import {
  BarChart2,
  TrendingUp,
  Target,
  Briefcase,
  ArrowRight,
  Star,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ─── Chart 1 helpers: All-time score trend ────────────────────────────────────

const W = 520,
  H = 200;
const PAD = { top: 24, right: 58, bottom: 32, left: 36 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;

interface TrendPoint {
  x: number;
  y: number;
  score: number;
  date: string;
  role: string;
}

function buildTrendChart(points: TrendPoint[]) {
  if (points.length < 2) return null;
  const scores = points.map((p) => p.score);
  const minS = Math.max(0, Math.min(...scores) - 10);
  const maxS = Math.min(100, Math.max(...scores) + 10);
  const range = maxS - minS || 1;

  const yOf = (s: number) => PAD.top + INNER_H - ((s - minS) / range) * INNER_H;
  const mapped = points.map((p, i) => ({
    ...p,
    cx: PAD.left + (i / (points.length - 1)) * INNER_W,
    cy: yOf(p.score),
  }));

  // Rolling 4-point average
  const avg = mapped.map((_, i) => {
    const window = mapped.slice(Math.max(0, i - 3), i + 1);
    return { cx: mapped[i].cx, cy: yOf(window.reduce((s, p) => s + p.score, 0) / window.length) };
  });

  // Smooth cubic bezier path
  const polyline = mapped.map((p) => `${p.cx},${p.cy}`).join(" L ");
  const linePath = `M ${polyline}`;
  const areaPath = `M ${PAD.left},${H - PAD.bottom} L ${polyline} L ${mapped[mapped.length - 1].cx},${H - PAD.bottom} Z`;
  const avgPath = `M ${avg.map((p) => `${p.cx},${p.cy}`).join(" L ")}`;

  const gridY = [0, 25, 50, 75, 100].filter((v) => v >= minS && v <= maxS);
  const bestIdx = scores.indexOf(Math.max(...scores));
  const lastScore = scores[scores.length - 1];
  const delta = scores.length > 1 ? lastScore - scores[0] : 0;

  return { mapped, linePath, areaPath, avgPath, gridY, yOf, bestIdx, lastScore, delta, minS, maxS };
}

// ─── Chart 2 helpers: Best score per role ─────────────────────────────────────

interface RoleStat {
  role: string;
  max: number;
  avg: number;
  count: number;
}

function buildRoleStats(analyses: { score: number; target_role: string | null }[]): RoleStat[] {
  const map = new Map<string, number[]>();
  for (const a of analyses) {
    const key = (a.target_role?.trim() || "General")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
    map.set(key, [...(map.get(key) ?? []), a.score]);
  }
  return Array.from(map.entries())
    .map(([role, scores]) => ({
      role,
      max: Math.max(...scores),
      avg: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
      count: scores.length,
    }))
    .sort((a, b) => b.max - a.max);
}

// ─── Chart 3 helpers: Conversion KPIs ────────────────────────────────────────

function conversionRate(num: number, den: number) {
  if (den === 0) return null;
  return Math.round((num / den) * 100);
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { analyses, applications, loading, funnelData } = useDashboardData();
  const [hoveredPt, setHoveredPt] = useState<number | null>(null);
  const [showAllRoles, setShowAllRoles] = useState(false);

  // ── Chart 1 data ──────────────────────────────────────────────────────────
  const trendPoints = useMemo<TrendPoint[]>(() => {
    const sorted = [...analyses].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    // Weekly bucket when >15 analyses
    if (sorted.length > 15) {
      const byWeek = new Map<string, typeof sorted>();
      for (const a of sorted) {
        const d = new Date(a.created_at);
        const monday = new Date(d);
        monday.setDate(d.getDate() - d.getDay() + 1);
        const key = monday.toISOString().slice(0, 10);
        byWeek.set(key, [...(byWeek.get(key) ?? []), a]);
      }
      return Array.from(byWeek.entries()).map(([week, items]) => ({
        x: 0,
        y: 0,
        score: Math.round(items.reduce((s, i) => s + i.score, 0) / items.length),
        date: new Date(week).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        role: items[items.length - 1].target_role ?? "General",
      }));
    }
    return sorted.map((a) => ({
      x: 0,
      y: 0,
      score: a.score,
      date: new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      role: a.target_role ?? "General",
    }));
  }, [analyses]);

  const chart1 = useMemo(() => buildTrendChart(trendPoints), [trendPoints]);

  // ── Chart 2 data ──────────────────────────────────────────────────────────
  const roleStats = useMemo(() => buildRoleStats(analyses), [analyses]);
  const visibleRoles = showAllRoles ? roleStats : roleStats.slice(0, 8);

  // ── Chart 3 KPIs ──────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const stages = funnelData.stages;
    const applied = stages.find((s) => s.label === "Applied")?.count ?? 0;
    const screening = stages.find((s) => s.label === "Screening")?.count ?? 0;
    const interviewing = stages.find((s) => s.label === "Interviewing")?.count ?? 0;
    const offerHired = stages.find((s) => s.label === "Offers / Hired")?.count ?? 0;
    const toInterview = conversionRate(screening + interviewing, applied);
    const toOffer = conversionRate(offerHired, screening + interviewing);
    const overall = conversionRate(interviewing + offerHired, applied);
    return { toInterview, toOffer, overall };
  }, [funnelData]);

  // ── Skeleton ──────────────────────────────────────────────────────────────
  const Skeleton = ({ h = 180 }: { h?: number }) => (
    <div className="animate-pulse bg-paper-warm rounded-xl" style={{ height: h }} />
  );

  if (!mounted) return null;

  return (
    <DashboardLayout>
      <div className="workspace-canvas">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="flex items-start gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
              <BarChart2 size={22} className="text-accent" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-ink leading-tight">Analytics</h1>
              <p className="text-sm text-ink-muted mt-0.5">
                Score progression, role performance, and application conversion — evidence
                you&apos;re improving.
              </p>
            </div>
          </motion.div>

          {/* ── Chart 1: All-time Score Trend ─────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.05 }}
          >
            <SpotlightCard className="glass-card bg-paper-card border border-border rounded-2xl p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                <div>
                  <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                    <TrendingUp size={17} className="text-accent" />
                    ATS Score Trend
                  </h2>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Every analysis, chronologically — are you getting better?
                  </p>
                </div>

                {/* KPI strip */}
                {chart1 && (
                  <div className="flex gap-5">
                    {[
                      {
                        label: "Latest",
                        value: chart1.lastScore,
                        suffix: "/100",
                        color: "var(--accent)",
                      },
                      {
                        label: "Best",
                        value: Math.max(...trendPoints.map((p) => p.score)),
                        suffix: "/100",
                        color: "#f59e0b",
                      },
                      {
                        label: "Δ vs first",
                        value: chart1.delta,
                        suffix: " pts",
                        prefix: chart1.delta > 0 ? "+" : "",
                        color:
                          chart1.delta > 0
                            ? "#10b981"
                            : chart1.delta < 0
                              ? "#ef4444"
                              : "var(--ink-muted)",
                      },
                    ].map((s) => (
                      <div key={s.label} className="flex flex-col">
                        <span className="text-[9px] font-mono uppercase tracking-widest text-ink-faint">
                          {s.label}
                        </span>
                        <span
                          className="text-lg font-extrabold"
                          style={{
                            color: s.color,
                            fontFamily: "DM Serif Display, serif",
                            lineHeight: 1.2,
                          }}
                        >
                          {s.prefix ?? ""}
                          {s.value}
                          {s.suffix}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {loading ? (
                <Skeleton h={200} />
              ) : chart1 ? (
                <div className="relative w-full">
                  <svg
                    viewBox={`0 0 ${W} ${H}`}
                    className="w-full h-auto"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <defs>
                      <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.00" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    {chart1.gridY.map((v) => (
                      <g key={v}>
                        <line
                          x1={PAD.left}
                          y1={chart1.yOf(v)}
                          x2={W - PAD.right}
                          y2={chart1.yOf(v)}
                          stroke="var(--border)"
                          strokeWidth={1}
                          strokeDasharray="4,4"
                        />
                        <text
                          x={PAD.left - 6}
                          y={chart1.yOf(v) + 3}
                          textAnchor="end"
                          fill="var(--ink-faint)"
                          fontSize={9}
                          fontFamily="DM Mono, monospace"
                        >
                          {v}
                        </text>
                      </g>
                    ))}

                    {/* Milestone lines */}
                    {[
                      { v: 70, label: "ATS OK", color: "#f59e0b" },
                      { v: 85, label: "Strong", color: "#10b981" },
                    ]
                      .filter((m) => m.v >= chart1.minS && m.v <= chart1.maxS)
                      .map((m) => (
                        <g key={m.v}>
                          <line
                            x1={PAD.left}
                            y1={chart1.yOf(m.v)}
                            x2={W - PAD.right}
                            y2={chart1.yOf(m.v)}
                            stroke={m.color}
                            strokeWidth={1}
                            strokeOpacity={0.5}
                            strokeDasharray="6,3"
                          />
                          <text
                            x={W - PAD.right + 6}
                            y={chart1.yOf(m.v) + 3}
                            fill={m.color}
                            fontSize={8.5}
                            fontFamily="DM Mono, monospace"
                            fontWeight={700}
                            opacity={0.95}
                          >
                            {m.label}
                          </text>
                        </g>
                      ))}

                    {/* Rolling avg line */}
                    <path
                      d={chart1.avgPath}
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth={1}
                      strokeOpacity={0.3}
                      strokeDasharray="5,3"
                      strokeLinecap="round"
                    />

                    {/* Area fill */}
                    <path d={chart1.areaPath} fill="url(#trendFill)" />

                    {/* Score line */}
                    <path
                      d={chart1.linePath}
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Hover crosshair */}
                    {hoveredPt !== null && chart1.mapped[hoveredPt] && (
                      <line
                        x1={chart1.mapped[hoveredPt].cx}
                        y1={PAD.top}
                        x2={chart1.mapped[hoveredPt].cx}
                        y2={H - PAD.bottom}
                        stroke="var(--accent)"
                        strokeOpacity={0.3}
                        strokeWidth={1.5}
                        strokeDasharray="2,2"
                      />
                    )}

                    {/* Data points */}
                    {chart1.mapped.map((pt, i) => {
                      const isBest = i === chart1.bestIdx;
                      const isHov = hoveredPt === i;
                      return (
                        <g key={i}>
                          {isBest && (
                            <circle cx={pt.cx} cy={pt.cy} r={11} fill="#f59e0b" opacity={0.15} />
                          )}
                          <circle
                            cx={pt.cx}
                            cy={pt.cy}
                            r={isHov ? 6 : isBest ? 5.5 : 4}
                            fill={
                              isHov ? "var(--accent)" : isBest ? "#f59e0b" : "var(--paper-card)"
                            }
                            stroke={isBest ? "#f59e0b" : "var(--accent)"}
                            strokeWidth={2}
                            style={{ cursor: "pointer" }}
                            onMouseEnter={() => setHoveredPt(i)}
                            onMouseLeave={() => setHoveredPt(null)}
                          />
                          {isBest && !isHov && (
                            <text
                              x={pt.cx}
                              y={pt.cy - 10}
                              textAnchor="middle"
                              fontSize={9}
                              fill="#f59e0b"
                              fontWeight={700}
                              fontFamily="DM Mono, monospace"
                            >
                              ★ {pt.score}
                            </text>
                          )}
                        </g>
                      );
                    })}

                    {/* X-axis date labels */}
                    {[0, Math.floor(chart1.mapped.length / 2), chart1.mapped.length - 1]
                      .filter((v, i, s) => s.indexOf(v) === i && chart1.mapped[v])
                      .map((i) => (
                        <text
                          key={i}
                          x={chart1.mapped[i].cx}
                          y={H - 10}
                          textAnchor="middle"
                          fill="var(--ink-faint)"
                          fontSize={9}
                          fontFamily="DM Mono, monospace"
                        >
                          {chart1.mapped[i].date}
                        </text>
                      ))}
                  </svg>

                  {/* Hover tooltip */}
                  {hoveredPt !== null && chart1.mapped[hoveredPt] && (
                    <div
                      className="absolute top-2 glass-card bg-paper-card border border-accent-border px-3 py-2 rounded-xl pointer-events-none shadow-lg z-20"
                      style={{
                        left: chart1.mapped[hoveredPt].cx / W > 0.5 ? 8 : "auto",
                        right: chart1.mapped[hoveredPt].cx / W > 0.5 ? "auto" : 8,
                      }}
                    >
                      <div className="text-[10px] font-mono text-accent uppercase tracking-wider font-semibold">
                        {chart1.mapped[hoveredPt].date}
                      </div>
                      <div className="text-xs font-semibold text-ink-muted truncate max-w-[140px]">
                        {chart1.mapped[hoveredPt].role}
                      </div>
                      <div className="text-lg font-bold text-ink mt-0.5">
                        Score: <span className="text-accent">{chart1.mapped[hoveredPt].score}</span>
                        /100
                        {hoveredPt === chart1.bestIdx && (
                          <span className="ml-1.5 text-[9px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5">
                            <Star size={8} fill="currentColor" /> Best
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rolling avg legend */}
                  <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-ink-faint">
                    <span className="flex items-center gap-1.5">
                      <svg width="20" height="6">
                        <line
                          x1="0"
                          y1="3"
                          x2="20"
                          y2="3"
                          stroke="var(--accent)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      </svg>
                      Score
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg width="20" height="6">
                        <line
                          x1="0"
                          y1="3"
                          x2="20"
                          y2="3"
                          stroke="var(--accent)"
                          strokeWidth="1.5"
                          strokeDasharray="5,3"
                          strokeOpacity="0.5"
                        />
                      </svg>
                      4-pt rolling avg
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-14 border border-dashed border-border rounded-xl bg-paper-warm/20 flex flex-col items-center">
                  <Target size={36} className="text-ink-muted mb-3" />
                  <p className="font-semibold text-ink text-sm mb-1">No analyses yet</p>
                  <p className="text-xs text-ink-muted mb-4 max-w-xs">
                    Run your first resume analysis to start tracking your score improvement over
                    time.
                  </p>
                  <Link
                    href="/"
                    className="text-xs font-semibold text-accent border border-accent-border hover:bg-accent-bg px-4 py-2 rounded-lg no-underline transition-all flex items-center gap-1.5"
                  >
                    Analyze a Resume <ArrowRight size={12} />
                  </Link>
                </div>
              )}
            </SpotlightCard>
          </motion.div>

          {/* ── Charts 2 + 3 row ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 2: Best score per role */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.12 }}
            >
              <SpotlightCard className="glass-card bg-paper-card border border-border rounded-2xl p-6 h-full">
                <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2 mb-1">
                  <Star size={17} className="text-amber-500" />
                  Best Score by Role
                </h2>
                <p className="text-xs text-ink-muted mb-5">
                  Highest ATS score achieved per target job type
                </p>

                {loading ? (
                  <Skeleton h={220} />
                ) : roleStats.length > 0 ? (
                  <div className="space-y-3">
                    {visibleRoles.map((r, i) => (
                      <div key={r.role}>
                        <div className="flex justify-between items-baseline text-xs mb-1">
                          <span
                            className="font-semibold text-ink truncate max-w-[55%]"
                            title={r.role}
                          >
                            {r.role}
                          </span>
                          <span className="text-ink-muted font-mono flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-ink-faint">avg {r.avg}</span>
                            <span className="font-bold text-ink">
                              {r.max}
                              <span className="text-ink-faint">/100</span>
                            </span>
                            <span className="text-[10px] text-ink-faint">×{r.count}</span>
                          </span>
                        </div>
                        <div className="relative h-2.5 bg-paper-warm rounded-full overflow-hidden border border-border">
                          {/* Avg bar (lighter) */}
                          <div
                            className="absolute h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${r.avg}%`,
                              background: "var(--accent)",
                              opacity: 0.25,
                            }}
                          />
                          {/* Max bar */}
                          <motion.div
                            className="absolute h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${r.max}%` }}
                            transition={{ delay: 0.15 + i * 0.06, duration: 0.6, ease: "easeOut" }}
                            style={{
                              background: i === 0 ? "#f59e0b" : "var(--accent)",
                              boxShadow: `0 0 8px ${i === 0 ? "#f59e0b44" : "var(--accent)33"}`,
                            }}
                          />
                        </div>
                      </div>
                    ))}

                    {roleStats.length > 8 && (
                      <button
                        type="button"
                        onClick={() => setShowAllRoles((v) => !v)}
                        className="w-full text-center text-xs text-ink-muted hover:text-accent font-mono mt-2 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        {showAllRoles ? (
                          <>
                            <ChevronUp size={12} /> Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown size={12} /> Show {roleStats.length - 8} more roles
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-border rounded-xl bg-paper-warm/20 flex flex-col items-center">
                    <Briefcase size={32} className="text-ink-muted mb-2" />
                    <p className="text-sm font-semibold text-ink mb-1">No role data yet</p>
                    <p className="text-xs text-ink-muted mb-3 max-w-xs">
                      Add a target role when running your next analysis to see per-role insights.
                    </p>
                    <Link
                      href="/"
                      className="text-xs font-semibold text-accent border border-accent-border hover:bg-accent-bg px-3 py-1.5 rounded-lg no-underline transition-all"
                    >
                      Analyze Now
                    </Link>
                  </div>
                )}
              </SpotlightCard>
            </motion.div>

            {/* Chart 3: Funnel + Conversion KPIs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.18 }}
            >
              <SpotlightCard className="glass-card bg-paper-card border border-border rounded-2xl p-6 h-full">
                <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2 mb-1">
                  <Briefcase size={17} className="text-accent" />
                  Application Conversion
                </h2>
                <p className="text-xs text-ink-muted mb-4">
                  How well your applications are converting through each stage
                </p>

                {/* KPI chips */}
                {!loading && applications.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-5">
                    {[
                      {
                        label: "Applied → Interview",
                        value: kpis.toInterview,
                        threshold: [10, 25],
                      },
                      {
                        label: "Interview → Offer",
                        value: kpis.toOffer,
                        threshold: [15, 33],
                      },
                      {
                        label: "Overall Pipeline",
                        value: kpis.overall,
                        threshold: [10, 30],
                      },
                    ].map((kpi) => {
                      const v = kpi.value;
                      const color =
                        v === null
                          ? "var(--ink-muted)"
                          : v >= kpi.threshold[1]
                            ? "#10b981"
                            : v >= kpi.threshold[0]
                              ? "#f59e0b"
                              : "#ef4444";
                      return (
                        <div
                          key={kpi.label}
                          className="flex flex-col items-center justify-center bg-paper border border-border rounded-xl px-4 py-3 min-w-[90px]"
                        >
                          <span
                            className="text-xl font-extrabold"
                            style={{ color, fontFamily: "DM Serif Display, serif" }}
                          >
                            {v === null ? "—" : `${v}%`}
                          </span>
                          <span className="text-[9px] font-mono text-ink-faint text-center leading-tight mt-0.5">
                            {kpi.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Funnel bars */}
                {loading ? (
                  <Skeleton h={150} />
                ) : applications.length > 0 ? (
                  <div className="space-y-2.5">
                    {funnelData.stages.map((stage, idx) => {
                      const pct = Math.round((stage.count / funnelData.maxCount) * 100);
                      return (
                        <div key={idx} className="group">
                          <div className="flex justify-between items-center text-xs mb-1">
                            <span className="font-semibold text-ink flex items-center gap-1.5">
                              <span
                                className="inline-block w-2 h-2 rounded-full"
                                style={{ background: stage.color }}
                              />
                              {stage.label}
                            </span>
                            <span className="text-ink-muted font-mono">{stage.count}</span>
                          </div>
                          <div className="h-2.5 w-full bg-paper-warm rounded-full overflow-hidden border border-border">
                            <motion.div
                              className="h-full rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{
                                delay: 0.2 + idx * 0.07,
                                duration: 0.55,
                                ease: "easeOut",
                              }}
                              style={{
                                background: stage.color,
                                boxShadow: `0 0 10px ${stage.color}22`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}

                    {/* Health indicator */}
                    {kpis.overall !== null && (
                      <div className="mt-4 flex items-center gap-2 text-xs font-mono">
                        {kpis.overall >= 30 ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                            <span className="text-emerald-400 font-bold">Strong pipeline</span>
                            <span className="text-ink-muted">— keep up the momentum</span>
                          </>
                        ) : kpis.overall >= 10 ? (
                          <>
                            <AlertTriangle size={12} className="text-amber-400" />
                            <span className="text-amber-400 font-bold">Pipeline building</span>
                            <span className="text-ink-muted">— focus on applications</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={12} className="text-red-400" />
                            <span className="text-red-400 font-bold">Low conversion</span>
                            <span className="text-ink-muted">— tailor resume to JDs</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-10 border border-dashed border-border rounded-xl bg-paper-warm/20 flex flex-col items-center">
                    <Briefcase size={32} className="text-ink-muted mb-2" />
                    <p className="text-sm font-semibold text-ink mb-1">No tracked applications</p>
                    <p className="text-xs text-ink-muted mb-3 max-w-xs">
                      Track your job applications to see conversion rates here.
                    </p>
                    <Link
                      href="/dashboard/applications"
                      className="text-xs font-semibold text-accent border border-accent-border hover:bg-accent-bg px-3 py-1.5 rounded-lg no-underline transition-all flex items-center gap-1.5"
                    >
                      Go to Job Tracker <ArrowRight size={12} />
                    </Link>
                  </div>
                )}
              </SpotlightCard>
            </motion.div>
          </div>

          {/* Bottom insight banner */}
          {!loading && analyses.length >= 3 && chart1 && chart1.delta > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4 bg-emerald-400/8 border border-emerald-400/20 rounded-2xl px-6 py-4"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-400/15 flex items-center justify-center flex-shrink-0">
                <TrendingUp size={18} className="text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-sm text-ink">
                  Your score improved by{" "}
                  <span className="text-emerald-400 font-bold">+{chart1.delta} pts</span> across{" "}
                  {analyses.length} analyses.
                </p>
                <p className="text-xs text-ink-muted mt-0.5">
                  That&apos;s real, measurable progress. Keep iterating — most ATS thresholds are
                  70+.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
