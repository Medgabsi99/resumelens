"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "./ThemeProvider";

// ─── Types ────────────────────────────────────────────────────
interface Command {
  id: string;
  label: string;
  description?: string;
  group: string;
  icon: React.ReactNode;
  keywords?: string[];
  action: () => void;
}

interface RecentAnalysis {
  id: string;
  score: number;
  target_role: string | null;
  created_at: string;
}

// ─── SVG Icon helpers ─────────────────────────────────────────
const Icon = ({ d, size = 15 }: { d: string; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

// ─── Fuzzy match ─────────────────────────────────────────────
function fuzzyMatch(query: string, target: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t.includes(q)) return true;
  // Character-subsequence match
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

// ─── Score colour helper ──────────────────────────────────────
function scoreColor(s: number) {
  if (s >= 85) return "#10b981";
  if (s >= 70) return "#6366f1";
  if (s >= 55) return "#f59e0b";
  return "#ef4444";
}

// ─── Main Component ───────────────────────────────────────────
interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: Props) {
  const router = useRouter();
  const { theme, toggle: toggleTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [analyses, setAnalyses] = useState<RecentAnalysis[]>([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();

  // ── Load recent analyses once on open ────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setSelectedIdx(0);
    inputRef.current?.focus();

    if (analyses.length === 0) {
      setLoadingAnalyses(true);
      fetch("/api/analyses")
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setAnalyses((d.data || []).slice(0, 5));
        })
        .catch(() => {})
        .finally(() => setLoadingAnalyses(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- analyses.length is derived from state; re-running when it changes would cause unwanted re-fetches
  }, [isOpen]);

  // ── Navigate helper (closes palette first) ────────────────────
  const go = useCallback(
    (href: string) => {
      onClose();
      startTransition(() => router.push(href));
    },
    [onClose, router]
  );

  // ── Static command registry ───────────────────────────────────
  const staticCommands: Command[] = [
    // Navigation
    {
      id: "nav-dashboard",
      label: "Dashboard",
      description: "Go to your main dashboard",
      group: "Navigate",
      keywords: ["home", "overview", "stats"],
      icon: <Icon d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />,
      action: () => go("/dashboard"),
    },
    {
      id: "nav-analytics",
      label: "Analytics",
      description: "View aggregate performance trends and conversion funnel",
      group: "Navigate",
      keywords: ["chart", "trend", "statistics", "funnel", "progress"],
      icon: <Icon d="M18 20V10M12 20V4M6 20v-6" />,
      action: () => go("/dashboard/analytics"),
    },
    {
      id: "nav-ab-testing",
      label: "A/B Testing",
      description: "Compare two resume versions side-by-side against a job description",
      group: "Navigate",
      keywords: ["ab", "test", "compare", "contrast", "variant", "venn"],
      icon: <Icon d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1" />,
      action: () => go("/dashboard/ab-testing"),
    },
    {
      id: "nav-analyze",
      label: "Analyze Resume",
      description: "Run a new resume analysis",
      group: "Navigate",
      keywords: ["new", "upload", "scan", "ats", "start"],
      icon: <Icon d="M9 11l3 3L22 4" />,
      action: () => go("/"),
    },
    {
      id: "nav-applications",
      label: "Job Applications",
      description: "Track your job search pipeline",
      group: "Navigate",
      keywords: ["jobs", "tracker", "pipeline", "kanban"],
      icon: (
        <Icon d="M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      ),
      action: () => go("/dashboard/applications"),
    },
    {
      id: "nav-negotiator",
      label: "Salary Negotiator",
      description: "Practice salary negotiation with AI",
      group: "Navigate",
      keywords: ["salary", "money", "offer", "negotiate", "compensation"],
      icon: <Icon d="M12 1v22M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6" />,
      action: () => go("/dashboard/negotiator"),
    },
    {
      id: "nav-interviews",
      label: "Mock Interviews",
      description: "AI-powered interview simulator",
      group: "Navigate",
      keywords: ["interview", "practice", "questions", "behavioral", "speech"],
      icon: <Icon d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />,
      action: () => go("/dashboard/interviews"),
    },
    {
      id: "nav-scanner",
      label: "ATS Scanner",
      description: "Deep-dive ATS structural scan",
      group: "Navigate",
      keywords: ["ats", "parse", "heatmap", "format", "scan"],
      icon: <Icon d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" />,
      action: () => go("/dashboard/scanner"),
    },
    {
      id: "nav-learning",
      label: "Learning Paths",
      description: "AI-generated skill gap roadmaps",
      group: "Navigate",
      keywords: ["learn", "skills", "gap", "roadmap", "upskill", "course"],
      icon: <Icon d="M22 10v6M2 10l10-5 10 5-10 5z" />,
      action: () => go("/dashboard/learning-paths"),
    },
    {
      id: "nav-pricing",
      label: "Pricing & Plans",
      description: "View subscription options",
      group: "Navigate",
      keywords: ["upgrade", "plan", "pro", "billing", "subscription"],
      icon: <Icon d="M20 12V22H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />,
      action: () => go("/pricing"),
    },
    {
      id: "nav-extension",
      label: "Chrome Extension Integration",
      description: "Setup and install Chrome Job Matcher extension",
      group: "Navigate",
      keywords: ["chrome", "extension", "plugin", "download", "install", "scraped"],
      icon: <Icon d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />,
      action: () => go("/dashboard/settings"),
    },
    // Actions
    {
      id: "action-theme",
      label: `Switch to ${theme === "light" ? "Dark" : "Light"} Mode`,
      description: "Toggle the colour scheme",
      group: "Actions",
      keywords: ["dark", "light", "theme", "colour", "mode"],
      icon:
        theme === "light" ? (
          <Icon d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        ) : (
          <Icon d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 6a6 6 0 0 0 0 12 6 6 0 0 0 0-12z" />
        ),
      action: () => {
        toggleTheme();
        onClose();
      },
    },
    {
      id: "action-new-analysis",
      label: "New Resume Analysis",
      description: "Upload or paste a resume to analyze",
      group: "Actions",
      keywords: ["new", "create", "upload", "start", "paste"],
      icon: <Icon d="M12 5v14M5 12h14" />,
      action: () => go("/"),
    },
  ];

  // ── Recent analyses as commands ───────────────────────────────
  const recentCommands: Command[] = analyses.map((a) => ({
    id: `recent-${a.id}`,
    label: a.target_role || "General Resume Review",
    description: `Score ${a.score} · ${new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
    group: "Recent Analyses",
    keywords: [a.target_role || "", String(a.score)],
    icon: (
      <span
        style={{
          fontFamily: "DM Mono, monospace",
          fontSize: 11,
          fontWeight: 700,
          color: scoreColor(a.score),
          minWidth: 24,
          textAlign: "center",
        }}
      >
        {a.score}
      </span>
    ),
    action: () => go(`/dashboard/${a.id}`),
  }));

  // ── Filtered command list ────────────────────────────────────
  const allCommands = [...staticCommands, ...recentCommands];
  const filtered = allCommands.filter(
    (c) =>
      fuzzyMatch(query, c.label) ||
      (c.description && fuzzyMatch(query, c.description)) ||
      (c.keywords || []).some((k) => fuzzyMatch(query, k))
  );

  // Group the filtered results
  const groups: Record<string, Command[]> = {};
  filtered.forEach((c) => {
    if (!groups[c.group]) groups[c.group] = [];
    groups[c.group].push(c);
  });

  // Flat list for keyboard navigation
  const flat = filtered;

  // ── Keep selectedIdx in bounds when query changes ─────────────
  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  // ── Scroll selected item into view ────────────────────────────
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${selectedIdx}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [selectedIdx]);

  // ── Keyboard navigation ───────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIdx((i) => Math.min(i + 1, flat.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIdx((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (flat[selectedIdx]) flat[selectedIdx].action();
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [flat, selectedIdx, onClose]
  );

  if (!isOpen) return null;

  // ── Flat index tracker across groups ─────────────────────────
  let flatIdx = 0;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(6px)",
          zIndex: 9998,
          animation: "cpFadeIn 0.12s ease",
        }}
      />

      {/* Palette panel */}
      <div
        style={{
          position: "fixed",
          top: "12vh",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(620px, calc(100vw - 32px))",
          background: "var(--paper-card)",
          border: "1px solid var(--accent-border)",
          borderRadius: 16,
          boxShadow:
            "0 32px 64px -16px rgba(0,0,0,0.5), 0 0 0 1px var(--accent-border), 0 0 60px -20px var(--brand-glow)",
          zIndex: 9999,
          overflow: "hidden",
          animation: "cpSlideIn 0.15s cubic-bezier(0.16,1,0.3,1)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "70vh",
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes cpFadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes cpSlideIn { from { opacity: 0; transform: translateX(-50%) translateY(-8px) scale(0.97); } to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); } }
        `}} />

        {/* Search bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 18px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {/* Search icon */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--ink-muted)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands, pages, analyses…"
            autoComplete="off"
            spellCheck={false}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 16,
              color: "var(--ink)",
              fontFamily: "Instrument Sans, system-ui, sans-serif",
              fontWeight: 500,
            }}
          />

          <kbd
            style={{
              fontSize: 11,
              fontFamily: "DM Mono, monospace",
              color: "var(--ink-faint)",
              background: "var(--paper-warm)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "2px 7px",
              flexShrink: 0,
            }}
          >
            esc
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          style={{ overflowY: "auto", padding: "8px 0" }}
        >
          {flat.length === 0 && (
            <div
              style={{
                padding: "32px 20px",
                textAlign: "center",
                color: "var(--ink-faint)",
                fontSize: 14,
              }}
            >
              No results for &quot;{query}&quot;
            </div>
          )}

          {Object.entries(groups).map(([groupName, cmds]) => (
            <div key={groupName}>
              {/* Group header */}
              <div
                style={{
                  fontSize: 10,
                  fontFamily: "DM Mono, monospace",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--ink-faint)",
                  padding: "8px 18px 4px",
                }}
              >
                {groupName}
                {groupName === "Recent Analyses" && loadingAnalyses && (
                  <span style={{ marginLeft: 8, opacity: 0.5 }}>Loading…</span>
                )}
              </div>

              {cmds.map((cmd) => {
                const idx = flatIdx++;
                const isSelected = idx === selectedIdx;
                return (
                  <button
                    key={cmd.id}
                    data-idx={idx}
                    onClick={cmd.action}
                    onMouseEnter={() => setSelectedIdx(idx)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 18px",
                      background: isSelected
                        ? "var(--accent-bg)"
                        : "transparent",
                      border: "none",
                      borderLeft: isSelected
                        ? "2px solid var(--accent)"
                        : "2px solid transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.1s, border-color 0.1s",
                    }}
                  >
                    {/* Icon */}
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 8,
                        background: isSelected
                          ? "var(--accent)"
                          : "var(--paper-warm)",
                        color: isSelected ? "white" : "var(--ink-muted)",
                        flexShrink: 0,
                        transition: "background 0.1s, color 0.1s",
                      }}
                    >
                      {cmd.icon}
                    </span>

                    {/* Label + description */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: isSelected ? "var(--accent)" : "var(--ink)",
                          fontFamily: "Instrument Sans, system-ui, sans-serif",
                          lineHeight: 1.2,
                        }}
                      >
                        {cmd.label}
                      </div>
                      {cmd.description && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--ink-faint)",
                            fontFamily: "Instrument Sans, system-ui, sans-serif",
                            marginTop: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {cmd.description}
                        </div>
                      )}
                    </div>

                    {/* Enter hint on selected */}
                    {isSelected && (
                      <kbd
                        style={{
                          fontSize: 10,
                          fontFamily: "DM Mono, monospace",
                          color: "var(--accent)",
                          background: "var(--accent-bg)",
                          border: "1px solid var(--accent-border)",
                          borderRadius: 5,
                          padding: "2px 6px",
                          flexShrink: 0,
                        }}
                      >
                        ↵
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer hints */}
        <div
          style={{
            display: "flex",
            gap: 16,
            padding: "10px 18px",
            borderTop: "1px solid var(--border)",
            background: "var(--paper-warm)",
          }}
        >
          {[
            { keys: ["↑", "↓"], label: "navigate" },
            { keys: ["↵"], label: "select" },
            { keys: ["esc"], label: "close" },
          ].map(({ keys, label }) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                color: "var(--ink-faint)",
                fontFamily: "Instrument Sans, system-ui, sans-serif",
              }}
            >
              {keys.map((k) => (
                <kbd
                  key={k}
                  style={{
                    fontFamily: "DM Mono, monospace",
                    fontSize: 10,
                    background: "var(--paper-card)",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    padding: "1px 5px",
                    color: "var(--ink-muted)",
                  }}
                >
                  {k}
                </kbd>
              ))}
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
