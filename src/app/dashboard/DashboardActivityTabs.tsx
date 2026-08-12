"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { APPLICATION_STATUS_COLORS, APPLICATION_STATUS_LABELS } from "@/types";
import { SkeletonTable } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import { useContextMenu } from "@/components/ContextMenu";
import PrintButton from "@/components/PrintButton";
import { useDashboardData } from "@/hooks/useDashboardData";
import {
  FileText,
  ClipboardList,
  Target,
  GitCompare,
  Trash2,
  Sparkles,
  ArrowRight,
  CheckSquare,
  Square,
} from "lucide-react";

type Analysis = ReturnType<typeof useDashboardData>["analyses"][number];
type Application = ReturnType<typeof useDashboardData>["applications"][number];

interface Props {
  loading: boolean;
  analyses: Analysis[];
  applications: Application[];
  activeTab: string;
  setActiveTab: (t: "reviews" | "applications") => void;
  reviewsSearch: string;
  setReviewsSearch: (s: string) => void;
  appsSearch: string;
  setAppsSearch: (s: string) => void;
  reviewsPage: number;
  setReviewsPage: React.Dispatch<React.SetStateAction<number>>;
  appsPage: number;
  setAppsPage: React.Dispatch<React.SetStateAction<number>>;
  reviewsTotalPages: number;
  appsTotalPages: number;
  pagedAnalyses: Analysis[];
  pagedApplications: Application[];
  filteredAnalysesCount: number;
  filteredApplicationsCount: number;
  PAGE_SIZE: number;
  handleDeleteAnalysis: (ids: string | string[]) => void;
  setDiffOpen: (open: boolean) => void;
  formatDate: (d: string) => string;
  getScoreBadgeStyles: (score: number) => string;
  getPriorityBadgeStyles: (priority: string) => string;
}

export default function DashboardActivityTabs({
  loading,
  analyses,
  applications,
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
  handleDeleteAnalysis,
  setDiffOpen,
  formatDate,
  getScoreBadgeStyles,
  getPriorityBadgeStyles,
}: Props) {
  const router = useRouter();
  const { show: showContextMenu } = useContextMenu();

  // ── Multi-select state ──────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Prune selectedIds if items are deleted
  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const existing = new Set(analyses.map((a) => a.id));
      const next = new Set(Array.from(prev).filter((id) => existing.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [analyses]);

  const isAllSelected =
    pagedAnalyses.length > 0 && pagedAnalyses.every((a) => selectedIds.has(a.id));
  const isIndeterminate = pagedAnalyses.some((a) => selectedIds.has(a.id)) && !isAllSelected;

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pagedAnalyses.forEach((a) => next.delete(a.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pagedAnalyses.forEach((a) => next.add(a.id));
        return next;
      });
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleBulkDelete() {
    handleDeleteAnalysis(Array.from(selectedIds));
  }

  // Clear selection when switching tabs
  function handleTabSwitch(tab: "reviews" | "applications") {
    setSelectedIds(new Set());
    setActiveTab(tab);
  }

  return (
    <div className="glass-card bg-paper-card rounded-2xl border border-border overflow-hidden">
      {/* ── Tabs Navigation ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border p-4 gap-4 bg-paper-warm/20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTabSwitch("reviews")}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2"
            style={{
              color: activeTab === "reviews" ? "var(--accent)" : "var(--ink-muted)",
              background: activeTab === "reviews" ? "var(--accent-bg)" : "transparent",
              border: `1px solid ${activeTab === "reviews" ? "var(--accent-border)" : "transparent"}`,
              borderBottom:
                activeTab === "reviews" ? "2px solid var(--accent)" : "2px solid transparent",
              borderRadius: "10px 10px 0 0",
            }}
          >
            <FileText size={14} />
            <span>Resume Reviews ({analyses.length})</span>
          </button>
          <button
            onClick={() => handleTabSwitch("applications")}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2"
            style={{
              color: activeTab === "applications" ? "var(--accent)" : "var(--ink-muted)",
              background: activeTab === "applications" ? "var(--accent-bg)" : "transparent",
              border: `1px solid ${activeTab === "applications" ? "var(--accent-border)" : "transparent"}`,
              borderBottom:
                activeTab === "applications" ? "2px solid var(--accent)" : "2px solid transparent",
              borderRadius: "10px 10px 0 0",
            }}
          >
            <ClipboardList size={14} />
            <span>Tracked Jobs ({applications.length})</span>
          </button>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {activeTab === "reviews" && analyses.length >= 2 && (
            <button
              onClick={() => setDiffOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border border-border text-ink-muted hover:text-accent hover:border-accent-border bg-paper-card transition-all duration-200 flex-shrink-0"
              title="Compare two analyses side-by-side"
            >
              <GitCompare size={13} />
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

      {/* ── Bulk Delete Banner ── */}
      {selectedIds.size > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 20px",
            background: "rgba(239,68,68,0.06)",
            borderBottom: "1px solid rgba(239,68,68,0.18)",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: "#dc2626",
              fontFamily: "Instrument Sans, sans-serif",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <CheckSquare size={14} />
            {selectedIds.size} review{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setSelectedIds(new Set())}
              style={{
                padding: "5px 12px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--ink-muted)",
                fontSize: 11.5,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "Instrument Sans, sans-serif",
                transition: "all 0.15s",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleBulkDelete}
              style={{
                padding: "5px 14px",
                borderRadius: 8,
                border: "none",
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                color: "white",
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "Instrument Sans, sans-serif",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                boxShadow: "0 2px 8px rgba(239,68,68,0.3)",
                transition: "all 0.15s",
              }}
            >
              <Trash2 size={12} />
              Delete {selectedIds.size} selected
            </button>
          </div>
        </div>
      )}

      {/* ── Table Contents ── */}
      <div className="p-4 overflow-x-auto">
        {loading ? (
          <div className="px-4 py-6">
            <SkeletonTable rows={4} cols={4} />
          </div>
        ) : activeTab === "reviews" ? (
          filteredAnalysesCount > 0 ? (
            <>
              {/* Desktop table */}
              <table className="hidden sm:table w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-ink-muted text-xs uppercase tracking-wider font-mono">
                    {/* Select-all checkbox */}
                    <th className="pb-3 pr-3 w-8">
                      <button
                        onClick={toggleSelectAll}
                        aria-label="Select all"
                        style={{
                          cursor: "pointer",
                          color:
                            isIndeterminate || isAllSelected ? "var(--accent)" : "var(--ink-faint)",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {isAllSelected ? (
                          <CheckSquare size={15} />
                        ) : isIndeterminate ? (
                          <span
                            style={{
                              width: 15,
                              height: 15,
                              borderRadius: 3,
                              border: "2px solid var(--accent)",
                              background: "var(--accent-bg)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <span
                              style={{
                                width: 8,
                                height: 2,
                                background: "var(--accent)",
                                borderRadius: 1,
                              }}
                            />
                          </span>
                        ) : (
                          <Square size={15} />
                        )}
                      </button>
                    </th>
                    <th className="pb-3 font-semibold">Target Role</th>
                    <th className="pb-3 font-semibold text-center">Score</th>
                    <th className="pb-3 font-semibold">Date Reviewed</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedAnalyses.map((item) => {
                    const isSelected = selectedIds.has(item.id);
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-border/40 hover:bg-paper-warm/20 transition-all group cursor-context-menu"
                        style={{ background: isSelected ? "rgba(239,68,68,0.04)" : undefined }}
                        onContextMenu={(e) => {
                          showContextMenu(e, [
                            {
                              key: "view",
                              label: "View Report",
                              icon: <Target size={14} />,
                              shortcut: "Enter",
                              onClick: () => router.push(`/dashboard/${item.id}`),
                            },
                            {
                              key: "tailor",
                              label: "Open in Tailor Sandbox",
                              icon: <Sparkles size={14} />,
                              onClick: () => router.push(`/dashboard/tailor?analysisId=${item.id}`),
                            },
                            {
                              key: "copy-score",
                              label: `Copy Score (${item.score}/100)`,
                              icon: <ClipboardList size={14} />,
                              onClick: () =>
                                navigator.clipboard.writeText(
                                  `ATS Score: ${item.score}/100 — ${item.target_role || "General Resume"}`
                                ),
                            },
                            {
                              key: "delete",
                              label: "Delete Review",
                              icon: <Trash2 size={14} className="text-red-500" />,
                              danger: true,
                              separator: true,
                              onClick: () => handleDeleteAnalysis(item.id),
                            },
                          ]);
                        }}
                      >
                        {/* Row checkbox */}
                        <td className="py-4 pr-3 w-8">
                          <button
                            onClick={() => toggleSelect(item.id)}
                            aria-label={`Select ${item.target_role || "review"}`}
                            style={{
                              cursor: "pointer",
                              color: isSelected ? "var(--accent)" : "var(--ink-faint)",
                              display: "flex",
                              alignItems: "center",
                              transition: "color 0.15s",
                            }}
                          >
                            {isSelected ? <CheckSquare size={15} /> : <Square size={15} />}
                          </button>
                        </td>
                        <td className="py-4 font-bold text-ink">
                          {item.target_role || "General Resume Assessment"}
                        </td>
                        <td className="py-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${getScoreBadgeStyles(item.score)}`}
                          >
                            {item.score} / 100
                          </span>
                        </td>
                        <td className="py-4 text-ink-muted">{formatDate(item.created_at)}</td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/dashboard/${item.id}`}
                              className="inline-flex items-center gap-1 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-ink bg-paper-card group-hover:border-accent-border group-hover:text-accent transition-all no-underline"
                            >
                              View Report <ArrowRight size={11} />
                            </Link>
                            <button
                              onClick={() => handleDeleteAnalysis(item.id)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-transparent text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all cursor-pointer flex items-center justify-center"
                              title="Delete Review"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Mobile list — reviews */}
              <div className="space-y-3 sm:hidden">
                {pagedAnalyses.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <div
                      key={item.id}
                      className="glass-card bg-paper-card p-4 rounded-xl border flex flex-col gap-3 transition-all"
                      style={{
                        borderColor: isSelected ? "var(--accent-border)" : "var(--border)",
                        background: isSelected ? "var(--accent-bg)" : undefined,
                      }}
                      onContextMenu={(e) => {
                        showContextMenu(e, [
                          {
                            key: "view",
                            label: "View Report",
                            icon: <Target size={14} />,
                            onClick: () => router.push(`/dashboard/${item.id}`),
                          },
                          {
                            key: "tailor",
                            label: "Open in Tailor Sandbox",
                            icon: <Sparkles size={14} />,
                            onClick: () => router.push(`/dashboard/tailor?analysisId=${item.id}`),
                          },
                          {
                            key: "delete",
                            label: "Delete Review",
                            icon: <Trash2 size={14} className="text-red-500" />,
                            danger: true,
                            separator: true,
                            onClick: () => handleDeleteAnalysis(item.id),
                          },
                        ]);
                      }}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <button
                            onClick={() => toggleSelect(item.id)}
                            style={{
                              color: isSelected ? "var(--accent)" : "var(--ink-faint)",
                              flexShrink: 0,
                              marginTop: 1,
                            }}
                          >
                            {isSelected ? <CheckSquare size={15} /> : <Square size={15} />}
                          </button>
                          <div className="font-bold text-ink leading-tight truncate">
                            {item.target_role || "General Resume Assessment"}
                          </div>
                        </div>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold border shrink-0 ${getScoreBadgeStyles(item.score)}`}
                        >
                          {item.score} / 100
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-ink-muted">
                        <span>{formatDate(item.created_at)}</span>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/${item.id}`}
                            className="inline-flex items-center gap-1 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-ink bg-paper-card hover:border-accent-border hover:text-accent transition-all no-underline"
                          >
                            View Report <ArrowRight size={11} />
                          </Link>
                          <button
                            onClick={() => handleDeleteAnalysis(item.id)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-transparent text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all cursor-pointer flex items-center justify-center"
                            title="Delete Review"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {reviewsTotalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-4 px-2">
                  <div className="text-xs text-ink-muted">
                    Showing{" "}
                    <span className="font-semibold text-ink">
                      {(reviewsPage - 1) * PAGE_SIZE + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold text-ink">
                      {Math.min(reviewsPage * PAGE_SIZE, filteredAnalysesCount)}
                    </span>{" "}
                    of <span className="font-semibold text-ink">{filteredAnalysesCount}</span>{" "}
                    reviews
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
                      onClick={() =>
                        setReviewsPage((prev) => Math.min(reviewsTotalPages, prev + 1))
                      }
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
              ctaLabel="Analyze My Resume"
              compact
            />
          )
        ) : filteredApplicationsCount > 0 ? (
          <>
            {/* Desktop table — Tracked Jobs */}
            <table className="hidden sm:table w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-ink-muted text-xs uppercase tracking-wider font-mono">
                  <th className="pb-3 font-semibold">Company &amp; Role</th>
                  <th className="pb-3 font-semibold">Match Score</th>
                  <th className="pb-3 font-semibold">Priority</th>
                  <th className="pb-3 font-semibold">Applied Date</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {pagedApplications.map((app) => {
                  const statusColor = APPLICATION_STATUS_COLORS[app.status] || {
                    bg: "#f1f5f9",
                    text: "#475569",
                  };
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
                            className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold border ${getScoreBadgeStyles(app.match_score)}`}
                          >
                            {app.match_score}%
                          </span>
                        ) : (
                          <span className="text-ink-faint text-xs font-mono">—</span>
                        )}
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold border ${getPriorityBadgeStyles(app.priority)}`}
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
                            backgroundColor: statusColor.bg,
                            color: statusColor.text,
                            borderColor: `${statusColor.text}1c`,
                          }}
                        >
                          {APPLICATION_STATUS_LABELS[app.status]}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <Link
                          href="/dashboard/applications"
                          className="inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-ink bg-paper-card group-hover:border-accent-border group-hover:text-accent transition-all no-underline"
                        >
                          Manage <ArrowRight size={11} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile list — applications */}
            <div className="space-y-4 sm:hidden">
              {pagedApplications.map((app) => {
                const statusColor = APPLICATION_STATUS_COLORS[app.status] || {
                  bg: "#f1f5f9",
                  text: "#475569",
                };
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
                          backgroundColor: statusColor.bg,
                          color: statusColor.text,
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
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${getScoreBadgeStyles(app.match_score)}`}
                          >
                            {app.match_score}% match
                          </span>
                        ) : (
                          <span className="text-ink-faint font-mono">—</span>
                        )}
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getPriorityBadgeStyles(app.priority)}`}
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
                        className="inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-ink bg-paper-card hover:border-accent-border hover:text-accent transition-all no-underline"
                      >
                        Manage <ArrowRight size={11} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {appsTotalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-4 px-2">
                <div className="text-xs text-ink-muted">
                  Showing{" "}
                  <span className="font-semibold text-ink">{(appsPage - 1) * PAGE_SIZE + 1}</span>{" "}
                  to{" "}
                  <span className="font-semibold text-ink">
                    {Math.min(appsPage * PAGE_SIZE, filteredApplicationsCount)}
                  </span>{" "}
                  of <span className="font-semibold text-ink">{filteredApplicationsCount}</span>{" "}
                  applications
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
            ctaLabel="Add Your First Application"
            compact
          />
        )}
      </div>
    </div>
  );
}
