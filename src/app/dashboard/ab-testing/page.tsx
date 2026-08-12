"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import SpotlightCard from "@/components/SpotlightCard";
import { useDashboardData } from "@/hooks/useDashboardData";
import {
  GitCompare,
  ArrowRight,
  Check,
  X,
  Star,
  AlertTriangle,
  Play,
  Sparkles,
  FileText,
  Briefcase,
} from "lucide-react";
import { type AnalysisResult } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SavedAnalysis {
  id: string;
  score: number;
  target_role: string | null;
  resume_text: string;
  job_description: string | null;
  result_json: string; // JSON string of AnalysisResult
  created_at: string;
}

export default function AbTestingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch dashboard data to get list of past reviews
  const { analyses: rawAnalyses, loading: dataLoading } = useDashboardData();
  const analyses = rawAnalyses as unknown as SavedAnalysis[];

  // Selection states
  const [selectedIdA, setSelectedIdA] = useState<string>("");
  const [selectedIdB, setSelectedIdB] = useState<string>("");

  // Fetched full analysis states for "saved" mode
  const [fetchedAnalysisA, setFetchedAnalysisA] = useState<SavedAnalysis | null>(null);
  const [fetchedAnalysisB, setFetchedAnalysisB] = useState<SavedAnalysis | null>(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);

  // Load baseline full details when selectedIdA changes
  useEffect(() => {
    if (!selectedIdA) {
      setFetchedAnalysisA(null);
      return;
    }
    setLoadingA(true);
    fetch(`/api/analyses/${selectedIdA}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.data) {
          setFetchedAnalysisA(resData.data);
        }
      })
      .catch((err) => console.error("Error fetching analysis A:", err))
      .finally(() => setLoadingA(false));
  }, [selectedIdA]);

  // Load comparison full details when selectedIdB changes
  useEffect(() => {
    if (!selectedIdB) {
      setFetchedAnalysisB(null);
      return;
    }
    setLoadingB(true);
    fetch(`/api/analyses/${selectedIdB}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.data) {
          setFetchedAnalysisB(resData.data);
        }
      })
      .catch((err) => console.error("Error fetching analysis B:", err))
      .finally(() => setLoadingB(false));
  }, [selectedIdB]);

  // Mode states: "saved" (compare 2 existing) vs "test-jd" (test 2 resumes against a new JD)
  const [mode, setMode] = useState<"saved" | "test-jd">("saved");

  // New A/B test states
  const [newJd, setNewJd] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [resumeTextA, setResumeTextA] = useState("");
  const [resumeTextB, setResumeTextB] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  // Dynamic analysis results
  const [testResultA, setTestResultA] = useState<AnalysisResult | null>(null);
  const [testResultB, setTestResultB] = useState<AnalysisResult | null>(null);

  // ── Parsed Results ──────────────────────────────────────────────────────────

  const resultA = useMemo<AnalysisResult | null>(() => {
    if (mode === "test-jd") return testResultA;
    if (!fetchedAnalysisA) return null;
    try {
      return typeof fetchedAnalysisA.result_json === "string"
        ? JSON.parse(fetchedAnalysisA.result_json)
        : (fetchedAnalysisA.result_json as unknown as AnalysisResult);
    } catch {
      return null;
    }
  }, [mode, fetchedAnalysisA, testResultA]);

  const resultB = useMemo<AnalysisResult | null>(() => {
    if (mode === "test-jd") return testResultB;
    if (!fetchedAnalysisB) return null;
    try {
      return typeof fetchedAnalysisB.result_json === "string"
        ? JSON.parse(fetchedAnalysisB.result_json)
        : (fetchedAnalysisB.result_json as unknown as AnalysisResult);
    } catch {
      return null;
    }
  }, [mode, fetchedAnalysisB, testResultB]);

  // Target info for headers
  const infoA = useMemo(() => {
    if (mode === "test-jd") return { title: "Resume A", role: targetRole || "Target Role" };
    if (!fetchedAnalysisA) return { title: "Resume A", role: "General Review" };
    return {
      title: `Review (${new Date(fetchedAnalysisA.created_at).toLocaleDateString()})`,
      role: fetchedAnalysisA.target_role || "General Review",
    };
  }, [mode, fetchedAnalysisA, targetRole]);

  const infoB = useMemo(() => {
    if (mode === "test-jd") return { title: "Resume B", role: targetRole || "Target Role" };
    if (!fetchedAnalysisB) return { title: "Resume B", role: "General Review" };
    return {
      title: `Review (${new Date(fetchedAnalysisB.created_at).toLocaleDateString()})`,
      role: fetchedAnalysisB.target_role || "General Review",
    };
  }, [mode, fetchedAnalysisB, targetRole]);

  // ── Trigger A/B Test ────────────────────────────────────────────────────────

  const handleRunAbTest = async () => {
    if (!newJd.trim() || !resumeTextA.trim() || !resumeTextB.trim()) return;
    setIsTesting(true);
    setTestError(null);
    setTestResultA(null);
    setTestResultB(null);

    try {
      // Trigger two parallel POST requests to existing analyze API
      const [resA, resB] = await Promise.all([
        fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeText: resumeTextA, jobDescription: newJd, targetRole }),
        }),
        fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeText: resumeTextB, jobDescription: newJd, targetRole }),
        }),
      ]);

      const dataA = await resA.json();
      const dataB = await resB.json();

      if (!resA.ok || !dataA.success) throw new Error(dataA.error || "Failed to analyze Resume A");
      if (!resB.ok || !dataB.success) throw new Error(dataB.error || "Failed to analyze Resume B");

      setTestResultA(dataA.data);
      setTestResultB(dataB.data);
    } catch (err: unknown) {
      setTestError(err instanceof Error ? err.message : "A/B analysis failed.");
    } finally {
      setIsTesting(false);
    }
  };

  // Pre-fill forms when choosing template resumes in test mode
  const handleSelectQuickResume = (target: "A" | "B", id: string) => {
    const item = analyses.find((a) => a.id === id);
    if (!item) return;
    if (target === "A") {
      setResumeTextA(item.resume_text);
      if (item.job_description && !newJd) setNewJd(item.job_description);
      if (item.target_role && !targetRole) setTargetRole(item.target_role);
    } else {
      setResumeTextB(item.resume_text);
    }
  };

  // ── Recommendation logic ─────────────────────────────────────────────────────

  const recommendation = useMemo(() => {
    if (!resultA || !resultB) return null;
    const diff = resultA.score - resultB.score;
    const keywordsA = resultA.keywords_matched?.length ?? 0;
    const keywordsB = resultB.keywords_matched?.length ?? 0;
    const kwDiff = keywordsA - keywordsB;

    if (diff > 0) {
      return {
        winner: "Resume A",
        reason: `Scores ${diff} points higher (${resultA.score}% vs ${resultB.score}%) and matches ${keywordsA} keywords compared to ${keywordsB} on Resume B.`,
      };
    } else if (diff < 0) {
      return {
        winner: "Resume B",
        reason: `Scores ${Math.abs(diff)} points higher (${resultB.score}% vs ${resultA.score}%) and matches ${keywordsB} keywords compared to ${keywordsA} on Resume A.`,
      };
    } else {
      if (kwDiff > 0) {
        return {
          winner: "Resume A",
          reason: `Both resumes scored ${resultA.score}%, but Resume A has a better keyword alignment, matching ${kwDiff} more target keywords.`,
        };
      } else if (kwDiff < 0) {
        return {
          winner: "Resume B",
          reason: `Both resumes scored ${resultB.score}%, but Resume B has a better keyword alignment, matching ${Math.abs(kwDiff)} more target keywords.`,
        };
      } else {
        return {
          winner: "Tie",
          reason: `Both resumes are evenly matched with a score of ${resultA.score}% and identical keyword coverage. You can send either version.`,
        };
      }
    }
  }, [resultA, resultB]);

  // Loading skeleton state helper
  const Skeleton = ({ h = 180 }: { h?: number }) => (
    <div className="animate-pulse bg-paper-warm rounded-xl" style={{ height: h }} />
  );

  if (!mounted) return null;

  return (
    <DashboardLayout>
      <div className="workspace-canvas">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                <GitCompare size={22} className="text-accent" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-ink leading-tight">
                  A/B Resume Testing
                </h1>
                <p className="text-sm text-ink-muted mt-0.5">
                  Compare two resume versions side-by-side to optimize scores and keyword alignment
                  before applying.
                </p>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex bg-paper border border-border rounded-xl p-0.5 self-start">
              <button
                onClick={() => {
                  setMode("saved");
                  setSelectedIdA("");
                  setSelectedIdB("");
                }}
                className="cursor-pointer font-sans transition-all duration-150 px-3.5 py-1.5 rounded-lg text-xs font-bold"
                style={{
                  background: mode === "saved" ? "var(--accent)" : "transparent",
                  color: mode === "saved" ? "#fff" : "var(--ink-muted)",
                  border: "none",
                }}
              >
                Compare Existing Reviews
              </button>
              <button
                onClick={() => {
                  setMode("test-jd");
                }}
                className="cursor-pointer font-sans transition-all duration-150 px-3.5 py-1.5 rounded-lg text-xs font-bold"
                style={{
                  background: mode === "test-jd" ? "var(--accent)" : "transparent",
                  color: mode === "test-jd" ? "#fff" : "var(--ink-muted)",
                  border: "none",
                }}
              >
                Test New Job Description
              </button>
            </div>
          </div>

          {/* ── MODE 1: Compare Existing Reviews ────────────────────────────────── */}
          {mode === "saved" && (
            <SpotlightCard className="glass-card bg-paper-card border border-border rounded-2xl p-6">
              <h3 className="font-display text-base font-bold text-ink mb-4">
                Select Reviews to Compare
              </h3>
              {dataLoading ? (
                <Skeleton h={80} />
              ) : analyses.length < 2 ? (
                <div className="text-center py-8 border border-dashed border-border rounded-xl bg-paper-warm/20 flex flex-col items-center">
                  <AlertTriangle size={32} className="text-amber-500 mb-2" />
                  <p className="text-sm font-semibold text-ink mb-1">Insufficient data</p>
                  <p className="text-xs text-ink-muted mb-4 max-w-xs">
                    You need at least 2 historical resume analyses to compare them here.
                  </p>
                  <Link
                    href="/"
                    className="btn-gradient px-4 py-2 rounded-xl text-xs font-semibold no-underline text-white"
                  >
                    Analyze Resume
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-ink-faint">
                      Resume A (Baseline)
                    </label>
                    <select
                      value={selectedIdA}
                      onChange={(e) => setSelectedIdA(e.target.value)}
                      className="bg-paper border border-border rounded-xl px-3 py-2 text-xs font-medium text-ink outline-none"
                    >
                      <option value="">-- Choose Review A --</option>
                      {analyses
                        .filter((a) => a.id !== selectedIdB)
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.target_role || "General Review"} (
                            {new Date(a.created_at).toLocaleDateString()}) - Score: {a.score}%
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-ink-faint">
                      Resume B (Comparison)
                    </label>
                    <select
                      value={selectedIdB}
                      onChange={(e) => setSelectedIdB(e.target.value)}
                      className="bg-paper border border-border rounded-xl px-3 py-2 text-xs font-medium text-ink outline-none"
                    >
                      <option value="">-- Choose Review B --</option>
                      {analyses
                        .filter((a) => a.id !== selectedIdA)
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.target_role || "General Review"} (
                            {new Date(a.created_at).toLocaleDateString()}) - Score: {a.score}%
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}
            </SpotlightCard>
          )}

          {/* ── MODE 2: Test against New JD ────────────────────────────────────── */}
          {mode === "test-jd" && (
            <SpotlightCard className="glass-card bg-paper-card border border-border rounded-2xl p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-ink-faint">
                    Target Role Title (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Frontend Engineer"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="bg-paper border border-border rounded-xl px-3 py-2 text-xs font-medium text-ink outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-ink-faint">
                    Target Job Description
                  </label>
                  <textarea
                    placeholder="Paste requirements, stack specifications, or role details here..."
                    value={newJd}
                    onChange={(e) => setNewJd(e.target.value)}
                    rows={3}
                    className="bg-paper border border-border rounded-xl px-3 py-2 text-xs font-medium text-ink outline-none resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Resume A input */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-ink-faint font-semibold">
                      Resume Text A
                    </label>
                    {analyses.length > 0 && (
                      <select
                        onChange={(e) => handleSelectQuickResume("A", e.target.value)}
                        className="bg-paper border border-border/80 rounded-lg px-2 py-1 text-[10px] text-ink-muted outline-none"
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Load from past review...
                        </option>
                        {analyses.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.target_role || "Review"} (
                            {new Date(a.created_at).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <textarea
                    placeholder="Paste contents of Resume version A..."
                    value={resumeTextA}
                    onChange={(e) => setResumeTextA(e.target.value)}
                    rows={8}
                    className="w-full bg-paper border border-border rounded-xl px-3 py-2 text-xs font-mono text-ink outline-none"
                  />
                </div>

                {/* Resume B input */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-ink-faint font-semibold">
                      Resume Text B
                    </label>
                    {analyses.length > 0 && (
                      <select
                        onChange={(e) => handleSelectQuickResume("B", e.target.value)}
                        className="bg-paper border border-border/80 rounded-lg px-2 py-1 text-[10px] text-ink-muted outline-none"
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Load from past review...
                        </option>
                        {analyses.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.target_role || "Review"} (
                            {new Date(a.created_at).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <textarea
                    placeholder="Paste contents of Resume version B..."
                    value={resumeTextB}
                    onChange={(e) => setResumeTextB(e.target.value)}
                    rows={8}
                    className="w-full bg-paper border border-border rounded-xl px-3 py-2 text-xs font-mono text-ink outline-none"
                  />
                </div>
              </div>

              {testError && (
                <div className="text-xs text-red-500 font-medium bg-red-500/10 border border-red-500/25 p-3 rounded-xl flex items-center gap-2">
                  <AlertTriangle size={14} />
                  <span>{testError}</span>
                </div>
              )}

              <button
                onClick={handleRunAbTest}
                disabled={isTesting || !newJd.trim() || !resumeTextA.trim() || !resumeTextB.trim()}
                className="w-full btn-gradient py-2.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:scale-100 transition"
              >
                {isTesting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing both versions against job description...
                  </>
                ) : (
                  <>
                    <Play size={12} fill="currentColor" /> Run A/B Test Match
                  </>
                )}
              </button>
            </SpotlightCard>
          )}

          {/* ── COMPARATIVE SCORECARD VIEW ─────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {loadingA || loadingB ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton h={400} />
                <Skeleton h={400} />
              </div>
            ) : resultA && resultB ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                className="space-y-8"
              >
                {/* Recommendation Banner */}
                {recommendation && (
                  <div className="flex items-center gap-4 bg-emerald-400/8 border border-emerald-400/20 rounded-2xl px-6 py-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-400/15 flex items-center justify-center shrink-0">
                      <Sparkles className="text-emerald-400" size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-ink flex items-center gap-1.5">
                        Recommendation: Use{" "}
                        <span className="text-emerald-400 font-bold">{recommendation.winner}</span>
                      </h4>
                      <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                        {recommendation.reason}
                      </p>
                    </div>
                  </div>
                )}

                {/* Grid: Resume A vs Resume B */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Column A */}
                  <SpotlightCard className="glass-card bg-paper-card border border-border rounded-2xl p-6 space-y-6 relative overflow-hidden">
                    {recommendation?.winner === "Resume A" && (
                      <div className="absolute top-0 right-0 bg-emerald-500 text-white font-mono text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-xl flex items-center gap-1">
                        <Check size={10} strokeWidth={3} /> Recommended
                      </div>
                    )}

                    {/* Card Header */}
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-widest text-ink-faint">
                        {infoA.title}
                      </span>
                      <h3 className="font-display text-lg font-bold text-ink mt-0.5 truncate">
                        {infoA.role}
                      </h3>
                    </div>

                    {/* Score circle */}
                    <div className="flex items-center gap-4 bg-paper border border-border p-4 rounded-xl">
                      <div className="w-16 h-16 rounded-full border-4 border-accent/25 border-t-accent flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-extrabold text-accent">{resultA.score}%</span>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-ink-faint uppercase tracking-wider">
                          ATS MATCH SCORE
                        </div>
                        <div className="text-xs text-ink-muted leading-relaxed mt-0.5">
                          {resultA.summary}
                        </div>
                      </div>
                    </div>

                    {/* ATS Breakdown stats */}
                    {resultA.ats_breakdown && (
                      <div className="space-y-2.5">
                        <h4 className="text-[10px] font-mono uppercase tracking-widest text-ink-faint">
                          ATS Parameters
                        </h4>
                        {[
                          { label: "Format Safety", value: resultA.ats_breakdown.format },
                          { label: "Keyword Density", value: resultA.ats_breakdown.keywords },
                          { label: "Impact & Action Verbs", value: resultA.ats_breakdown.impact },
                          {
                            label: "Readability & Layout",
                            value: resultA.ats_breakdown.readability,
                          },
                        ].map((item) => (
                          <div key={item.label}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-ink-muted">{item.label}</span>
                              <span className="font-bold text-ink font-mono">{item.value}%</span>
                            </div>
                            <div className="h-2 w-full bg-paper rounded-full overflow-hidden border border-border">
                              <div
                                className="h-full bg-accent rounded-full"
                                style={{ width: `${item.value}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Keywords matched */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-ink-faint">
                        Matched Keywords ({resultA.keywords_matched?.length ?? 0})
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {resultA.keywords_matched?.slice(0, 15).map((k) => (
                          <span
                            key={k}
                            className="bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 px-2 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                          >
                            <Check size={10} /> {k}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Keywords missing */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-ink-faint">
                        Missing Keywords ({resultA.keywords_missing?.length ?? 0})
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {resultA.keywords_missing?.slice(0, 15).map((k) => (
                          <span
                            key={k}
                            className="bg-rose-400/10 text-rose-400 border border-rose-400/20 px-2 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                          >
                            <X size={10} /> {k}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Strengths */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-ink-faint">
                        Strengths
                      </h4>
                      <ul className="text-xs text-ink-muted space-y-1 pl-4 list-disc">
                        {resultA.strengths.slice(0, 4).map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Weaknesses */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-ink-faint">
                        Areas to Improve
                      </h4>
                      <ul className="text-xs text-ink-muted space-y-1 pl-4 list-disc">
                        {resultA.weaknesses.slice(0, 4).map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  </SpotlightCard>

                  {/* Column B */}
                  <SpotlightCard className="glass-card bg-paper-card border border-border rounded-2xl p-6 space-y-6 relative overflow-hidden">
                    {recommendation?.winner === "Resume B" && (
                      <div className="absolute top-0 right-0 bg-emerald-500 text-white font-mono text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-xl flex items-center gap-1">
                        <Check size={10} strokeWidth={3} /> Recommended
                      </div>
                    )}

                    {/* Card Header */}
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-widest text-ink-faint">
                        {infoB.title}
                      </span>
                      <h3 className="font-display text-lg font-bold text-ink mt-0.5 truncate">
                        {infoB.role}
                      </h3>
                    </div>

                    {/* Score circle */}
                    <div className="flex items-center gap-4 bg-paper border border-border p-4 rounded-xl">
                      <div className="w-16 h-16 rounded-full border-4 border-accent/25 border-t-accent flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-extrabold text-accent">{resultB.score}%</span>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-ink-faint uppercase tracking-wider">
                          ATS MATCH SCORE
                        </div>
                        <div className="text-xs text-ink-muted leading-relaxed mt-0.5">
                          {resultB.summary}
                        </div>
                      </div>
                    </div>

                    {/* ATS Breakdown stats */}
                    {resultB.ats_breakdown && (
                      <div className="space-y-2.5">
                        <h4 className="text-[10px] font-mono uppercase tracking-widest text-ink-faint">
                          ATS Parameters
                        </h4>
                        {[
                          { label: "Format Safety", value: resultB.ats_breakdown.format },
                          { label: "Keyword Density", value: resultB.ats_breakdown.keywords },
                          { label: "Impact & Action Verbs", value: resultB.ats_breakdown.impact },
                          {
                            label: "Readability & Layout",
                            value: resultB.ats_breakdown.readability,
                          },
                        ].map((item) => (
                          <div key={item.label}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-ink-muted">{item.label}</span>
                              <span className="font-bold text-ink font-mono">{item.value}%</span>
                            </div>
                            <div className="h-2 w-full bg-paper rounded-full overflow-hidden border border-border">
                              <div
                                className="h-full bg-accent rounded-full"
                                style={{ width: `${item.value}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Keywords matched */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-ink-faint">
                        Matched Keywords ({resultB.keywords_matched?.length ?? 0})
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {resultB.keywords_matched?.slice(0, 15).map((k) => (
                          <span
                            key={k}
                            className="bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 px-2 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                          >
                            <Check size={10} /> {k}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Keywords missing */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-ink-faint">
                        Missing Keywords ({resultB.keywords_missing?.length ?? 0})
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {resultB.keywords_missing?.slice(0, 15).map((k) => (
                          <span
                            key={k}
                            className="bg-rose-400/10 text-rose-400 border border-rose-400/20 px-2 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                          >
                            <X size={10} /> {k}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Strengths */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-ink-faint">
                        Strengths
                      </h4>
                      <ul className="text-xs text-ink-muted space-y-1 pl-4 list-disc">
                        {resultB.strengths.slice(0, 4).map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Weaknesses */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-ink-faint">
                        Areas to Improve
                      </h4>
                      <ul className="text-xs text-ink-muted space-y-1 pl-4 list-disc">
                        {resultB.weaknesses.slice(0, 4).map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  </SpotlightCard>
                </div>
              </motion.div>
            ) : (
              <div className="text-center py-16 border border-dashed border-border rounded-xl bg-paper-warm/20 flex flex-col items-center">
                <GitCompare size={36} className="text-ink-muted mb-3" />
                <p className="font-semibold text-ink text-sm mb-1">
                  Select resumes to begin analysis
                </p>
                <p className="text-xs text-ink-muted max-w-sm">
                  {mode === "saved"
                    ? "Choose two past reviews from the options above to contrast scores and match performance."
                    : "Input your job description, copy-paste or load two resume texts, and trigger the side-by-side scanner."}
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
