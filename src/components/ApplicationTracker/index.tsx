"use client";

import { useMemo, useState, useEffect } from "react";
import { LayoutGrid, List, Send } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import {
  ApplicationStatus,
  APPLICATION_STATUS_LABELS,
  JobApplication,
} from "@/types";
import AddApplicationModal from "@/components/AddApplicationModal";
import SharedEmptyState from "@/components/EmptyState";
import RecruiterOutreachModal from "@/components/RecruiterOutreachModal";

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
  const [outreachApp, setOutreachApp] = useState<JobApplication | null>(null);

  // View state: default to board view
  const [viewMode, setViewMode] = useState<"list" | "board">("board");

  const [activeBoardColumn, setActiveBoardColumn] = useState<ApplicationStatus>("applied");

  useEffect(() => {
    if (window.innerWidth < 768) {
      setViewMode("list");
    }
  }, []);

  // Listen for FAB-triggered add-application event
  useEffect(() => {
    const handler = () => setShowAddModal(true);
    window.addEventListener("fab:add-application", handler);
    return () => window.removeEventListener("fab:add-application", handler);
  }, []);

  // Drag and Drop Hook
  const {
    draggingId,
    dragOverColumn,
    insertBeforeId,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleCardDragEnter,
    handleDropColumn,
    handleListDragStart,
    handleListCardDragEnter,
    handleListDrop,
  } = useDragAndDrop(applications, handleStatusChange, setApplications);

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
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => {
              if (applications.length > 0) {
                setOutreachApp(applications[0]);
              } else {
                setOutreachApp({
                  id: "demo",
                  company_name: "Stripe",
                  job_title: "Senior Software Engineer",
                  status: "applied",
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                } as JobApplication);
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
              border: "none",
            }}
          >
            <Send size={14} />
            <span>Outreach CRM 🚀</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn-gradient px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-premium"
          >
            <span className="text-lg font-bold">+</span>
            Add Application
          </button>
        </div>
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
            <LayoutGrid size={13} className="shrink-0" />
            <span>Board</span>
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
            <List size={13} className="shrink-0" />
            <span>List</span>
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
              <SharedEmptyState
                illustration="search"
                title="No applications match your filters"
                description="Try adjusting your search keyword or status filter to find what you're looking for."
                compact
              />
            ) : (
              <div
                className="grid grid-cols-1 gap-4"
                onDragOver={handleDragOver}
                onDrop={handleListDrop}
              >
                {filteredApps.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    onStatusChange={(s) => handleStatusChange(app, s)}
                    onEdit={() => setEditingApp(app)}
                    onDelete={() => handleDelete(app)}
                    isDragging={draggingId === app.id}
                    isInsertTarget={insertBeforeId === app.id}
                    onDragStart={(e) => handleListDragStart(e, app.id)}
                    onDragEnd={handleDragEnd}
                    onCardDragEnter={(e) => handleListCardDragEnter(e, app.id)}
                  />
                ))}
                {/* End-of-list drop zone */}
                <div
                  onDragEnter={() => {}}
                  className="h-10 rounded-xl border-2 border-dashed border-transparent transition-all duration-200"
                  style={{
                    borderColor: draggingId ? "var(--accent)" : "transparent",
                    background: draggingId ? "var(--accent-bg)" : "transparent",
                    opacity: draggingId ? 0.6 : 0,
                  }}
                />
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
                <div className="flex flex-col gap-4 w-full">
                  {/* Mobile column tabs */}
                  <div className="md:hidden flex overflow-x-auto gap-2 mb-2 pb-2 -mx-6 px-6 scrollbar-none">
                    {BOARD_COLUMNS.map((col) => {
                      const count = getColumnApps(col.status).length;
                      const isActive = activeBoardColumn === col.status;
                      return (
                        <button
                          key={col.status}
                          type="button"
                          onClick={() => setActiveBoardColumn(col.status)}
                          className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                            isActive
                              ? "bg-accent text-white border-accent shadow-sm"
                              : "bg-paper-card text-ink-muted border-border hover:border-border-strong"
                          }`}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: isActive ? "#fff" : col.color }}
                          />
                          <span>{col.label}</span>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md ${
                            isActive ? "bg-white/20 text-white" : "bg-border/60 text-ink-muted"
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-4 overflow-x-auto pb-6 pt-2 select-none -mx-6 px-6 scrollbar-thin">
                    {BOARD_COLUMNS.map((col) => {
                      const colApps = getColumnApps(col.status);
                      const isOver = dragOverColumn === col.status;
                      const isHiddenOnMobile = activeBoardColumn !== col.status;
                      return (
                        <div
                          key={col.status}
                          onDragOver={handleDragOver}
                          onDragEnter={(e) => handleDragEnter(e, col.status)}
                          onDragLeave={() => handleDragLeave(col.status)}
                          onDrop={(e) => handleDropColumn(e, col.status)}
                          className={`flex-shrink-0 w-full md:w-[290px] rounded-2xl p-4 transition-all duration-200 ${
                            isHiddenOnMobile ? "hidden md:block" : "block"
                          }`}
                          style={{
                            minHeight: 480,
                            background: isOver ? "var(--accent-bg)" : "var(--paper)",
                            border: isOver
                              ? "2px solid var(--accent)"
                              : "1px solid rgba(var(--border-rgb, 99 102 241 / 0.12))",
                            borderColor: isOver ? "var(--accent)" : "var(--border)",
                            boxShadow: isOver ? "0 0 0 4px var(--brand-glow), inset 0 0 20px var(--accent-bg)" : "none",
                            transform: isOver ? "scale(1.01)" : "scale(1)",
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
                              {isOver && draggingId ? "Drop here" : "Empty Zone"}
                            </div>
                          ) : (
                            <AnimatePresence initial={false}>
                              {colApps.map((app) => (
                                <KanbanCard
                                  key={app.id}
                                  app={app}
                                  isDragging={draggingId === app.id}
                                  isInsertTarget={insertBeforeId === app.id}
                                  onDragStart={(e) => handleDragStart(e, app.id)}
                                  onDragEnd={handleDragEnd}
                                  onCardDragEnter={(e) => handleCardDragEnter(e, app.id)}
                                  onEdit={() => setEditingApp(app)}
                                  onDelete={() => handleDelete(app)}
                                  onStatusChange={(s) => handleStatusChange(app, s)}
                                />
                              ))}
                            </AnimatePresence>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  </div>
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
      <AnimatePresence>
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
      </AnimatePresence>

      {/* Recruiter Outreach Modal */}
      {outreachApp && (
        <RecruiterOutreachModal
          companyName={outreachApp.company_name}
          jobTitle={outreachApp.job_title}
          contactName={outreachApp.contact_name || undefined}
          onClose={() => setOutreachApp(null)}
        />
      )}
    </div>
  );
}
