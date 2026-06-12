import React from "react";
import {
  JobApplication,
  APPLICATION_STATUS_COLORS,
  APPLICATION_STATUS_LABELS,
  PRIORITY_COLORS,
  ApplicationStatus,
} from "@/types";
import { formatDate, daysUntil } from "./utils";

interface ApplicationCardProps {
  app: JobApplication;
  onStatusChange: (s: ApplicationStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ApplicationCard({
  app,
  onStatusChange,
  onEdit,
  onDelete,
}: ApplicationCardProps) {
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
