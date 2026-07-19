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
  useEffect(() => { setMounted(true); }, []);

  const {
    analyses, applications, loading, error,
    activeTab, setActiveTab,
    reviewsSearch, setReviewsSearch,
    appsSearch, setAppsSearch,
    reviewsPage, setReviewsPage,
    appsPage, setAppsPage,
    reviewsTotalPages, appsTotalPages,
    pagedAnalyses, pagedApplications,
    filteredAnalysesCount, filteredApplicationsCount, PAGE_SIZE,
    deleteTargetId, setDeleteTargetId,
    isDeleting, handleDeleteAnalysis, confirmDeleteAnalysis,
    diffOpen, setDiffOpen,
    stats, funnelData, formatDate,
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
      case "high":   return "text-rose-500 bg-rose-500/10 border-rose-500/20";
      case "medium": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      default:       return "text-slate-500 bg-slate-500/10 border-slate-500/20";
    }
  };

  if (!mounted) return null;

  return (
    <DashboardLayout>
      <div className="fade-up">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-ink mb-1.5">Dashboard Overview</h1>
            <p className="text-ink-muted text-sm">Track resume improvements, analyze ATS performance, and review your job search pipeline.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="btn-gradient px-4 py-2.5 rounded-xl text-sm font-semibold no-underline text-center shadow-lg hover:scale-[1.02] active:scale-[1] transition-all duration-200 flex items-center justify-center gap-2">
              <FileText size={15} /><span>New Analysis</span>
            </Link>
            <Link href="/dashboard/applications" className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-border bg-paper-card text-ink text-center hover:bg-paper-warm hover:border-accent-border transition-all duration-200 flex items-center justify-center gap-2">
              <ClipboardList size={15} /><span>Track Application</span>
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 text-sm flex items-center gap-2">
            <AlertTriangle size={16} /><span>{error}</span>
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

      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-paper-card border border-border/80 rounded-2xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-red-500/10 rounded-full blur-2xl" />
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0"><Trash2 size={20} /></div>
              <div>
                <h3 className="text-base font-bold text-ink mb-1">Delete Review</h3>
                <p className="text-sm text-ink-muted leading-relaxed">Are you sure you want to delete this resume review? This action is permanent and cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTargetId(null)} disabled={isDeleting} className="px-4 py-2 border border-border rounded-xl text-sm font-semibold text-ink bg-paper-card hover:bg-paper-warm/50 transition-all disabled:opacity-50">Cancel</button>
              <button onClick={confirmDeleteAnalysis} disabled={isDeleting} className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-all shadow-md shadow-red-500/15 disabled:opacity-50 flex items-center gap-2">
                {isDeleting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting...</> : "Delete Review"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ResumeDiffViewer isOpen={diffOpen} onClose={() => setDiffOpen(false)} />
    </DashboardLayout>
  );
}