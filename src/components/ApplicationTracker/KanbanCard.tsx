import { useMemo } from "react";
import { JobApplication, PRIORITY_COLORS, APPLICATION_STATUS_LABELS, ApplicationStatus } from "@/types";
import { formatDate, daysUntil } from "./utils";
import { useContextMenu } from "@/components/ContextMenu";

interface KanbanCardProps {
  app: JobApplication;
  isDragging: boolean;
  isInsertTarget?: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onCardDragEnter?: (e: React.DragEvent) => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange?: (status: ApplicationStatus) => void;
}

export default function KanbanCard({
  app,
  isDragging,
  isInsertTarget = false,
  onDragStart,
  onDragEnd,
  onCardDragEnter,
  onEdit,
  onDelete,
  onStatusChange,
}: KanbanCardProps) {
  const { show: showContextMenu } = useContextMenu();
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

  const STATUS_QUICK_MOVES: ApplicationStatus[] = ["applied", "screening", "interviewing", "offer", "accepted", "rejected"];

  const buildContextMenu = (e: React.MouseEvent) => {
    const items = [
      {
        key: "edit",
        label: "Edit Application",
        icon: "✏️",
        shortcut: "E",
        onClick: onEdit,
      },
      ...(app.job_url ? [{
        key: "open-url",
        label: "Open Job Posting",
        icon: "↗",
        onClick: () => window.open(app.job_url!, "_blank", "noopener"),
      }] : []),
      ...(onStatusChange ? [{
        key: "status-sep",
        label: "Move to Status...",
        icon: "⟶",
        separator: true,
        disabled: true,
        onClick: () => {},
      },
        ...STATUS_QUICK_MOVES
          .filter(s => s !== app.status)
          .slice(0, 4)
          .map(s => ({
            key: `move-${s}`,
            label: APPLICATION_STATUS_LABELS[s],
            icon: s === "accepted" ? "✅" : s === "rejected" ? "❌" : s === "offer" ? "🎉" : "→",
            onClick: () => onStatusChange!(s),
          }))
      ] : []),
      {
        key: "delete",
        label: "Delete Application",
        icon: "🗑️",
        danger: true,
        separator: true,
        onClick: onDelete,
      },
    ];
    showContextMenu(e, items);
  };

  return (
    <div
      onDragEnter={onCardDragEnter}
      onContextMenu={buildContextMenu}
      style={{ position: "relative" }}
    >
      {/* Insert-before drop indicator */}
      {isInsertTarget && (
        <div
          style={{
            position: "absolute",
            top: -6,
            left: 0,
            right: 0,
            height: 3,
            borderRadius: 99,
            background: "var(--accent)",
            boxShadow: "0 0 8px var(--accent)",
            zIndex: 10,
            animation: "pulse 1s ease-in-out infinite",
          }}
        />
      )}
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
    </div>
  );
}
