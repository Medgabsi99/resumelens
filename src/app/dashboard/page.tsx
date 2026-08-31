"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import DashboardLayout from "@/components/DashboardLayout";
import ResumeDiffViewer from "@/components/ResumeDiffViewer";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useScoreChart } from "@/hooks/useScoreChart";
import DashboardStatsGrid from "./DashboardStatsGrid";
import DashboardCharts from "./DashboardCharts";
import DashboardActivityTabs from "./DashboardActivityTabs";
import {
  FileText,
  ClipboardList,
  AlertTriangle,
  Trash2,
  Sparkles,
  Building2,
  Eye,
  Rocket,
  Mic,
  Download,
} from "lucide-react";
import { playSound } from "@/lib/soundFx";

const CompanyCultureBenchmarkModal = dynamic(
  () => import("@/components/CompanyCultureBenchmarkModal"),
  { ssr: false }
);
const PreFlightLaunchpadModal = dynamic(() => import("@/components/PreFlightLaunchpadModal"), {
  ssr: false,
});
const StarInterviewCoachModal = dynamic(() => import("@/components/StarInterviewCoachModal"), {
  ssr: false,
});
const ExportStationModal = dynamic(() => import("@/components/ExportStationModal"), { ssr: false });
const SixSecondRecruiterSimulator = dynamic(
  () => import("@/components/SixSecondRecruiterSimulator"),
  { ssr: false }
);

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    analyses,
    applications,
    loading,
    error,
    activeTab,
    setActiveTab,
    reviewsSearch,
    setReviewsSearch,
    appsSearch,
    setAppsSearch,
    reviewsPage,
    setReviewsPage,
    appsPage,
    setAppsPage,
    reviewsTotalPages,
    appsTotalPages,
    pagedAnalyses,
    pagedApplications,
    filteredAnalysesCount,
    filteredApplicationsCount,
    PAGE_SIZE,
    deleteTargetIds,
    setDeleteTargetIds,
    isDeleting,
    handleDeleteAnalysis,
    confirmDeleteAnalysis,
    diffOpen,
    setDiffOpen,
    stats,
    funnelData,
    formatDate,
  } = useDashboardData();

  const [showCultureModal, setShowCultureModal] = useState(false);
  const [showPreFlightModal, setShowPreFlightModal] = useState(false);
  const [showStarModal, setShowStarModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showRecruiterModal, setShowRecruiterModal] = useState(false);

  const defaultSampleResume =
    "Senior Software Engineer with experience in React, TypeScript, Node.js, and AWS microservices.";

  const { chartPeriod, setChartPeriod, hoveredPoint, setHoveredPoint, scoreChartData } =
    useScoreChart(analyses, formatDate);

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
      <div className="workspace-canvas">
        <div className="max-w-7xl mx-auto fade-up">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-4xl font-bold tracking-tight text-ink mb-1.5">
                Dashboard Overview
              </h1>
              <p className="text-ink-muted text-sm">
                Track resume improvements, analyze ATS performance, and review your job search
                pipeline.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="btn-gradient px-4 py-2.5 rounded-xl text-sm font-semibold no-underline text-center shadow-lg hover:scale-[1.02] active:scale-[1] transition-all duration-200 flex items-center justify-center gap-2"
              >
                <FileText size={15} />
                <span>New Analysis</span>
              </Link>
              <Link
                href="/dashboard/applications"
                className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-border bg-paper-card text-ink text-center hover:bg-paper-warm hover:border-accent-border transition-all duration-200 flex items-center justify-center gap-2"
              >
                <ClipboardList size={15} />
                <span>Track Application</span>
              </Link>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 text-sm flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          <DashboardStatsGrid stats={stats} loading={loading} />

          {/* ── Transcendent AI Command Suite ─────────────────── */}
          <div className="mb-8 p-6 rounded-2xl border border-white/20 dark:border-white/10 bg-gradient-to-r from-accent/5 via-blue-500/5 to-emerald-500/5 backdrop-blur-md flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-accent/10 text-accent">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold font-display text-ink flex items-center gap-2">
                    <span>Transcendent Career Intelligence Suite</span>
                    <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold bg-accent text-white shadow-xs">
                      LIVE
                    </span>
                  </h2>
                  <p className="text-xs text-ink-muted">
                    Instant 1-click executive simulations, cultural rubric benchmarks, and
                    pre-flight checks.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <button
                onClick={() => {
                  playSound("click");
                  setShowCultureModal(true);
                }}
                className="p-3.5 rounded-xl border border-border bg-paper-card hover:bg-paper-warm hover:border-accent/40 text-left transition flex flex-col gap-1.5 cursor-pointer group shadow-xs"
              >
                <div className="flex items-center justify-between text-indigo-500">
                  <Building2 size={16} />
                  <span className="text-[10px] font-mono font-bold group-hover:translate-x-0.5 transition-transform">
                    ➔
                  </span>
                </div>
                <span className="text-xs font-bold text-ink group-hover:text-accent transition-colors">
                  FAANG Rubrics
                </span>
                <span className="text-[10px] text-ink-faint">Google, Amazon, Stripe</span>
              </button>

              <button
                onClick={() => {
                  playSound("click");
                  setShowRecruiterModal(true);
                }}
                className="p-3.5 rounded-xl border border-border bg-paper-card hover:bg-paper-warm hover:border-accent/40 text-left transition flex flex-col gap-1.5 cursor-pointer group shadow-xs"
              >
                <div className="flex items-center justify-between text-orange-500">
                  <Eye size={16} />
                  <span className="text-[10px] font-mono font-bold group-hover:translate-x-0.5 transition-transform">
                    ➔
                  </span>
                </div>
                <span className="text-xs font-bold text-ink group-hover:text-accent transition-colors">
                  6s Recruiter Sim
                </span>
                <span className="text-[10px] text-ink-faint">Eye-tracking F-pattern</span>
              </button>

              <button
                onClick={() => {
                  playSound("click");
                  setShowPreFlightModal(true);
                }}
                className="p-3.5 rounded-xl border border-border bg-paper-card hover:bg-paper-warm hover:border-accent/40 text-left transition flex flex-col gap-1.5 cursor-pointer group shadow-xs"
              >
                <div className="flex items-center justify-between text-emerald-500">
                  <Rocket size={16} />
                  <span className="text-[10px] font-mono font-bold group-hover:translate-x-0.5 transition-transform">
                    ➔
                  </span>
                </div>
                <span className="text-xs font-bold text-ink group-hover:text-accent transition-colors">
                  Pre-Flight Check
                </span>
                <span className="text-[10px] text-ink-faint">6-Point scan &amp; QR seal</span>
              </button>

              <button
                onClick={() => {
                  playSound("click");
                  setShowStarModal(true);
                }}
                className="p-3.5 rounded-xl border border-border bg-paper-card hover:bg-paper-warm hover:border-accent/40 text-left transition flex flex-col gap-1.5 cursor-pointer group shadow-xs"
              >
                <div className="flex items-center justify-between text-amber-500">
                  <Mic size={16} />
                  <span className="text-[10px] font-mono font-bold group-hover:translate-x-0.5 transition-transform">
                    ➔
                  </span>
                </div>
                <span className="text-xs font-bold text-ink group-hover:text-accent transition-colors">
                  AI STAR Coach
                </span>
                <span className="text-[10px] text-ink-faint">Behavioral prep &amp; timer</span>
              </button>

              <button
                onClick={() => {
                  playSound("click");
                  setShowExportModal(true);
                }}
                className="p-3.5 rounded-xl border border-border bg-paper-card hover:bg-paper-warm hover:border-accent/40 text-left transition flex flex-col gap-1.5 cursor-pointer group shadow-xs"
              >
                <div className="flex items-center justify-between text-accent">
                  <Download size={16} />
                  <span className="text-[10px] font-mono font-bold group-hover:translate-x-0.5 transition-transform">
                    ➔
                  </span>
                </div>
                <span className="text-xs font-bold text-ink group-hover:text-accent transition-colors">
                  Export Station
                </span>
                <span className="text-[10px] text-ink-faint">PDF/A-1b, DOCX, LinkedIn</span>
              </button>
            </div>
          </div>

          <DashboardCharts
            loading={loading}
            applications={applications}
            funnelData={funnelData}
            scoreChartData={scoreChartData}
            chartPeriod={chartPeriod}
            hoveredPoint={hoveredPoint}
            setChartPeriod={setChartPeriod}
            setHoveredPoint={setHoveredPoint}
          />

          <DashboardActivityTabs
            loading={loading}
            analyses={analyses}
            applications={applications}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            reviewsSearch={reviewsSearch}
            setReviewsSearch={setReviewsSearch}
            appsSearch={appsSearch}
            setAppsSearch={setAppsSearch}
            reviewsPage={reviewsPage}
            setReviewsPage={setReviewsPage}
            appsPage={appsPage}
            setAppsPage={setAppsPage}
            reviewsTotalPages={reviewsTotalPages}
            appsTotalPages={appsTotalPages}
            pagedAnalyses={pagedAnalyses}
            pagedApplications={pagedApplications}
            filteredAnalysesCount={filteredAnalysesCount}
            filteredApplicationsCount={filteredApplicationsCount}
            PAGE_SIZE={PAGE_SIZE}
            handleDeleteAnalysis={handleDeleteAnalysis}
            setDiffOpen={setDiffOpen}
            formatDate={formatDate}
            getScoreBadgeStyles={getScoreBadgeStyles}
            getPriorityBadgeStyles={getPriorityBadgeStyles}
          />
        </div>
      </div>

      {deleteTargetIds.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-paper-card border border-border/80 rounded-2xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-red-500/15 rounded-full blur-3xl" />

            <div className="flex items-start gap-4 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0 shadow-sm">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink mb-1 font-display">
                  {deleteTargetIds.length === 1
                    ? "Delete Resume Review"
                    : `Delete ${deleteTargetIds.length} Resume Reviews`}
                </h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  {deleteTargetIds.length === 1
                    ? "Are you sure you want to delete this resume review? This action is permanent and cannot be undone."
                    : `Are you sure you want to delete these ${deleteTargetIds.length} selected resume reviews? This action is permanent and cannot be undone.`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/40">
              <button
                onClick={() => setDeleteTargetIds([])}
                disabled={isDeleting}
                className="px-4 py-2 border border-border rounded-xl text-sm font-semibold text-ink bg-paper-card hover:bg-paper-warm/60 transition-all disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAnalysis}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 transition-all shadow-md shadow-red-500/25 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    <span>
                      {deleteTargetIds.length === 1
                        ? "Delete Review"
                        : `Delete ${deleteTargetIds.length} Reviews`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ResumeDiffViewer isOpen={diffOpen} onClose={() => setDiffOpen(false)} />

      {/* ── Transcendent Modals ────────────────────────────── */}
      {showCultureModal && (
        <CompanyCultureBenchmarkModal
          isOpen={showCultureModal}
          onClose={() => setShowCultureModal(false)}
          resumeText={defaultSampleResume}
        />
      )}

      {showPreFlightModal && (
        <PreFlightLaunchpadModal
          isOpen={showPreFlightModal}
          onClose={() => setShowPreFlightModal(false)}
          resumeText={defaultSampleResume}
          targetRole={analyses?.[0]?.target_role || "Software Engineer"}
        />
      )}

      {showStarModal && (
        <StarInterviewCoachModal
          isOpen={showStarModal}
          onClose={() => setShowStarModal(false)}
          bulletText="Architected and deployed distributed microservices in Node.js, slashing p99 latency by 45%."
          targetRole={analyses?.[0]?.target_role || "Software Engineer"}
        />
      )}

      {showExportModal && (
        <ExportStationModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          resumeText={defaultSampleResume}
          targetRole={analyses?.[0]?.target_role || "Software Engineer"}
        />
      )}

      {showRecruiterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl relative shadow-2xl rounded-3xl overflow-hidden">
            <button
              onClick={() => {
                playSound("click");
                setShowRecruiterModal(false);
              }}
              className="absolute top-4 right-4 z-30 p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-paper-warm transition"
            >
              ✕
            </button>
            <SixSecondRecruiterSimulator
              resumeText={defaultSampleResume}
              targetRole={analyses?.[0]?.target_role || "Software Engineer"}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
