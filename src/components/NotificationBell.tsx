"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────────────────────
export type NotifType =
  | "analysis_complete"
  | "follow_up_due"
  | "follow_up_overdue"
  | "deadline_approaching"
  | "status_update"
  | "interview_scheduled"
  | "offer_received"
  | "welcome";

export interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  href?: string;
  createdAt: Date;
  read: boolean;
  icon: string;
}

// ─── Raw API shapes (minimal) ─────────────────────────────────────────────────
interface ApiAnalysis {
  id: string;
  score: number;
  target_role: string | null;
  created_at: string;
}
interface ApiApplication {
  id: string;
  job_title: string;
  company_name: string;
  status: string;
  follow_up_at: string | null;
  deadline_at: string | null;
  updated_at?: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = "rl_notif_read_v1";

function getReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function markRead(ids: string[]) {
  try {
    const current = getReadIds();
    ids.forEach((id) => current.add(id));
    // Keep only the latest 200
    const arr = [...current].slice(-200);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {}
}

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function relativeTime(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Synthesize notifications from data ──────────────────────────────────────
function synthesize(
  analyses: ApiAnalysis[],
  applications: ApiApplication[],
  readIds: Set<string>
): Notification[] {
  const notifs: Notification[] = [];

  // 1. Recent analyses (past 14 days)
  const cutoff = Date.now() - 14 * 86400 * 1000;
  analyses
    .filter((a) => new Date(a.created_at).getTime() > cutoff)
    .slice(0, 5)
    .forEach((a) => {
      const id = `analysis_${a.id}`;
      const scoreLabel = a.score >= 75 ? "Great" : a.score >= 55 ? "Fair" : "Low";
      notifs.push({
        id,
        type: "analysis_complete",
        title: "Resume Analysis Complete",
        body: `${scoreLabel} ATS score (${a.score}/100)${a.target_role ? ` for ${a.target_role}` : ""}.`,
        href: `/dashboard/${a.id}`,
        createdAt: new Date(a.created_at),
        read: readIds.has(id),
        icon: a.score >= 75 ? "🎯" : a.score >= 55 ? "📊" : "⚠️",
      });
    });

  // 2. Follow-up reminders
  applications.forEach((app) => {
    const d = daysUntil(app.follow_up_at);
    if (d === null) return;

    if (d < 0) {
      const id = `followup_overdue_${app.id}`;
      notifs.push({
        id,
        type: "follow_up_overdue",
        title: "Follow-Up Overdue",
        body: `${app.job_title} at ${app.company_name} — ${Math.abs(d)}d overdue.`,
        href: "/dashboard/applications",
        createdAt: new Date(app.follow_up_at!),
        read: readIds.has(id),
        icon: "🔴",
      });
    } else if (d <= 2) {
      const id = `followup_due_${app.id}`;
      notifs.push({
        id,
        type: "follow_up_due",
        title: d === 0 ? "Follow-Up Due Today!" : `Follow-Up Due in ${d}d`,
        body: `${app.job_title} at ${app.company_name}.`,
        href: "/dashboard/applications",
        createdAt: new Date(app.follow_up_at!),
        read: readIds.has(id),
        icon: d === 0 ? "🔔" : "⏰",
      });
    }
  });

  // 3. Approaching deadlines (within 3 days)
  applications.forEach((app) => {
    const d = daysUntil(app.deadline_at);
    if (d === null) return;
    if (d >= 0 && d <= 3) {
      const id = `deadline_${app.id}`;
      notifs.push({
        id,
        type: "deadline_approaching",
        title: d === 0 ? "Application Deadline Today!" : `Deadline in ${d}d`,
        body: `${app.job_title} at ${app.company_name}.`,
        href: "/dashboard/applications",
        createdAt: new Date(app.deadline_at!),
        read: readIds.has(id),
        icon: d === 0 ? "🚨" : "📅",
      });
    }
  });

  // 4. Offers received
  applications
    .filter((a) => a.status === "offer")
    .forEach((app) => {
      const id = `offer_${app.id}`;
      notifs.push({
        id,
        type: "offer_received",
        title: "🎉 Job Offer Received!",
        body: `${app.job_title} at ${app.company_name} — congratulations!`,
        href: "/dashboard/applications",
        createdAt: app.updated_at ? new Date(app.updated_at) : new Date(),
        read: readIds.has(id),
        icon: "🎉",
      });
    });

  // Sort: unread first, then by date desc
  return notifs.sort((a, b) => {
    if (!a.read && b.read) return -1;
    if (a.read && !b.read) return 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // Load data and synthesize
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [analysesRes, appsRes] = await Promise.all([
          fetch("/api/analyses"),
          fetch("/api/applications"),
        ]);
        const analysesData = await analysesRes.json();
        const appsData = await appsRes.json();

        const analyses: ApiAnalysis[] = analysesData.success ? analysesData.data : [];
        const applications: ApiApplication[] = appsData.success ? appsData.data : [];

        const readIds = getReadIds();
        setNotifications(synthesize(analyses, applications, readIds));
      } catch {
        /* non-critical — fail silently */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const markAllRead = useCallback(() => {
    const ids = notifications.map((n) => n.id);
    markRead(ids);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [notifications]);

  const handleNotifClick = useCallback(
    (notif: Notification) => {
      markRead([notif.id]);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
      setOpen(false);
      if (notif.href) router.push(notif.href);
    },
    [router]
  );

  return (
    <div style={{ position: "relative" }}>
      <style>{`
        @keyframes notif-slide {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes notif-badge-pop {
          0%   { transform: scale(0); }
          70%  { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        .notif-panel {
          animation: notif-slide 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .notif-badge {
          animation: notif-badge-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .notif-item {
          transition: background 0.12s ease;
          cursor: pointer;
        }
        .notif-item:hover {
          background: var(--accent-bg);
        }
        @media (prefers-reduced-motion: reduce) {
          .notif-panel, .notif-badge { animation: none; }
        }
      `}</style>

      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        title="Notifications"
        style={{ position: "relative" }}
        className="flex items-center justify-center w-9 h-9 rounded-xl border border-border text-ink-muted hover:text-ink hover:bg-paper-card hover:border-accent-border transition-all duration-200 cursor-pointer"
      >
        {/* Bell SVG */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          {unreadCount > 0 && (
            <circle cx="18" cy="5" r="4" fill="var(--accent)" stroke="none" />
          )}
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            className="notif-badge"
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--accent)",
              border: "1.5px solid var(--paper)",
              display: "block",
            }}
          />
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          ref={panelRef}
          className="notif-panel"
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            width: 360,
            maxHeight: 500,
            zIndex: 99998,
            borderRadius: 16,
            border: "1px solid var(--border)",
            background: "var(--paper-card)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            boxShadow:
              "0 4px 6px -1px rgba(0,0,0,0.2), 0 20px 50px -10px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Panel header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px 10px",
              borderBottom: "1px solid var(--border)",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
                Activity
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: "monospace",
                    padding: "1px 6px",
                    borderRadius: 99,
                    background: "var(--accent)",
                    color: "#fff",
                    lineHeight: 1.6,
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--accent)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px 6px",
                  borderRadius: 6,
                }}
                className="hover:bg-accent-bg transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Scrollable list */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {loading ? (
              <div style={{ padding: "32px 16px", textAlign: "center" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{
                        height: 56,
                        borderRadius: 10,
                        background: "var(--paper)",
                        animation: "pulse 1.5s ease-in-out infinite",
                        opacity: 1 - i * 0.2,
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div
                style={{
                  padding: "40px 16px",
                  textAlign: "center",
                  color: "var(--ink-faint)",
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 10 }}>🔔</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-muted)" }}>
                  All caught up!
                </div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  Activity from your analyses and applications will appear here.
                </div>
              </div>
            ) : (
              <div style={{ padding: "6px" }}>
                {notifications.map((notif, idx) => (
                  <NotifRow
                    key={notif.id}
                    notif={notif}
                    isLast={idx === notifications.length - 1}
                    onClick={() => handleNotifClick(notif)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              style={{
                borderTop: "1px solid var(--border)",
                padding: "10px 16px",
                display: "flex",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => {
                  markAllRead();
                  setOpen(false);
                  router.push("/dashboard/applications");
                }}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--ink-muted)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
                className="hover:text-accent transition-colors"
              >
                View all applications →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Single notification row ──────────────────────────────────────────────────
function NotifRow({
  notif,
  isLast,
  onClick,
}: {
  notif: Notification;
  isLast: boolean;
  onClick: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className="notif-item"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "10px 10px",
        borderRadius: 10,
        marginBottom: isLast ? 0 : 2,
        background: notif.read ? "transparent" : "var(--accent-bg)",
        position: "relative",
      }}
    >
      {/* Icon */}
      <div
        style={{
          flexShrink: 0,
          width: 34,
          height: 34,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 17,
          background: "var(--paper)",
          border: "1px solid var(--border)",
        }}
      >
        {notif.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 6,
            marginBottom: 2,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--ink)",
              lineHeight: 1.3,
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {notif.title}
          </span>
          <span
            style={{
              fontSize: 10,
              color: "var(--ink-faint)",
              flexShrink: 0,
              fontFamily: "monospace",
            }}
          >
            {relativeTime(notif.createdAt)}
          </span>
        </div>
        <p
          style={{
            fontSize: 11,
            color: "var(--ink-muted)",
            lineHeight: 1.4,
            margin: 0,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {notif.body}
        </p>
      </div>

      {/* Unread dot */}
      {!notif.read && (
        <div
          style={{
            flexShrink: 0,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--accent)",
            marginTop: 4,
            boxShadow: "0 0 6px var(--accent)",
          }}
        />
      )}
    </div>
  );
}
