"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import ResumeDiffViewer from "@/components/ResumeDiffViewer";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useScoreChart } from "@/hooks/useScoreChart";
import DashboardStatsGrid from "./DashboardStatsGrid";
import DashboardCharts from "./DashboardCharts";
import DashboardActivityTabs from "./DashboardActivityTabs";
import { FileText, ClipboardList, AlertTriangle, Trash2 } from "lucide-react";

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
    </DashboardLayout>
  );
}
