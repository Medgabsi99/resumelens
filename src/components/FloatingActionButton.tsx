"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// ─── Action definition ────────────────────────────────────────────────────────
interface FABAction {
  label: string;
  icon: string;
  description: string;
  onClick: (router: ReturnType<typeof useRouter>) => void;
  accent?: string; // override color for this action
}

interface FABConfig {
  primaryIcon: string;
  primaryLabel: string;
  primaryColor: string;
  actions: FABAction[];
}

// ─── Per-route configuration ─────────────────────────────────────────────────
function useFABConfig(): FABConfig | null {
  const pathname = usePathname();

  if (pathname === "/dashboard") {
    return {
      primaryIcon: "✦",
      primaryLabel: "Quick Actions",
      primaryColor: "var(--accent)",
      actions: [
        {
          label: "Analyze Resume",
          icon: "📄",
          description: "Run AI resume analysis",
          onClick: (r) => r.push("/"),
        },
        {
          label: "Add Application",
          icon: "➕",
          description: "Track a new job application",
          onClick: (r) => r.push("/dashboard/applications"),
        },
        {
          label: "Mock Interview",
          icon: "🎤",
          description: "Practice with AI interviewer",
          onClick: (r) => r.push("/dashboard/interviews"),
        },
        {
          label: "Tailor Resume",
          icon: "✨",
          description: "Optimize for a specific role",
          onClick: (r) => r.push("/dashboard/tailor"),
        },
      ],
    };
  }

  if (pathname === "/dashboard/applications") {
    return {
      primaryIcon: "➕",
      primaryLabel: "Add Application",
      primaryColor: "var(--accent)",
      actions: [
        {
          label: "Add Application",
          icon: "➕",
          description: "Track a new job",
          onClick: (r) => {
            // Dispatch a custom event that the ApplicationTracker listens for
            window.dispatchEvent(new CustomEvent("fab:add-application"));
          },
        },
        {
          label: "ATS Scanner",
          icon: "🔍",
          description: "Check your resume score",
          onClick: (r) => r.push("/dashboard/scanner"),
        },
        {
          label: "Salary Negotiator",
          icon: "💰",
          description: "Prep your counter-offer",
          onClick: (r) => r.push("/dashboard/negotiator"),
        },
      ],
    };
  }

  if (pathname === "/dashboard/interviews") {
    return {
      primaryIcon: "🎤",
      primaryLabel: "Start Interview",
      primaryColor: "#8b5cf6",
      actions: [
        {
          label: "New Interview",
          icon: "🎤",
          description: "Start a mock session",
          onClick: (r) => {
            window.dispatchEvent(new CustomEvent("fab:start-interview"));
          },
        },
        {
          label: "Learning Paths",
          icon: "📚",
          description: "Structured skill building",
          onClick: (r) => r.push("/dashboard/learning-paths"),
        },
      ],
    };
  }

  if (pathname === "/dashboard/scanner") {
    return {
      primaryIcon: "🔍",
      primaryLabel: "Scan Resume",
      primaryColor: "#10b981",
      actions: [
        {
          label: "Upload & Scan",
          icon: "📤",
          description: "Analyze a new resume",
          onClick: () => {
            window.dispatchEvent(new CustomEvent("fab:upload-resume"));
          },
        },
        {
          label: "Tailor Sandbox",
          icon: "✨",
          description: "Optimize for a role",
          onClick: (r) => r.push("/dashboard/tailor"),
        },
      ],
    };
  }

  if (pathname === "/dashboard/negotiator") {
    return {
      primaryIcon: "💰",
      primaryLabel: "New Negotiation",
      primaryColor: "#f59e0b",
      actions: [
        {
          label: "New Negotiation",
          icon: "💰",
          description: "Start salary analysis",
          onClick: () => {
            window.dispatchEvent(new CustomEvent("fab:new-negotiation"));
          },
        },
        {
          label: "Mock Interview",
          icon: "🎤",
          description: "Practice for the offer call",
          onClick: (r) => r.push("/dashboard/interviews"),
        },
      ],
    };
  }

  if (pathname === "/dashboard/tailor") {
    return {
      primaryIcon: "✨",
      primaryLabel: "Tailor Resume",
      primaryColor: "#6366f1",
      actions: [
        {
          label: "Analyze First",
          icon: "📊",
          description: "Get your base score",
          onClick: (r) => r.push("/"),
        },
        {
          label: "ATS Scanner",
          icon: "🔍",
          description: "Check keyword match",
          onClick: (r) => r.push("/dashboard/scanner"),
        },
      ],
    };
  }

  if (pathname === "/dashboard/learning-paths") {
    return {
      primaryIcon: "📚",
      primaryLabel: "New Learning Path",
      primaryColor: "#ec4899",
      actions: [
        {
          label: "Generate Path",
          icon: "🚀",
          description: "AI-curated skill plan",
          onClick: () => {
            window.dispatchEvent(new CustomEvent("fab:generate-path"));
          },
        },
        {
          label: "Mock Interview",
          icon: "🎤",
          description: "Test your knowledge",
          onClick: (r) => r.push("/dashboard/interviews"),
        },
      ],
    };
  }

  // No FAB on settings or other pages
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function FloatingActionButton() {
  const config = useFABConfig();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => { setMounted(true); }, []);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
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

  // Close when route changes
  const pathname = usePathname();
  useEffect(() => { setOpen(false); }, [pathname]);

  if (!config || !mounted) return null;

  const color = config.primaryColor;

  return (
    <>
      <style>{`
        @keyframes fab-in {
          from { opacity: 0; transform: scale(0.7) rotate(-20deg); }
          to   { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes fab-action-in {
          from { opacity: 0; transform: translateY(8px) scale(0.88); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fab-label-in {
          from { opacity: 0; transform: translateX(6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .fab-btn {
          animation: fab-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .fab-action {
          animation: fab-action-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .fab-label {
          animation: fab-label-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .fab-action-row:hover .fab-action {
          border-color: var(--accent-border);
        }
        @media (prefers-reduced-motion: reduce) {
          .fab-btn, .fab-action, .fab-label { animation: none; }
        }
      `}</style>

      <div
        ref={wrapperRef}
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          zIndex: 9990,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 10,
        }}
      >
        {/* Speed-dial action items — rendered above FAB when open */}
        {open && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              alignItems: "flex-end",
              paddingBottom: 4,
            }}
          >
            {[...config.actions].reverse().map((action, idx) => (
              <div
                key={action.label}
                className="fab-action-row"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  animationDelay: `${idx * 40}ms`,
                  cursor: "pointer",
                }}
                onClick={() => {
                  action.onClick(router);
                  setOpen(false);
                }}
              >
                {/* Label pill */}
                <div
                  className="fab-label"
                  style={{
                    animationDelay: `${idx * 40}ms`,
                    padding: "5px 12px",
                    borderRadius: 99,
                    background: "var(--paper-card)",
                    border: "1px solid var(--border)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", lineHeight: 1.2 }}>
                    {action.label}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--ink-faint)", lineHeight: 1.2 }}>
                    {action.description}
                  </span>
                </div>

                {/* Action icon button */}
                <button
                  className="fab-action"
                  aria-label={action.label}
                  style={{
                    animationDelay: `${idx * 40}ms`,
                    width: 42,
                    height: 42,
                    flexShrink: 0,
                    borderRadius: 13,
                    border: "1px solid var(--border)",
                    background: "var(--paper-card)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.16)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    cursor: "pointer",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "scale(1.1)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.22)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 10px rgba(0,0,0,0.16)";
                  }}
                >
                  {action.icon}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Primary FAB */}
        <button
          className="fab-btn"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close quick actions" : config.primaryLabel}
          aria-expanded={open}
          title={config.primaryLabel}
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            border: "none",
            background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
            boxShadow: open
              ? `0 8px 24px rgba(0,0,0,0.3), 0 0 0 4px ${color}28`
              : `0 4px 16px rgba(0,0,0,0.22), 0 0 0 0px ${color}00`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#fff",
            fontSize: open ? 20 : 22,
            transition: reduced ? "none" : "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease, font-size 0.15s ease",
            transform: reduced ? "none" : (open ? "rotate(45deg) scale(1.05)" : "rotate(0deg) scale(1)"),
            position: "relative",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => {
            if (!open && !reduced) {
              (e.currentTarget as HTMLElement).style.transform = "scale(1.08)";
              (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px rgba(0,0,0,0.28), 0 0 0 4px ${color}22`;
            }
          }}
          onMouseLeave={(e) => {
            if (!open && !reduced) {
              (e.currentTarget as HTMLElement).style.transform = "scale(1)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.22), 0 0 0 0px transparent";
            }
          }}
        >
          {/* Shimmer overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 60%)",
              pointerEvents: "none",
              borderRadius: "inherit",
            }}
          />
          {/* Icon — cross when open, primary icon when closed */}
          <span
            style={{
              fontSize: open ? 18 : 22,
              lineHeight: 1,
              transition: "font-size 0.15s ease",
              position: "relative",
              zIndex: 1,
            }}
          >
            {open ? "✕" : config.primaryIcon}
          </span>
        </button>
      </div>
    </>
  );
}
