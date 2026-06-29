"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { JobApplication, APPLICATION_STATUS_COLORS, APPLICATION_STATUS_LABELS } from "@/types";
import AnimatedNumber from "@/components/AnimatedNumber";
import ResumeDiffViewer from "@/components/ResumeDiffViewer";
import { SkeletonTable } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import { useContextMenu } from "@/components/ContextMenu";
import PrintButton from "@/components/PrintButton";
import SpotlightCard from "@/components/SpotlightCard";

interface AnalysisItem {
  id: string;
  score: number;
  target_role: string | null;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { show: showContextMenu } = useContextMenu();
  const [mounted, setMounted] = useState(false);
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tabs: 'reviews' | 'applications'
  const [activeTab, setActiveTab] = useState<"reviews" | "applications">("reviews");
  
  // Search filters
  const [reviewsSearch, setReviewsSearch] = useState("");
  const [appsSearch, setAppsSearch] = useState("");

  // Pagination
  const PAGE_SIZE = 8;
  const [reviewsPage, setReviewsPage] = useState(1);
  const [appsPage, setAppsPage] = useState(1);

  // Interactive Chart States
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [chartPeriod, setChartPeriod] = useState<5 | 10 | 0>(0); // 0 = all

  // Deletion Modal States
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Diff viewer
  const [diffOpen, setDiffOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function loadData() {
      try {
        const [analysesRes, appsRes] = await Promise.all([
          fetch("/api/analyses"),
          fetch("/api/applications"),
        ]);

        const analysesData = await analysesRes.json();
        const appsData = await appsRes.json();

        if (!analysesRes.ok || !analysesData.success) {
          throw new Error(analysesData.error || "Failed to load analyses");
        }
        if (!appsRes.ok || !appsData.success) {
          throw new Error(appsData.error || "Failed to load applications");
        }

        setAnalyses(analysesData.data || []);
        setApplications(appsData.data || []);
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Format Date helper
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Delete Analysis helper
  const handleDeleteAnalysis = async (id: string) => {
    setDeleteTargetId(id);
  };

  const confirmDeleteAnalysis = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/analyses/${deleteTargetId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to delete analysis. Please try again.");
        return;
      }
      setAnalyses((prev) => prev.filter((a) => a.id !== deleteTargetId));
      setDeleteTargetId(null);
    } catch (e) {
      console.error(e);
      setError("Network error: could not delete analysis.");
    } finally {
      setIsDeleting(false);
      if (!error) setDeleteTargetId(null);
    }
  };

  // ─── Stat Calculations ─────────────────────────────────
  const stats = useMemo(() => {
    const totalReviews = analyses.length;
    
    // Average ATS score
    const avgScore = totalReviews > 0 
      ? Math.round(analyses.reduce((acc, a) => acc + a.score, 0) / totalReviews)
      : 0;

    const totalApps = applications.length;

    // Success Rate (Percentage of apps in Screening, Interviewing, Offer, or Accepted stages)
    const activePipelineCount = applications.filter((a) => 
      ["screening", "interviewing", "offer", "accepted"].includes(a.status)
    ).length;
    const successRate = totalApps > 0 
      ? Math.round((activePipelineCount / totalApps) * 100)
      : 0;

    return {
      avgScore,
      totalReviews,
      totalApps,
      successRate,
    };
  }, [analyses, applications]);

  // ─── Filtered Data ─────────────────────────────────────
  const filteredAnalyses = useMemo(() => {
    return analyses.filter((a) => {
      const role = a.target_role?.toLowerCase() || "general resume review";
      return role.includes(reviewsSearch.toLowerCase());
    });
  }, [analyses, reviewsSearch]);

  const filteredApplications = useMemo(() => {
    return applications.filter((a) => {
      const company = a.company_name.toLowerCase();
      const title = a.job_title.toLowerCase();
      const query = appsSearch.toLowerCase();
      return company.includes(query) || title.includes(query);
    });
  }, [applications, appsSearch]);

  // ─── Paged slices ───────────────────────────────────────
  const reviewsTotalPages = Math.max(1, Math.ceil(filteredAnalyses.length / PAGE_SIZE));
  const appsTotalPages    = Math.max(1, Math.ceil(filteredApplications.length / PAGE_SIZE));
  const pagedAnalyses     = filteredAnalyses.slice((reviewsPage - 1) * PAGE_SIZE, reviewsPage * PAGE_SIZE);
  const pagedApplications = filteredApplications.slice((appsPage - 1) * PAGE_SIZE, appsPage * PAGE_SIZE);

  // Reset pages when search or tab changes
  useEffect(() => { setReviewsPage(1); }, [reviewsSearch]);
  useEffect(() => { setAppsPage(1); },    [appsSearch]);
  useEffect(() => { setReviewsPage(1); setAppsPage(1); }, [activeTab]);

  // ─── SVG Score Progression Chart Data ───────────────────
  const scoreChartData = useMemo(() => {
    const allSorted = [...analyses].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const sorted = chartPeriod === 0 ? allSorted : allSorted.slice(-chartPeriod);

    if (sorted.length < 1) return null;

    const scores = sorted.map((d) => d.score);
    const minScore = Math.max(0, Math.min(...scores) - 12);
    const maxScore = Math.min(100, Math.max(...scores) + 12);
    const scoreRange = maxScore - minScore || 20;

    const svgW = 560;
    const svgH = 210;
    const padding = { top: 24, right: 28, bottom: 38, left: 38 };
    const plotW = svgW - padding.left - padding.right;
    const plotH = svgH - padding.top - padding.bottom;

    const xOf = (i: number) => padding.left + (i / Math.max(sorted.length - 1, 1)) * plotW;
    const yOf = (v: number) => padding.top + plotH - ((v - minScore) / scoreRange) * plotH;

    const points = sorted.map((item, i) => ({
      x: xOf(i),
      y: yOf(item.score),
      score: item.score,
      role: item.target_role || "General Review",
      date: formatDate(item.created_at),
    }));

    // Smooth cubic bezier path
    const smoothPath = points.reduce((d, p, i, arr) => {
      if (i === 0) return `M${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      const prev = arr[i - 1];
      const cpx = (prev.x + p.x) / 2;
      return `${d} C${cpx.toFixed(1)},${prev.y.toFixed(1)} ${cpx.toFixed(1)},${p.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }, "");

    const areaPath = points.length > 0
      ? `${smoothPath} L${points[points.length - 1].x.toFixed(1)},${(padding.top + plotH).toFixed(1)} L${points[0].x.toFixed(1)},${(padding.top + plotH).toFixed(1)} Z`
      : "";

    // Milestone bands (only include if within visible score range)
    const milestones = [
      { value: 60, label: "Fair",  color: "#f59e0b" },
      { value: 80, label: "Good",  color: "#6366f1" },
      { value: 90, label: "Elite", color: "#10b981" },
    ].filter((m) => m.value >= minScore && m.value <= maxScore);

    const yGridValues = [20, 40, 60, 80, 100].filter((v) => v >= minScore && v <= maxScore);

    // Best score index
    const bestIdx = scores.indexOf(Math.max(...scores));

    const firstScore = sorted[0].score;
    const lastScore = sorted[sorted.length - 1].score;
    const bestScore = Math.max(...scores);
    const delta = lastScore - firstScore;

    return {
      points, smoothPath, areaPath, milestones,
      minScore, maxScore, scoreRange, yGridValues,
      svgW, svgH, padding, plotW, plotH,
      sorted, bestIdx, firstScore, lastScore, bestScore, delta,
      xOf, yOf,
    };
  }, [analyses, chartPeriod]);

  // ─── Funnel/Pipeline Chart Data ────────────────────────
  const funnelData = useMemo(() => {
    const groups = {
      saved: 0,
      applied: 0,
      screening: 0,
      interviewing: 0,
      offer: 0,
      accepted: 0,
    };

    applications.forEach((app) => {
      const status = app.status as keyof typeof groups;
      if (status in groups) {
        groups[status]++;
      }
    });

    // Merge offer + accepted
    const offerAcceptedCount = groups.offer + groups.accepted;

    const data = [
      { label: "Saved Jobs", count: groups.saved, color: "#94a3b8", bg: "rgba(148, 163, 184, 0.1)" },
      { label: "Applied", count: groups.applied, color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)" },
      { label: "Screening", count: groups.screening, color: "#6366f1", bg: "rgba(99, 102, 241, 0.1)" },
      { label: "Interviewing", count: groups.interviewing, color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" },
      { label: "Offers / Hired", count: offerAcceptedCount, color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" },
    ];

    const maxCount = Math.max(...data.map((d) => d.count), 1);

    return {
      stages: data,
      maxCount,
    };
  }, [applications]);

  // Helper score badges
  const getScoreBadgeStyles = (score: number) => {
    if (score >= 80) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 60) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-rose-500 bg-rose-500/10 border-rose-500/20";
  };

  const getPriorityBadgeStyles = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-rose-500 bg-rose-500/10 border-rose-500/20";
      case "medium":
        return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      default:
        return "text-slate-500 bg-slate-500/10 border-slate-500/20";
    }
  };

  if (!mounted) return null;

  return (
    <DashboardLayout>
      <div className="fade-up">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-ink mb-1.5">
              Dashboard Overview
            </h1>
            <p className="text-ink-muted text-sm">
              Track resume improvements, analyze ATS performance, and review your job search pipeline.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="btn-gradient px-4 py-2.5 rounded-xl text-sm font-semibold no-underline text-center shadow-lg hover:scale-[1.02] active:scale-[1] transition-all duration-200"
            >
              📄 New Analysis
            </Link>
            <Link
              href="/dashboard/applications"
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-border bg-paper-card text-ink text-center hover:bg-paper-warm hover:border-accent-border transition-all duration-200"
            >
              📋 Track Application
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {/* Average ATS Score */}
          <SpotlightCard className="glass-card bg-paper-card p-5 rounded-2xl border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between text-ink-muted mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Avg Score</span>
              <span className="text-lg">🎯</span>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-ink mb-1 font-display">
                {loading
                  ? <div className="skeleton h-10 w-16" />
                  : <AnimatedNumber value={stats.avgScore} zeroLabel="N/A" duration={900} />}
              </div>
              <div className="text-xs text-ink-muted flex items-center gap-1.5">
                {loading ? (
                  <div className="skeleton h-3 w-28" />
                ) : stats.avgScore > 0 ? (
                  <>
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${stats.avgScore >= 80 ? "bg-emerald-500" : stats.avgScore >= 60 ? "bg-amber-500" : "bg-rose-500"}`} />
                    <span>Rating: {stats.avgScore >= 80 ? "Excellent" : stats.avgScore >= 60 ? "Good" : "Needs Review"}</span>
                  </>
                ) : (
                  <span>No analyses run</span>
                )}
              </div>
            </div>
          </SpotlightCard>

          {/* Total Analyses */}
          <SpotlightCard className="glass-card bg-paper-card p-5 rounded-2xl border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between text-ink-muted mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Total Reviews</span>
              <span className="text-lg">📄</span>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-ink mb-1 font-display">
                {loading ? <div className="skeleton h-10 w-12" /> : <AnimatedNumber value={stats.totalReviews} duration={750} />}
              </div>
              <div className="text-xs text-ink-muted">
                {loading ? <div className="skeleton h-3 w-36 mt-1" /> : "Resumes reviewed over time"}
              </div>
            </div>
          </SpotlightCard>

          {/* Tracked Applications */}
          <SpotlightCard className="glass-card bg-paper-card p-5 rounded-2xl border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between text-ink-muted mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Tracked Jobs</span>
              <span className="text-lg">📋</span>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-ink mb-1 font-display">
                {loading ? <div className="skeleton h-10 w-12" /> : <AnimatedNumber value={stats.totalApps} duration={750} />}
              </div>
              <div className="text-xs text-ink-muted">
                {loading ? <div className="skeleton h-3 w-40 mt-1" /> : "Applications in search tracker"}
              </div>
            </div>
          </SpotlightCard>

          {/* Success Rate */}
          <SpotlightCard className="glass-card bg-paper-card p-5 rounded-2xl border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between text-ink-muted mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Interview Success</span>
              <span className="text-lg">🚀</span>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-ink mb-1 font-display">
                {loading ? <div className="skeleton h-10 w-16" /> : <AnimatedNumber value={stats.successRate} suffix="%" duration={1050} />}
              </div>
              <div className="text-xs text-ink-muted">
                {loading ? <div className="skeleton h-3 w-32 mt-1" /> : "Active funnel conversion"}
              </div>
            </div>
          </SpotlightCard>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8">
          {/* Chart 1: Score Progression */}
          <SpotlightCard className="glass-card bg-paper-card p-6 rounded-2xl border border-border flex flex-col justify-between min-h-[300px] relative overflow-hidden">

            {/* ── Header ── */}
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

            {/* ── Stats row ── */}
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
                /* Skeleton */
                <div className="w-full" style={{ padding: "8px 0" }}>
                  <div className="skeleton" style={{ height: 160, borderRadius: 10 }} />
                </div>
              ) : scoreChartData ? (
                <div className="w-full relative">
                  {/* SVG Chart */}
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

                    {/* Y-axis grid lines */}
                    {scoreChartData.yGridValues.map((val) => {
                      const yVal = scoreChartData.yOf(val);
                      return (
                        <g key={val}>
                          <line
                            x1={scoreChartData.padding.left}
                            y1={yVal}
                            x2={scoreChartData.svgW - scoreChartData.padding.right}
                            y2={yVal}
                            stroke="var(--border)"
                            strokeWidth={1}
                            strokeDasharray="4,4"
                          />
                          <text
                            x={scoreChartData.padding.left - 8}
                            y={yVal + 3}
                            textAnchor="end"
                            fill="var(--ink-faint)"
                            fontSize={9}
                            fontFamily="DM Mono, monospace"
                          >
                            {val}
                          </text>
                        </g>
                      );
                    })}

                    {/* Milestone reference bands */}
                    {scoreChartData.milestones.map((m) => {
                      const y = scoreChartData.yOf(m.value);
                      return (
                        <g key={m.value}>
                          <line
                            x1={scoreChartData.padding.left}
                            y1={y}
                            x2={scoreChartData.svgW - scoreChartData.padding.right}
                            y2={y}
                            stroke={m.color}
                            strokeWidth={1}
                            strokeOpacity={0.5}
                            strokeDasharray="6,3"
                          />
                          <text
                            x={scoreChartData.svgW - scoreChartData.padding.right + 4}
                            y={y + 3}
                            fill={m.color}
                            fontSize={8}
                            fontFamily="DM Mono, monospace"
                            fontWeight={700}
                            opacity={0.85}
                          >
                            {m.label}
                          </text>
                        </g>
                      );
                    })}

                    {/* Area fill */}
                    {scoreChartData.areaPath && (
                      <path d={scoreChartData.areaPath} fill="url(#scoreAreaGradient)" />
                    )}

                    {/* Smooth bezier line */}
                    {scoreChartData.smoothPath && (
                      <path
                        d={scoreChartData.smoothPath}
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Hover column line indicator */}
                    {hoveredPoint !== null && scoreChartData.points[hoveredPoint] && (
                      <line
                        x1={scoreChartData.points[hoveredPoint].x}
                        y1={scoreChartData.padding.top}
                        x2={scoreChartData.points[hoveredPoint].x}
                        y2={scoreChartData.svgH - scoreChartData.padding.bottom}
                        stroke="var(--accent)"
                        strokeOpacity={0.3}
                        strokeWidth={1.5}
                        strokeDasharray="2,2"
                      />
                    )}

                    {/* Points */}
                    {scoreChartData.points.map((pt, idx) => {
                      const isBest = idx === scoreChartData.bestIdx;
                      const isHovered = hoveredPoint === idx;
                      return (
                        <g key={idx}>
                          {/* Pulse ring on best score */}
                          {isBest && (
                            <circle cx={pt.x} cy={pt.y} r={11} fill="#f59e0b" opacity={0.15} />
                          )}
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isHovered ? 6 : isBest ? 5.5 : 4}
                            fill={isHovered ? "var(--accent)" : isBest ? "#f59e0b" : "var(--paper-card)"}
                            stroke={isBest ? "#f59e0b" : "var(--accent)"}
                            strokeWidth={2}
                            className="cursor-pointer transition-all duration-150"
                            onMouseEnter={() => setHoveredPoint(idx)}
                            onMouseLeave={() => setHoveredPoint(null)}
                          />
                          {/* Gold star label on personal best */}
                          {isBest && !isHovered && (
                            <text
                              x={pt.x}
                              y={pt.y - 10}
                              textAnchor="middle"
                              fontSize={9}
                              fill="#f59e0b"
                              fontWeight={700}
                              fontFamily="DM Mono, monospace"
                            >
                              ★ {pt.score}
                            </text>
                          )}
                          {isHovered && (
                            <circle cx={pt.x} cy={pt.y} r={10} fill="var(--accent)" fillOpacity={0.15} pointerEvents="none" />
                          )}
                        </g>
                      );
                    })}

                    {/* X-axis labels */}
                    {[0, Math.floor(scoreChartData.points.length / 2), scoreChartData.points.length - 1]
                      .filter((val, i, self) => self.indexOf(val) === i && scoreChartData.points[val])
                      .map((val) => {
                        const pt = scoreChartData.points[val];
                        return (
                          <text
                            key={val}
                            x={pt.x}
                            y={scoreChartData.svgH - 10}
                            textAnchor="middle"
                            fill="var(--ink-faint)"
                            fontSize={9}
                            fontFamily="DM Mono, monospace"
                          >
                            {pt.date}
                          </text>
                        );
                      })}
                  </svg>

                  {/* Active Tooltip overlay */}
                  {hoveredPoint !== null && scoreChartData.points[hoveredPoint] && (
                    <div
                      className="absolute top-2 glass-card bg-paper-card border border-accent-border px-3 py-2 rounded-xl text-left pointer-events-none shadow-md z-20 transition-all duration-200"
                      style={{
                        right: scoreChartData.points[hoveredPoint].x < scoreChartData.svgW / 2 ? "8px" : "auto",
                        left: scoreChartData.points[hoveredPoint].x < scoreChartData.svgW / 2 ? "auto" : "8px",
                      }}
                    >
                      <div className="text-[10px] font-mono text-accent uppercase tracking-wider font-semibold">
                        {scoreChartData.points[hoveredPoint].date}
                      </div>
                      <div className="text-sm font-bold text-ink truncate max-w-[150px]">
                        {scoreChartData.points[hoveredPoint].role}
                      </div>
                      <div className="text-xl font-bold text-ink mt-0.5">
                        Score: <span className="text-accent">{scoreChartData.points[hoveredPoint].score}</span>/100
                        {hoveredPoint === scoreChartData.bestIdx && (
                          <span className="ml-1.5 text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md">★ Personal Best</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-6 border border-dashed border-border rounded-xl w-full flex flex-col items-center justify-center bg-paper-warm/20">
                  <div className="text-3xl mb-2">📈</div>
                  <div className="text-sm font-bold text-ink mb-1">Unlock progression chart</div>
                  <p className="text-xs text-ink-muted max-w-[250px] mb-4">
                    Upload and analyze multiple versions of your resume to see your scores track over time.
                  </p>
                  <Link
                    href="/"
                    className="text-xs font-semibold text-accent border border-accent-border hover:bg-accent-bg px-3 py-1.5 rounded-lg no-underline transition-all"
                  >
                    Analyze Now
                  </Link>
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
                  <span className="animate-spin">🔄</span> Loading pipeline...
                </div>
              ) : applications.length > 0 ? (
                funnelData.stages.map((stage, idx) => {
                  const percent = Math.round((stage.count / funnelData.maxCount) * 100);
                  return (
                    <div key={idx} className="group">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-semibold text-ink flex items-center gap-1.5">
                          <span
                            className="inline-block w-2 h-2 rounded-full"
                            style={{ backgroundColor: stage.color }}
                          />
                          {stage.label}
                        </span>
                        <span className="text-ink-muted font-mono">{stage.count} active</span>
                      </div>
                      <div className="h-2.5 w-full bg-paper-warm rounded-full overflow-hidden border border-border relative">
                        <div
                          className="h-full rounded-full transition-all duration-500 ease-out group-hover:brightness-105"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: stage.color,
                            boxShadow: `0 0 10px ${stage.color}22`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center p-6 border border-dashed border-border rounded-xl w-full flex flex-col items-center justify-center bg-paper-warm/20">
                  <div className="text-3xl mb-2">📋</div>
                  <div className="text-sm font-bold text-ink mb-1">No tracked applications</div>
                  <p className="text-xs text-ink-muted max-w-[250px] mb-4">
                    Use our job tracker to manage your applications, screening schedules, and interview progress.
                  </p>
                  <Link
                    href="/dashboard/applications"
                    className="text-xs font-semibold text-accent border border-accent-border hover:bg-accent-bg px-3 py-1.5 rounded-lg no-underline transition-all"
                  >
                    Go to Job Tracker
                  </Link>
                </div>
              )}
            </div>
          </SpotlightCard>
        </div>

        {/* Tabbed Activity History */}
        <div className="glass-card bg-paper-card rounded-2xl border border-border overflow-hidden">
          {/* Tabs Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border p-4 gap-4 bg-paper-warm/20">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("reviews")}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  color: activeTab === "reviews" ? "var(--accent)" : "var(--ink-muted)",
                  background: activeTab === "reviews" ? "var(--accent-bg)" : "transparent",
                  border: `1px solid ${activeTab === "reviews" ? "var(--accent-border)" : "transparent"}`,
                  borderBottom: activeTab === "reviews" ? "2px solid var(--accent)" : "2px solid transparent",
                  borderRadius: "10px 10px 0 0",
                }}
              >
                📄 Resume Reviews ({analyses.length})
              </button>
              <button
                onClick={() => setActiveTab("applications")}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  color: activeTab === "applications" ? "var(--accent)" : "var(--ink-muted)",
                  background: activeTab === "applications" ? "var(--accent-bg)" : "transparent",
                  border: `1px solid ${activeTab === "applications" ? "var(--accent-border)" : "transparent"}`,
                  borderBottom: activeTab === "applications" ? "2px solid var(--accent)" : "2px solid transparent",
                  borderRadius: "10px 10px 0 0",
                }}
              >
                📋 Tracked Jobs ({applications.length})
              </button>
            </div>

            {/* Tab right side: Compare button + Print + Search */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {activeTab === "reviews" && analyses.length >= 2 && (
                <button
                  onClick={() => setDiffOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border border-border text-ink-muted hover:text-accent hover:border-accent-border bg-paper-card transition-all duration-200 flex-shrink-0"
                  title="Compare two analyses side-by-side"
                >
                  <span style={{ fontSize: 13 }}>⟺</span>
                  Compare
                </button>
              )}
              <PrintButton label="Export" className="flex-shrink-0 text-xs" />
              <div className="w-full sm:w-64 relative">
                {activeTab === "reviews" ? (
                  <input
                    type="text"
                    placeholder="Filter by target role..."
                    value={reviewsSearch}
                    onChange={(e) => setReviewsSearch(e.target.value)}
                    className="premium-input py-1.5 text-xs rounded-xl"
                  />
                ) : (
                  <input
                    type="text"
                    placeholder="Filter by title or company..."
                    value={appsSearch}
                    onChange={(e) => setAppsSearch(e.target.value)}
                    className="premium-input py-1.5 text-xs rounded-xl"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Table Contents */}
          <div className="p-4 overflow-x-auto">
            {loading ? (
              <div className="px-4 py-6">
                <SkeletonTable rows={4} cols={4} />
              </div>
            ) : activeTab === "reviews" ? (
              filteredAnalyses.length > 0 ? (
                <>
                  <table className="hidden sm:table w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border text-ink-muted text-xs uppercase tracking-wider font-mono">
                        <th className="pb-3 font-semibold">Target Role</th>
                        <th className="pb-3 font-semibold text-center">Score</th>
                        <th className="pb-3 font-semibold">Date Reviewed</th>
                        <th className="pb-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedAnalyses.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-border/40 hover:bg-paper-warm/20 transition-all group cursor-context-menu"
                          onContextMenu={(e) => {
                            showContextMenu(e, [
                              {
                                key: "view",
                                label: "View Report",
                                icon: "📊",
                                shortcut: "Enter",
                                onClick: () => router.push(`/dashboard/${item.id}`),
                              },
                              {
                                key: "tailor",
                                label: "Open in Tailor Sandbox",
                                icon: "✨",
                                onClick: () => router.push(`/dashboard/tailor?analysisId=${item.id}`),
                              },
                              {
                                key: "copy-score",
                                label: `Copy Score (${item.score}/100)`,
                                icon: "📋",
                                onClick: () => navigator.clipboard.writeText(`ATS Score: ${item.score}/100 — ${item.target_role || "General Resume"}`),
                              },
                              {
                                key: "delete",
                                label: "Delete Review",
                                icon: "🗑️",
                                danger: true,
                                separator: true,
                                onClick: () => handleDeleteAnalysis(item.id),
                              },
                            ]);
                          }}
                        >
                          <td className="py-4 font-bold text-ink">
                            {item.target_role || "General Resume Assessment"}
                          </td>
                          <td className="py-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${getScoreBadgeStyles(
                                item.score
                              )}`}
                            >
                              {item.score} / 100
                            </span>
                          </td>
                          <td className="py-4 text-ink-muted">{formatDate(item.created_at)}</td>
                          <td className="py-4 text-right flex items-center justify-end gap-2">
                            <Link
                              href={`/dashboard/${item.id}`}
                              className="inline-block px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-ink bg-paper-card group-hover:border-accent-border group-hover:text-accent transition-all no-underline"
                            >
                              View Report →
                            </Link>
                            <button
                              onClick={() => handleDeleteAnalysis(item.id)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-transparent text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all cursor-pointer"
                              title="Delete Review"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Mobile list view for reviews */}
                  <div className="space-y-4 sm:hidden">
                    {pagedAnalyses.map((item) => (
                      <div
                        key={item.id}
                        className="glass-card bg-paper-card p-4 rounded-xl border border-border flex flex-col gap-3"
                        onContextMenu={(e) => {
                          showContextMenu(e, [
                            {
                              key: "view",
                              label: "View Report",
                              icon: "📊",
                              onClick: () => router.push(`/dashboard/${item.id}`),
                            },
                            {
                              key: "tailor",
                              label: "Open in Tailor Sandbox",
                              icon: "✨",
                              onClick: () => router.push(`/dashboard/tailor?analysisId=${item.id}`),
                            },
                            {
                              key: "delete",
                              label: "Delete Review",
                              icon: "🗑️",
                              danger: true,
                              separator: true,
                              onClick: () => handleDeleteAnalysis(item.id),
                            },
                          ]);
                        }}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="font-bold text-ink leading-tight">
                            {item.target_role || "General Resume Assessment"}
                          </div>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold border shrink-0 ${getScoreBadgeStyles(
                              item.score
                            )}`}
                          >
                            {item.score} / 100
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-ink-muted">
                          <span>{formatDate(item.created_at)}</span>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/dashboard/${item.id}`}
                              className="inline-block px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-ink bg-paper-card hover:border-accent-border hover:text-accent transition-all no-underline"
                            >
                              View Report →
                            </Link>
                            <button
                              onClick={() => handleDeleteAnalysis(item.id)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-transparent text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all cursor-pointer"
                              title="Delete Review"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {reviewsTotalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-4 px-2">
                      <div className="text-xs text-ink-muted">
                        Showing <span className="font-semibold text-ink">{(reviewsPage - 1) * PAGE_SIZE + 1}</span> to{" "}
                        <span className="font-semibold text-ink">
                          {Math.min(reviewsPage * PAGE_SIZE, filteredAnalyses.length)}
                        </span>{" "}
                        of <span className="font-semibold text-ink">{filteredAnalyses.length}</span> reviews
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setReviewsPage((prev) => Math.max(1, prev - 1))}
                          disabled={reviewsPage === 1}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-paper-card text-ink hover:bg-paper-warm hover:border-accent-border disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                          Previous
                        </button>
                        <div className="text-xs text-ink-muted font-medium px-2">
                          Page <span className="text-ink font-semibold">{reviewsPage}</span> of{" "}
                          <span className="text-ink font-semibold">{reviewsTotalPages}</span>
                        </div>
                        <button
                          onClick={() => setReviewsPage((prev) => Math.min(reviewsTotalPages, prev + 1))}
                          disabled={reviewsPage === reviewsTotalPages}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-paper-card text-ink hover:bg-paper-warm hover:border-accent-border disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : reviewsSearch ? (
                <EmptyState
                  illustration="search"
                  title="No reviews match your filter"
                  description={`No resume analyses found for "${reviewsSearch}". Try a different keyword or clear the filter.`}
                  compact
                />
              ) : (
                <EmptyState
                  illustration="resume"
                  title="No resume reviews yet"
                  description="Upload your resume and run your first AI analysis. You'll see your score history, progression chart, and detailed feedback here."
                  ctaHref="/"
                  ctaLabel="📄 Analyze My Resume"
                  compact
                />
              )
            ) : filteredApplications.length > 0 ? (
              <>
                <table className="hidden sm:table w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border text-ink-muted text-xs uppercase tracking-wider font-mono">
                      <th className="pb-3 font-semibold">Company & Role</th>
                      <th className="pb-3 font-semibold">Match Score</th>
                      <th className="pb-3 font-semibold">Priority</th>
                      <th className="pb-3 font-semibold">Applied Date</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedApplications.map((app) => {
                      const statusColor = APPLICATION_STATUS_COLORS[app.status] || { bg: "#f1f5f9", text: "#475569" };
                      return (
                        <tr
                          key={app.id}
                          className="border-b border-border/40 hover:bg-paper-warm/20 transition-all group"
                        >
                          <td className="py-4">
                            <div className="font-bold text-ink leading-tight">{app.job_title}</div>
                            <div className="text-xs text-ink-muted mt-0.5">{app.company_name}</div>
                          </td>
                          <td className="py-4">
                            {app.match_score !== null && app.match_score !== undefined ? (
                              <span
                                className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold border ${getScoreBadgeStyles(
                                  app.match_score
                                )}`}
                              >
                                {app.match_score}%
                              </span>
                            ) : (
                              <span className="text-ink-faint text-xs font-mono">—</span>
                            )}
                          </td>
                          <td className="py-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold border ${getPriorityBadgeStyles(
                                app.priority
                              )}`}
                            >
                              {app.priority}
                            </span>
                          </td>
                          <td className="py-4 text-ink-muted">
                            {app.applied_at ? formatDate(app.applied_at) : "Not applied yet"}
                          </td>
                          <td className="py-4">
                            <span
                              className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border"
                              style={{
                                backgroundColor: `${statusColor.bg}`,
                                color: `${statusColor.text}`,
                                borderColor: `${statusColor.text}1c`,
                              }}
                            >
                               {APPLICATION_STATUS_LABELS[app.status]}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <Link
                              href="/dashboard/applications"
                              className="inline-block px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-ink bg-paper-card group-hover:border-accent-border group-hover:text-accent transition-all no-underline"
                            >
                              Manage →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Mobile list view for applications */}
                <div className="space-y-4 sm:hidden">
                  {pagedApplications.map((app) => {
                    const statusColor = APPLICATION_STATUS_COLORS[app.status] || { bg: "#f1f5f9", text: "#475569" };
                    return (
                      <div
                        key={app.id}
                        className="glass-card bg-paper-card p-4 rounded-xl border border-border flex flex-col gap-3"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <div className="font-bold text-ink leading-tight">{app.job_title}</div>
                            <div className="text-xs text-ink-muted mt-0.5">{app.company_name}</div>
                          </div>
                          <span
                            className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border shrink-0"
                            style={{
                              backgroundColor: `${statusColor.bg}`,
                              color: `${statusColor.text}`,
                              borderColor: `${statusColor.text}1c`,
                            }}
                          >
                            {APPLICATION_STATUS_LABELS[app.status]}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex gap-2">
                            {app.match_score !== null && app.match_score !== undefined ? (
                              <span
                                className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${getScoreBadgeStyles(
                                  app.match_score
                                )}`}
                              >
                                {app.match_score}% match
                              </span>
                            ) : (
                              <span className="text-ink-faint font-mono">—</span>
                            )}
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getPriorityBadgeStyles(
                                app.priority
                              )}`}
                            >
                              {app.priority}
                            </span>
                          </div>
                          <span className="text-ink-muted">
                            {app.applied_at ? formatDate(app.applied_at) : "Not applied yet"}
                          </span>
                        </div>
                        <div className="flex justify-end border-t border-border/40 pt-2">
                          <Link
                            href="/dashboard/applications"
                            className="inline-block px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-ink bg-paper-card hover:border-accent-border hover:text-accent transition-all no-underline"
                          >
                            Manage →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {appsTotalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-4 px-2">
                    <div className="text-xs text-ink-muted">
                      Showing <span className="font-semibold text-ink">{(appsPage - 1) * PAGE_SIZE + 1}</span> to{" "}
                      <span className="font-semibold text-ink">
                        {Math.min(appsPage * PAGE_SIZE, filteredApplications.length)}
                      </span>{" "}
                      of <span className="font-semibold text-ink">{filteredApplications.length}</span> applications
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAppsPage((prev) => Math.max(1, prev - 1))}
                        disabled={appsPage === 1}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-paper-card text-ink hover:bg-paper-warm hover:border-accent-border disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        Previous
                      </button>
                      <div className="text-xs text-ink-muted font-medium px-2">
                        Page <span className="text-ink font-semibold">{appsPage}</span> of{" "}
                        <span className="text-ink font-semibold">{appsTotalPages}</span>
                      </div>
                      <button
                        onClick={() => setAppsPage((prev) => Math.min(appsTotalPages, prev + 1))}
                        disabled={appsPage === appsTotalPages}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-paper-card text-ink hover:bg-paper-warm hover:border-accent-border disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : appsSearch ? (
              <EmptyState
                illustration="search"
                title="No applications match your filter"
                description={`No tracked jobs found for "${appsSearch}". Try adjusting your search or clear it to see all tracked applications.`}
                compact
              />
            ) : (
              <EmptyState
                illustration="applications"
                title="No tracked applications yet"
                description="Start your job search pipeline. Track every company, role, and interview status — never miss a follow-up again."
                ctaHref="/dashboard/applications"
                ctaLabel="📋 Add Your First Application"
                compact
              />
            )}
          </div>
        </div>
      </div>

      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-paper-card border border-border/80 rounded-2xl p-6 max-w-md w-full shadow-2xl hover:scale-[1.01] transition-transform duration-300 relative overflow-hidden">
            {/* Ambient glow accent */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-red-500/10 rounded-full blur-2xl" />
            
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-ink mb-1">Delete Review</h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  Are you sure you want to delete this resume review? This action is permanent and cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTargetId(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-border rounded-xl text-sm font-semibold text-ink bg-paper-card hover:bg-paper-warm/50 hover:text-ink transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAnalysis}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-all shadow-md shadow-red-500/15 disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Review"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resume Diff Viewer */}
      <ResumeDiffViewer
        isOpen={diffOpen}
        onClose={() => setDiffOpen(false)}
      />
    </DashboardLayout>
  );
}
