"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ApplicationStatus,
  APPLICATION_STATUS_COLORS,
  APPLICATION_STATUS_LABELS,
  JobApplication,
  Priority,
  PRIORITY_COLORS,
} from "@/types";
import AddApplicationModal from "./AddApplicationModal";

type FilterStatus = "all" | ApplicationStatus;

const STATUS_FLOW: ApplicationStatus[] = [
  "saved",
  "applied",
  "screening",
  "interviewing",
  "offer",
  "accepted",
];

const NEGATIVE_STATUSES: ApplicationStatus[] = ["rejected", "withdrawn"];

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const target = new Date(iso).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function ApplicationTracker() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);

  // View state: default to board view
  const [viewMode, setViewMode] = useState<"list" | "board">("board");

  // Drag and Drop States & Handlers
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ApplicationStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent, status: ApplicationStatus) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDragLeave = (status: ApplicationStatus) => {
    if (dragOverColumn === status) {
      setDragOverColumn(null);
    }
  };

  const handleDropColumn = async (e: React.DragEvent, status: ApplicationStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const id = e.dataTransfer.getData("text/plain") || draggingId;
    if (!id) return;
    const app = applications.find((a) => a.id === id);
    if (app && app.status !== status) {
      await handleStatusChange(app, status);
    }
    setDraggingId(null);
  };

  // Load applications
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
        // Revert on failure
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

  // Compute stats
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

  // Filtered applications
  const filteredApps = useMemo(() => {
    let result = applications;
    if (filter !== "all") {
      result = result.filter((a) => a.status === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.company_name.toLowerCase().includes(q) ||
          a.job_title.toLowerCase().includes(q) ||
          a.location?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [applications, filter, search]);

  return (
    <div className="fade-up">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-ink">
            Job Applications
          </h1>
          <p className="text-ink-muted text-sm mt-1">
            Track every job opportunity and follow-up in your pipeline.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-gradient px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-premium"
        >
          <span className="text-lg font-bold">+</span>
          Add Application
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-8">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Active" value={stats.active} color="var(--accent)" />
        <StatCard label="In Process" value={stats.interviews} color="#d97706" />
        <StatCard label="Offers" value={stats.offers} color="#10b981" />
        <StatCard label="Response Rate" value={`${stats.responseRate}%`} color="#0284c7" />
        <StatCard
          label="Follow-ups"
          value={stats.followUpsDue}
          color={stats.followUpsDue > 0 ? "#ef4444" : "var(--ink-muted)"}
        />
      </div>

      {/* Filters */}
      <div className="glass-card bg-paper-card border border-border p-4 rounded-2xl mb-6 flex gap-4 flex-wrap items-center justify-between shadow-sm">
        <div className="flex gap-4 flex-1 flex-wrap items-center">
          <input
            type="text"
            placeholder="Search by company, role, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="premium-input flex-1 min-w-[240px] max-w-md"
          />
          {viewMode === "list" && (
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterStatus)}
              className="premium-input max-w-[200px] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {Object.entries(APPLICATION_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex bg-paper border border-border p-1 rounded-xl gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("board")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
              viewMode === "board"
                ? "bg-paper-card text-accent border border-border shadow-sm"
                : "text-ink-muted border border-transparent hover:text-ink"
            }`}
          >
            <span>⬓</span> Board
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
              viewMode === "list"
                ? "bg-paper-card text-accent border border-border shadow-sm"
                : "text-ink-muted border border-transparent hover:text-ink"
            }`}
          >
            <span>☰</span> List
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 text-ink-muted text-sm font-medium animate-pulse">
          Loading your applications pipeline...
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-center font-medium">
          {error}
        </div>
      ) : applications.length === 0 ? (
        <EmptyState onAdd={() => setShowAddModal(true)} />
      ) : (
        <>
          {viewMode === "list" ? (
            filteredApps.length === 0 ? (
              <div className="text-center py-12 text-ink-muted text-sm font-medium border border-dashed border-border rounded-2xl">
                No applications match your current filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredApps.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    onStatusChange={(s) => handleStatusChange(app, s)}
                    onEdit={() => setEditingApp(app)}
                    onDelete={() => handleDelete(app)}
                  />
                ))}
              </div>
            )
          ) : (
            /* Board View */
            (() => {
              const BOARD_COLUMNS: { status: ApplicationStatus; label: string; color: string }[] = [
                { status: "saved", label: "Saved", color: "var(--ink-faint)" },
                { status: "applied", label: "Applied", color: "var(--accent)" },
                { status: "screening", label: "Screening", color: "#0284c7" },
                { status: "interviewing", label: "Interviewing", color: "#d97706" },
                { status: "offer", label: "Offer", color: "#10b981" },
                { status: "accepted", label: "Accepted", color: "#059669" },
                { status: "rejected", label: "Rejected / Closed", color: "#ef4444" },
              ];

              const getColumnApps = (status: ApplicationStatus) => {
                return filteredApps.filter((a) => {
                  if (status === "rejected") {
                    return a.status === "rejected" || a.status === "withdrawn";
                  }
                  return a.status === status;
                });
              };

              return (
                <div className="flex gap-4 overflow-x-auto pb-6 pt-2 select-none -mx-6 px-6 scrollbar-thin">
                  {BOARD_COLUMNS.map((col) => {
                    const colApps = getColumnApps(col.status);
                    const isOver = dragOverColumn === col.status;
                    return (
                      <div
                        key={col.status}
                        onDragOver={handleDragOver}
                        onDragEnter={(e) => handleDragEnter(e, col.status)}
                        onDragLeave={() => handleDragLeave(col.status)}
                        onDrop={(e) => handleDropColumn(e, col.status)}
                        className={`flex-shrink-0 w-[290px] rounded-2xl p-4 transition-all duration-200 ${
                          isOver 
                            ? "bg-accent-bg/40 border-2 border-dashed border-accent animate-pulse" 
                            : "bg-paper border border-border/60"
                        }`}
                        style={{
                          minHeight: 480,
                        }}
                      >
                        {/* Column Header */}
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-border/40">
                          <div className="flex items-center gap-2">
                            <span 
                              className="w-2.5 h-2.5 rounded-full" 
                              style={{ backgroundColor: col.color }}
                            />
                            <span className="font-bold text-sm text-ink">{col.label}</span>
                          </div>
                          <span className="text-[11px] font-mono font-bold bg-border/60 text-ink-muted px-2 py-0.5 rounded-md">
                            {colApps.length}
                          </span>
                        </div>

                        {/* Column Cards Stack */}
                        <div className="flex flex-col gap-3 overflow-y-auto max-h-[600px] pr-1">
                          {colApps.length === 0 ? (
                            <div className="text-center py-12 text-ink-faint text-xs font-mono border border-dashed border-border/40 rounded-xl bg-paper-card/30">
                              Empty Zone
                            </div>
                          ) : (
                            colApps.map((app) => (
                              <KanbanCard
                                key={app.id}
                                app={app}
                                isDragging={draggingId === app.id}
                                onDragStart={(e) => handleDragStart(e, app.id)}
                                onDragEnd={handleDragEnd}
                                onEdit={() => setEditingApp(app)}
                                onDelete={() => handleDelete(app)}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()
          )}
        </>
      )}

      {/* Add Modal */}
      <AddApplicationModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={(app) => {
          setApplications((prev) => [app, ...prev]);
        }}
      />

      {/* Edit Modal */}
      {editingApp && (
        <EditApplicationModal
          application={editingApp}
          onClose={() => setEditingApp(null)}
          onUpdated={(updated) => {
            setApplications((prev) =>
              prev.map((a) => (a.id === updated.id ? updated : a))
            );
            setEditingApp(null);
          }}
        />
      )}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────

function StatCard({
  label,
  value,
  color = "var(--ink)",
}: {
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div className="glass-card bg-paper-card border border-border rounded-2xl p-5 shadow-sm hover:scale-[1.02] transition-transform duration-200">
      <div className="font-mono text-[9px] font-bold tracking-widest text-ink-faint uppercase mb-2">
        {label}
      </div>
      <div
        className="font-display text-3xl font-bold tracking-tight"
        style={{ color }}
      >
        {value}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center py-16 px-6 glass-card bg-paper-card border border-border rounded-2xl shadow-premium max-w-xl mx-auto">
      <div className="text-5xl mb-6">📋</div>
      <h3 className="text-xl font-bold text-ink mb-2">
        No job applications yet
      </h3>
      <p className="text-sm text-ink-muted leading-relaxed max-w-sm mx-auto mb-8">
        Organize your job search. Add your first application to track status, deadlines, notes, and never miss a follow-up.
      </p>
      <button
        onClick={onAdd}
        className="btn-gradient px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer shadow-premium"
      >
        + Add Your First Application
      </button>
    </div>
  );
}

// ─── Application Card ─────────────────────────────────────

function ApplicationCard({
  app,
  onStatusChange,
  onEdit,
  onDelete,
}: {
  app: JobApplication;
  onStatusChange: (s: ApplicationStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const statusColor = APPLICATION_STATUS_COLORS[app.status];
  const followUpDays = daysUntil(app.follow_up_at);
  const followUpUrgent = followUpDays !== null && followUpDays <= 3;

  return (
    <div
      className="glass-card bg-paper-card border p-6 rounded-2xl shadow-sm transition-all duration-200"
      style={{
        borderLeft: `4px solid ${PRIORITY_COLORS[app.priority]}`,
      }}
    >
      <div className="flex justify-between items-start gap-4 flex-wrap sm:flex-nowrap mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h3 className="text-lg font-bold text-ink leading-snug">
              {app.job_title}
            </h3>
            <span
              className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider"
              style={{
                background: statusColor.bg,
                color: statusColor.text,
              }}
            >
              {APPLICATION_STATUS_LABELS[app.status]}
            </span>
            {app.match_score !== null && app.match_score !== undefined && (
              <span
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md"
                style={{
                  background:
                    app.match_score >= 75
                      ? "rgba(16, 185, 129, 0.08)"
                      : app.match_score >= 55
                      ? "rgba(245, 158, 11, 0.08)"
                      : "rgba(239, 68, 68, 0.08)",
                  color:
                    app.match_score >= 75
                      ? "#10b981"
                      : app.match_score >= 55
                      ? "#f59e0b"
                      : "#ef4444",
                }}
              >
                {app.match_score}% match
              </span>
            )}
          </div>
          <div className="text-sm text-ink-muted mb-2 font-medium flex items-center gap-1.5 flex-wrap">
            <span>{app.company_name}</span>
            {app.location && (
              <>
                <span className="text-ink-faint">•</span>
                <span>{app.location}</span>
              </>
            )}
            {app.job_url && (
              <>
                <span className="text-ink-faint">•</span>
                <a
                  href={app.job_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:text-accent-hover font-semibold no-underline"
                >
                  View Posting ↗
                </a>
              </>
            )}
          </div>
          {(app.salary_min || app.salary_max) && (
            <div className="text-xs text-ink-faint font-mono bg-paper px-2.5 py-1 rounded-lg inline-block">
              💰 {app.salary_currency || "USD"}{" "}
              {app.salary_min?.toLocaleString() || "?"} –{" "}
              {app.salary_max?.toLocaleString() || "?"}
            </div>
          )}
        </div>

        <div className="flex gap-2 items-center flex-shrink-0">
          <select
            value={app.status}
            onChange={(e) => onStatusChange(e.target.value as ApplicationStatus)}
            aria-label="Change status"
            className="premium-input py-1.5 px-3 text-xs w-auto cursor-pointer"
            style={{ padding: "6px 12px", height: "auto" }}
          >
            {Object.entries(APPLICATION_STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <button
            onClick={onEdit}
            aria-label="Edit application"
            className="bg-transparent hover:bg-paper border border-border hover:border-border-strong text-ink-muted hover:text-ink px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-150"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            aria-label="Delete application"
            className="bg-transparent hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 text-red-500 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-150"
          >
            ×
          </button>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex gap-x-5 gap-y-2 text-xs text-ink-faint flex-wrap items-center">
        {app.applied_at && (
          <span className="flex items-center gap-1">📅 Applied: {formatDate(app.applied_at)}</span>
        )}
        {app.deadline_at && (
          <span className="flex items-center gap-1">
            ⏰ Deadline: {formatDate(app.deadline_at)}
            {(() => {
              const d = daysUntil(app.deadline_at);
              if (d === null) return null;
              if (d < 0) return <span className="text-red-500 font-bold"> (overdue)</span>;
              if (d <= 3) return <span className="text-amber-500 font-bold"> ({d}d left)</span>;
              return <span className="text-ink-muted"> ({d}d left)</span>;
            })()}
          </span>
        )}
        {app.follow_up_at && (
          <span
            className="flex items-center gap-1 font-medium"
            style={{ color: followUpUrgent ? "#ef4444" : "var(--ink-faint)" }}
          >
            🔔 Follow-up: {formatDate(app.follow_up_at)}
            {followUpDays !== null && followUpDays <= 3 && (
              <span>({followUpDays < 0 ? "overdue" : `${followUpDays}d`})</span>
            )}
          </span>
        )}
        {(app.contact_name || app.contact_email) && (
          <span className="flex items-center gap-1">
            👤 {app.contact_name}
            {app.contact_email && ` (${app.contact_email})`}
          </span>
        )}
      </div>

      {app.notes && (
        <div className="mt-4 p-3.5 bg-paper rounded-xl border border-border text-xs text-ink leading-relaxed">
          {app.notes}
        </div>
      )}
    </div>
  );
}

// ─── Edit Modal (lightweight version) ─────────────────────

function EditApplicationModal({
  application,
  onClose,
  onUpdated,
}: {
  application: JobApplication;
  onClose: () => void;
  onUpdated: (app: JobApplication) => void;
}) {
  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [priority, setPriority] = useState<Priority>(application.priority);
  const [notes, setNotes] = useState(application.notes || "");
  const [followUpAt, setFollowUpAt] = useState(
    application.follow_up_at ? application.follow_up_at.split("T")[0] : ""
  );
  const [contactName, setContactName] = useState(application.contact_name || "");
  const [contactEmail, setContactEmail] = useState(application.contact_email || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const update: Record<string, unknown> = { status, priority, notes };
    if (followUpAt) update.follow_up_at = new Date(followUpAt).toISOString();
    else update.follow_up_at = null;
    if (contactName.trim()) update.contact_name = contactName.trim();
    else update.contact_name = null;
    if (contactEmail.trim()) update.contact_email = contactEmail.trim();
    else update.contact_email = null;

    try {
      const res = await fetch(`/api/applications/${application.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.error || "Failed to update");
        return;
      }
      onUpdated(data.data);
    } catch (err) {
      console.error(err);
      setError("Network error");
    } finally {
      setIsSubmitting(false);
    }
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--ink-muted)",
    marginBottom: 4,
    display: "block",
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--modal-backdrop)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--paper-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          maxWidth: 500,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 24px 60px -15px var(--shadow-color)",
        }}
      >
        <form onSubmit={handleSubmit}>
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                margin: 0,
                color: "var(--ink)",
              }}
            >
              Edit Application
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "var(--ink-muted)",
                margin: "4px 0 0",
              }}
            >
              {application.job_title} at {application.company_name}
            </p>
          </div>

          <div style={{ padding: "20px 24px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div>
                <label style={labelStyle}>Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                  className="premium-input cursor-pointer"
                >
                  {Object.entries(APPLICATION_STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="premium-input cursor-pointer"
                >
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🔴 High</option>
                </select>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div>
                <label style={labelStyle}>Follow-up by</label>
                <input
                  type="date"
                  value={followUpAt}
                  onChange={(e) => setFollowUpAt(e.target.value)}
                  className="premium-input"
                />
              </div>
              <div>
                <label style={labelStyle}>Contact name</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Sarah (Recruiter)"
                  className="premium-input"
                />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Contact email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="recruiter@company.com"
                className="premium-input"
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any context, follow-up tasks, or reminders..."
                className="premium-input min-h-[80px] resize-y"
              />
            </div>

            {error && (
              <div
                style={{
                  background: "#fce8e8",
                  border: "1px solid rgba(122,32,32,0.3)",
                  color: "#7a2020",
                  padding: "8px 12px",
                  borderRadius: 6,
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}
          </div>

          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                color: "var(--ink-muted)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "9px 18px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "Instrument Sans, sans-serif",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--paper-warm)";
                e.currentTarget.style.borderColor = "var(--border-strong)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-gradient"
              style={{
                borderRadius: "var(--radius)",
                padding: "9px 22px",
                fontSize: 13,
                fontWeight: 600,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                fontFamily: "Instrument Sans, sans-serif",
              }}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Kanban Card ──────────────────────────────────────────

interface KanbanCardProps {
  app: JobApplication;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function KanbanCard({
  app,
  isDragging,
  onDragStart,
  onDragEnd,
  onEdit,
  onDelete,
}: KanbanCardProps) {
  const followUpDays = daysUntil(app.follow_up_at);
  const followUpUrgent = followUpDays !== null && followUpDays <= 3;

  const formatSalary = (val: number | null | undefined) => {
    if (val === null || val === undefined) return null;
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
    }
    if (val >= 1000) {
      return `${Math.round(val / 1000)}k`;
    }
    return val.toString();
  };

  const formattedSalary = useMemo(() => {
    if (!app.salary_min && !app.salary_max) return null;
    const minStr = formatSalary(app.salary_min);
    const maxStr = formatSalary(app.salary_max);
    const currency = app.salary_currency || "USD";
    if (minStr && maxStr) {
      return `${currency} ${minStr}–${maxStr}`;
    }
    return `${currency} ${minStr || maxStr}`;
  }, [app.salary_min, app.salary_max, app.salary_currency]);

  return (
    <div
      draggable="true"
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`group glass-card bg-paper-card border p-4 rounded-xl shadow-sm transition-all duration-200 select-none cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-40 scale-95 border-accent/40" : "opacity-100"
      }`}
      style={{
        borderLeft: `4px solid ${PRIORITY_COLORS[app.priority] || "var(--border)"}`,
      }}
    >
      {/* Top row: Company & Action Buttons */}
      <div className="flex justify-between items-start gap-2 mb-1">
        <span className="text-[11px] font-semibold text-ink-muted truncate max-w-[160px]" title={app.company_name}>
          {app.company_name}
        </span>
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 -mt-1 -mr-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            title="Edit Application"
            className="p-1 rounded-md text-ink-faint hover:text-ink hover:bg-paper border border-transparent hover:border-border transition-all cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete Application"
            className="p-1 rounded-md text-red-400 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Job Title */}
      <h4 className="text-xs font-bold text-ink leading-snug truncate mb-2" title={app.job_title}>
        {app.job_title}
      </h4>

      {/* Badges / Metrics Row */}
      <div className="flex flex-wrap gap-1 items-center mb-2.5">
        {app.match_score !== null && app.match_score !== undefined && (
          <span
            className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
            style={{
              background:
                app.match_score >= 75
                  ? "rgba(16, 185, 129, 0.08)"
                  : app.match_score >= 55
                  ? "rgba(245, 158, 11, 0.08)"
                  : "rgba(239, 68, 68, 0.08)",
              color:
                app.match_score >= 75
                  ? "#10b981"
                  : app.match_score >= 55
                  ? "#f59e0b"
                  : "#ef4444",
            }}
          >
            {app.match_score}% match
          </span>
        )}
        {app.location && (
          <span 
            className="text-[9px] text-ink-muted bg-paper border border-border px-1.5 py-0.5 rounded truncate max-w-[100px]" 
            title={app.location}
          >
            📍 {app.location}
          </span>
        )}
        {formattedSalary && (
          <span 
            className="text-[9px] text-ink-muted bg-paper border border-border px-1.5 py-0.5 rounded truncate max-w-[110px]" 
            title={formattedSalary}
          >
            💰 {formattedSalary}
          </span>
        )}
      </div>

      {/* Notes preview (optional) */}
      {app.notes && (
        <div 
          className="text-[10px] text-ink-muted bg-paper/50 px-2 py-1 rounded border border-border/40 leading-normal mb-2"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
          title={app.notes}
        >
          {app.notes}
        </div>
      )}

      {/* Footer Info: Follow-up & Job Posting Link */}
      <div className="flex justify-between items-center text-[9px] text-ink-faint border-t border-border/40 pt-2 mt-1">
        {app.follow_up_at ? (
          <span
            className={`flex items-center gap-1 font-medium ${
              followUpUrgent ? "text-red-500" : "text-ink-muted"
            }`}
          >
            {followUpUrgent ? "🔔" : "📅"}{" "}
            {followUpUrgent 
              ? (followUpDays !== null && followUpDays < 0 ? "Overdue" : `Due in ${followUpDays}d`)
              : formatDate(app.follow_up_at)
            }
          </span>
        ) : (
          <span className="text-ink-faint">No follow-up</span>
        )}

        {app.job_url && (
          <a
            href={app.job_url}
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:text-accent-hover font-semibold no-underline flex items-center gap-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            Apply ↗
          </a>
        )}
      </div>
    </div>
  );
}



