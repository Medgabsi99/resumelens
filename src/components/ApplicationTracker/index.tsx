"use client";

import { useMemo, useState } from "react";
import {
  ApplicationStatus,
  APPLICATION_STATUS_LABELS,
  JobApplication,
  APPLICATION_STATUS_COLORS,
} from "@/types";
import AddApplicationModal from "@/components/AddApplicationModal";

// Extracted Subcomponents
import StatCard from "./StatCard";
import EmptyState from "./EmptyState";
import ApplicationCard from "./ApplicationCard";
import KanbanCard from "./KanbanCard";
import EditApplicationModal from "./EditApplicationModal";

// Extracted Hooks
import { useApplications } from "./useApplications";
import { useDragAndDrop } from "./useDragAndDrop";

type FilterStatus = "all" | ApplicationStatus;

export default function ApplicationTracker() {
  const {
    applications,
    setApplications,
    loading,
    error,
    stats,
    handleStatusChange,
    handleDelete,
  } = useApplications();

  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);

  // View state: default to board view
  const [viewMode, setViewMode] = useState<"list" | "board">("board");

  // Drag and Drop Hook
  const {
    draggingId,
    dragOverColumn,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDropColumn,
  } = useDragAndDrop(applications, handleStatusChange);

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
