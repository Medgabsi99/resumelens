import { useState, useEffect, useMemo } from "react";
import { JobApplication, ApplicationStatus } from "@/types";
import { daysUntil } from "./utils";

export function useApplications() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/applications");
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.error || "Failed to load applications");
        return;
      }
      setApplications(data.data || []);
    } catch (e) {
      console.error(e);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(app: JobApplication, newStatus: ApplicationStatus) {
    // Optimistic update
    setApplications((prev) =>
      prev.map((a) => (a.id === app.id ? { ...a, status: newStatus } : a))
    );

    try {
      const res = await fetch(`/api/applications/${app.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        await loadApplications();
      }
    } catch (e) {
      console.error(e);
      await loadApplications();
    }
  }

  async function handleDelete(app: JobApplication) {
    if (!confirm(`Delete application for ${app.job_title} at ${app.company_name}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/applications/${app.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setApplications((prev) => prev.filter((a) => a.id !== app.id));
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.error || "Failed to delete");
      }
    } catch (e) {
      console.error(e);
      alert("Network error");
    }
  }

  const stats = useMemo(() => {
    const total = applications.length;
    const active = applications.filter(
      (a) => !["rejected", "withdrawn", "accepted"].includes(a.status)
    ).length;
    const interviews = applications.filter(
      (a) => a.status === "interviewing" || a.status === "screening"
    ).length;
    const offers = applications.filter(
      (a) => a.status === "offer" || a.status === "accepted"
    ).length;
    const responseRate =
      applications.filter((a) => a.applied_at).length > 0
        ? Math.round(
            (applications.filter((a) =>
              ["screening", "interviewing", "offer", "accepted"].includes(a.status)
            ).length /
              applications.filter((a) => a.applied_at).length) *
              100
          )
        : 0;
    const followUpsDue = applications.filter((a) => {
      const days = daysUntil(a.follow_up_at);
      return days !== null && days <= 3;
    }).length;

    return { total, active, interviews, offers, responseRate, followUpsDue };
  }, [applications]);

  return {
    applications,
    setApplications,
    loading,
    error,
    stats,
    loadApplications,
    handleStatusChange,
    handleDelete,
  };
}
export default useApplications;
