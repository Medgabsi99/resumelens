"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { JobApplication } from "@/types";

interface AnalysisItem {
  id: string;
  score: number;
  target_role: string | null;
  created_at: string;
}

const PAGE_SIZE = 8;

export function useDashboardData() {
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<"reviews" | "applications">("reviews");

  // Search filters
  const [reviewsSearch, setReviewsSearch] = useState("");
  const [appsSearch, setAppsSearch] = useState("");

  // Pagination
  const [reviewsPage, setReviewsPage] = useState(1);
  const [appsPage, setAppsPage] = useState(1);

  // Delete modal
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Diff viewer
  const [diffOpen, setDiffOpen] = useState(false);

  useEffect(() => {
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

  // Reset pages on search/tab change
  useEffect(() => { setReviewsPage(1); }, [reviewsSearch]);
  useEffect(() => { setAppsPage(1); }, [appsSearch]);
  useEffect(() => { setReviewsPage(1); setAppsPage(1); }, [activeTab]);

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

  const handleDeleteAnalysis = useCallback((id: string) => {
    setDeleteTargetId(id);
  }, []);

  const confirmDeleteAnalysis = useCallback(async () => {
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
    }
  }, [deleteTargetId]);

  const stats = useMemo(() => {
    const totalReviews = analyses.length;
    const avgScore = totalReviews > 0
      ? Math.round(analyses.reduce((acc, a) => acc + a.score, 0) / totalReviews)
      : 0;
    const totalApps = applications.length;
    const activePipelineCount = applications.filter((a) =>
      ["screening", "interviewing", "offer", "accepted"].includes(a.status)
    ).length;
    const successRate = totalApps > 0
      ? Math.round((activePipelineCount / totalApps) * 100)
      : 0;
    return { avgScore, totalReviews, totalApps, successRate };
  }, [analyses, applications]);

  const filteredAnalyses = useMemo(() =>
    analyses.filter((a) => {
      const role = a.target_role?.toLowerCase() || "general resume review";
      return role.includes(reviewsSearch.toLowerCase());
    }),
    [analyses, reviewsSearch]
  );

  const filteredApplications = useMemo(() =>
    applications.filter((a) => {
      const company = a.company_name.toLowerCase();
      const title = a.job_title.toLowerCase();
      const query = appsSearch.toLowerCase();
      return company.includes(query) || title.includes(query);
    }),
    [applications, appsSearch]
  );

  const reviewsTotalPages = Math.max(1, Math.ceil(filteredAnalyses.length / PAGE_SIZE));
  const appsTotalPages    = Math.max(1, Math.ceil(filteredApplications.length / PAGE_SIZE));
  const pagedAnalyses     = filteredAnalyses.slice((reviewsPage - 1) * PAGE_SIZE, reviewsPage * PAGE_SIZE);
  const pagedApplications = filteredApplications.slice((appsPage - 1) * PAGE_SIZE, appsPage * PAGE_SIZE);

  const funnelData = useMemo(() => {
    const groups = { saved: 0, applied: 0, screening: 0, interviewing: 0, offer: 0, accepted: 0 };
    applications.forEach((app) => {
      const status = app.status as keyof typeof groups;
      if (status in groups) groups[status]++;
    });
    const offerAcceptedCount = groups.offer + groups.accepted;
    const data = [
      { label: "Saved Jobs",    count: groups.saved,         color: "#94a3b8", bg: "rgba(148, 163, 184, 0.1)" },
      { label: "Applied",       count: groups.applied,       color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)"  },
      { label: "Screening",     count: groups.screening,     color: "#6366f1", bg: "rgba(99, 102, 241, 0.1)"  },
      { label: "Interviewing",  count: groups.interviewing,  color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)"  },
      { label: "Offers / Hired",count: offerAcceptedCount,   color: "#10b981", bg: "rgba(16, 185, 129, 0.1)"  },
    ];
    return { stages: data, maxCount: Math.max(...data.map((d) => d.count), 1) };
  }, [applications]);

  return {
    // Data
    analyses,
    applications,
    loading,
    error,
    // Tabs
    activeTab,
    setActiveTab,
    // Search
    reviewsSearch,
    setReviewsSearch,
    appsSearch,
    setAppsSearch,
    // Pagination
    reviewsPage,
    setReviewsPage,
    appsPage,
    setAppsPage,
    reviewsTotalPages,
    appsTotalPages,
    pagedAnalyses,
    pagedApplications,
    // Counts needed for "Showing X to Y of Z" labels
    filteredAnalysesCount: filteredAnalyses.length,
    filteredApplicationsCount: filteredApplications.length,
    PAGE_SIZE,
    // Delete
    deleteTargetId,
    setDeleteTargetId,
    isDeleting,
    handleDeleteAnalysis,
    confirmDeleteAnalysis,
    // Diff
    diffOpen,
    setDiffOpen,
    // Computed
    stats,
    funnelData,
    // Helpers
    formatDate,
  };
}
