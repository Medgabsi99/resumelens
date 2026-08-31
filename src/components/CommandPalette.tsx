"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./ThemeProvider";
import {
  Search,
  Sparkles,
  Download,
  FileText,
  MessageSquare,
  Briefcase,
  Layers,
  Award,
  SunMoon,
  Zap,
  Target,
  Mail,
  HelpCircle,
  X,
  CornerDownLeft,
  LayoutDashboard,
  Mic,
  DollarSign,
  GraduationCap,
  Users,
  BarChart3,
  Settings,
  Puzzle,
  SplitSquareVertical,
  PenTool,
} from "lucide-react";

export interface CommandItem {
  id: string;
  category: "Actions" | "Navigation" | "AI Tools" | "Archetypes" | "System";
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab?: (tab: "overview" | "analysis" | "match" | "tools") => void;
  onStartDemo?: (archetype: "swe" | "pm" | "ml") => void;
  onDownloadPdf?: () => void;
  onToggleTheme?: () => void;
  onOpenAutoFix?: () => void;
  onOpenBragStudio?: () => void;
  onOpenDiffViewer?: () => void;
  onOpenCoverLetter?: () => void;
  onOpenInterview?: () => void;
  onOpenOutreach?: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onSelectTab,
  onStartDemo,
  onDownloadPdf,
  onToggleTheme,
  onOpenAutoFix,
  onOpenBragStudio,
  onOpenDiffViewer,
  onOpenCoverLetter,
  onOpenInterview,
  onOpenOutreach,
}: Props) {
  const router = useRouter();
  const { toggle: toggleThemeHook } = useTheme();
  const handleToggleTheme = onToggleTheme || toggleThemeHook;

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // List of all commands
  const allCommands: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [];

    // ── Quick Actions (Contextual) ──────────────────────────
    if (onDownloadPdf) {
      list.push({
        id: "download-pdf",
        category: "Actions",
        title: "Download Resume PDF",
        subtitle: "Export ATS-optimized PDF resume",
        icon: <Download size={16} className="text-orange-500" />,
        shortcut: "⌘P",
        action: () => {
          onDownloadPdf();
          onClose();
        },
      });
    }

    if (onOpenAutoFix) {
      list.push({
        id: "auto-fix",
        category: "Actions",
        title: "Auto-Fix Resume (One-Click Polish)",
        subtitle: "Apply all high-impact XYZ rewrites",
        icon: <Zap size={16} className="text-amber-500" />,
        shortcut: "⌘F",
        action: () => {
          onOpenAutoFix();
          onClose();
        },
      });
    }

    if (onOpenBragStudio) {
      list.push({
        id: "brag-studio",
        category: "Actions",
        title: "Share Achievement Badge",
        subtitle: "Generate high-resolution LinkedIn / Twitter card",
        icon: <Award size={16} className="text-blue-500" />,
        action: () => {
          onOpenBragStudio();
          onClose();
        },
      });
    }

    if (onOpenDiffViewer) {
      list.push({
        id: "diff-viewer",
        category: "Actions",
        title: "Compare Changes (Diff Viewer)",
        subtitle: "Inspect before & after side-by-side modifications",
        icon: <Layers size={16} className="text-accent" />,
        action: () => {
          onOpenDiffViewer();
          onClose();
        },
      });
    }

    // ── Navigation Tabs (Contextual on Scan Report) ─────────
    if (onSelectTab) {
      list.push(
        {
          id: "tab-overview",
          category: "Navigation",
          title: "Go to Overview & Executive Summary",
          subtitle: "Score hero, strengths, weaknesses, and booster checklist",
          icon: <Sparkles size={16} className="text-orange-500" />,
          shortcut: "1",
          action: () => {
            onSelectTab("overview");
            onClose();
          },
        },
        {
          id: "tab-analysis",
          category: "Navigation",
          title: "Go to Deep ATS Audit & Heatmap",
          subtitle: "Deterministic rules, 360° radar, recruiter eye-tracking",
          icon: <Target size={16} className="text-emerald-500" />,
          shortcut: "2",
          action: () => {
            onSelectTab("analysis");
            onClose();
          },
        },
        {
          id: "tab-match",
          category: "Navigation",
          title: "Go to Job Match & ATS Simulator",
          subtitle: "Compatibility matrix, Workday & Taleo simulation",
          icon: <Briefcase size={16} className="text-indigo-500" />,
          shortcut: "3",
          action: () => {
            onSelectTab("match");
            onClose();
          },
        },
        {
          id: "tab-tools",
          category: "Navigation",
          title: "Go to Career Acceleration Tools",
          subtitle: "Cover letters, mock interview prep, cold outreach",
          icon: <Layers size={16} className="text-pink-500" />,
          shortcut: "4",
          action: () => {
            onSelectTab("tools");
            onClose();
          },
        }
      );
    }

    // ── Global Dashboard Navigation Routes ───────────────────
    list.push(
      {
        id: "nav-dashboard",
        category: "Navigation",
        title: "Dashboard Overview",
        subtitle: "Main career intelligence center & quick stats",
        icon: <LayoutDashboard size={16} className="text-accent" />,
        shortcut: "G D",
        action: () => {
          router.push("/dashboard");
          onClose();
        },
      },
      {
        id: "nav-builder",
        category: "Navigation",
        title: "Resume Builder",
        subtitle: "Multi-template visual editor with live ATS preview",
        icon: <PenTool size={16} className="text-blue-500" />,
        action: () => {
          router.push("/dashboard/builder");
          onClose();
        },
      },
      {
        id: "nav-scanner",
        category: "Navigation",
        title: "ATS Scanner & Auditor",
        subtitle: "Deterministic rules, 360° radar, and recruiter eye-tracking",
        icon: <Target size={16} className="text-emerald-500" />,
        shortcut: "G S",
        action: () => {
          router.push("/dashboard/scanner");
          onClose();
        },
      },
      {
        id: "nav-interviews",
        category: "Navigation",
        title: "Mock Interview Simulator",
        subtitle: "STAR method behavioral & speech-enabled technical drills",
        icon: <Mic size={16} className="text-amber-500" />,
        shortcut: "G I",
        action: () => {
          router.push("/dashboard/interviews");
          onClose();
        },
      },
      {
        id: "nav-negotiator",
        category: "Navigation",
        title: "Salary Negotiator",
        subtitle: "Offer counter-scripts, leverage calculator, and equity charts",
        icon: <DollarSign size={16} className="text-emerald-500" />,
        shortcut: "G N",
        action: () => {
          router.push("/dashboard/negotiator");
          onClose();
        },
      },
      {
        id: "nav-applications",
        category: "Navigation",
        title: "Application Tracker (CRM)",
        subtitle: "Kanban board & recruiter outreach tracker",
        icon: <Briefcase size={16} className="text-indigo-500" />,
        shortcut: "G A",
        action: () => {
          router.push("/dashboard/applications");
          onClose();
        },
      },
      {
        id: "nav-tailor",
        category: "Navigation",
        title: "Tailor Sandbox",
        subtitle: "Multi-job compatibility matrix & keyword alignment",
        icon: <Sparkles size={16} className="text-accent" />,
        shortcut: "G T",
        action: () => {
          router.push("/dashboard/tailor");
          onClose();
        },
      },
      {
        id: "nav-committee",
        category: "Navigation",
        title: "Recruiter Committee Sandbox",
        subtitle: "Hiring manager, tech lead & HR consensus simulation",
        icon: <Users size={16} className="text-blue-500" />,
        shortcut: "G C",
        action: () => {
          router.push("/dashboard/committee");
          onClose();
        },
      },
      {
        id: "nav-ab-testing",
        category: "Navigation",
        title: "A/B Version Testing",
        subtitle: "Side-by-side resume comparison & diff scorecards",
        icon: <SplitSquareVertical size={16} className="text-cyan-500" />,
        shortcut: "G B",
        action: () => {
          router.push("/dashboard/ab-testing");
          onClose();
        },
      },
      {
        id: "nav-analytics",
        category: "Navigation",
        title: "Analytics & Velocity",
        subtitle: "Application response rates & scoring trajectory",
        icon: <BarChart3 size={16} className="text-indigo-500" />,
        shortcut: "G Y",
        action: () => {
          router.push("/dashboard/analytics");
          onClose();
        },
      },
      {
        id: "nav-learning",
        category: "Navigation",
        title: "Learning Paths",
        subtitle: "Personalized skill roadmap & course recommendations",
        icon: <GraduationCap size={16} className="text-emerald-500" />,
        shortcut: "G L",
        action: () => {
          router.push("/dashboard/learning-paths");
          onClose();
        },
      },
      {
        id: "nav-extension",
        category: "Navigation",
        title: "Chrome Extension Hub",
        subtitle: "Live in-page job overlay for LinkedIn & Indeed",
        icon: <Puzzle size={16} className="text-accent" />,
        action: () => {
          router.push("/extension");
          onClose();
        },
      },
      {
        id: "nav-settings",
        category: "Navigation",
        title: "Settings & Preferences",
        subtitle: "Account configuration, privacy, and preferences",
        icon: <Settings size={16} className="text-slate-400" />,
        shortcut: "G E",
        action: () => {
          router.push("/dashboard/settings");
          onClose();
        },
      }
    );

    // ── Career Acceleration Tools ────────────────────────────
    if (onOpenCoverLetter || onSelectTab) {
      list.push({
        id: "ai-cover-letter",
        category: "AI Tools",
        title: "Generate Tailored Cover Letter",
        subtitle: "Create job-specific application letter",
        icon: <FileText size={16} className="text-cyan-500" />,
        action: () => {
          if (onOpenCoverLetter) onOpenCoverLetter();
          else if (onSelectTab) onSelectTab("tools");
          onClose();
        },
      });
    }

    if (onOpenInterview || onSelectTab) {
      list.push({
        id: "ai-interview",
        category: "AI Tools",
        title: "Launch Mock Interview Simulator",
        subtitle: "STAR method behavioral and technical practice",
        icon: <HelpCircle size={16} className="text-amber-500" />,
        action: () => {
          if (onOpenInterview) onOpenInterview();
          else if (onSelectTab) onSelectTab("tools");
          onClose();
        },
      });
    }

    if (onOpenOutreach || onSelectTab) {
      list.push({
        id: "ai-outreach",
        category: "AI Tools",
        title: "Generate Recruiter Cold Outreach",
        subtitle: "LinkedIn InMail and cold email templates",
        icon: <Mail size={16} className="text-emerald-500" />,
        action: () => {
          if (onOpenOutreach) onOpenOutreach();
          else if (onSelectTab) onSelectTab("tools");
          onClose();
        },
      });
    }

    // ── Demo Archetypes (Contextual) ─────────────────────────
    if (onStartDemo) {
      list.push(
        {
          id: "demo-swe",
          category: "Archetypes",
          title: "Load Software Engineering Demo",
          subtitle: "Senior Full-Stack Developer sample report (Score 74)",
          icon: <Zap size={16} className="text-orange-500" />,
          action: () => {
            onStartDemo("swe");
            onClose();
          },
        },
        {
          id: "demo-pm",
          category: "Archetypes",
          title: "Load Product Management Demo",
          subtitle: "Senior Product Manager sample report (Score 68)",
          icon: <Zap size={16} className="text-blue-500" />,
          action: () => {
            onStartDemo("pm");
            onClose();
          },
        },
        {
          id: "demo-ml",
          category: "Archetypes",
          title: "Load Machine Learning / AI Demo",
          subtitle: "Machine Learning Engineer sample report (Score 82)",
          icon: <Zap size={16} className="text-blue-500" />,
          action: () => {
            onStartDemo("ml");
            onClose();
          },
        }
      );
    }

    // ── System ───────────────────────────────────────────────
    list.push({
      id: "theme-toggle",
      category: "System",
      title: "Toggle Dark / Light Theme",
      subtitle: "Switch appearance mode",
      icon: <SunMoon size={16} className="text-amber-400" />,
      shortcut: "⌘T",
      action: () => {
        handleToggleTheme();
        onClose();
      },
    });

    return list;
  }, [
    onDownloadPdf,
    onOpenAutoFix,
    onOpenBragStudio,
    onOpenDiffViewer,
    onSelectTab,
    onOpenCoverLetter,
    onOpenInterview,
    onOpenOutreach,
    onStartDemo,
    handleToggleTheme,
    router,
    onClose,
  ]);

  // Filter commands by search query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return allCommands;
    const lower = query.toLowerCase();
    return allCommands.filter(
      (c) =>
        c.title.toLowerCase().includes(lower) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(lower)) ||
        c.category.toLowerCase().includes(lower)
    );
  }, [allCommands, query]);

  // Reset index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Auto focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % (filteredCommands.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filteredCommands.length) % (filteredCommands.length || 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = filteredCommands[selectedIndex];
        if (selected) {
          selected.action();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Group commands by category for display
  const grouped = useMemo(() => {
    const groups: { [cat: string]: { item: CommandItem; index: number }[] } = {};
    let runningIndex = 0;
    filteredCommands.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push({ item, index: runningIndex++ });
    });
    return groups;
  }, [filteredCommands]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
        style={{
          background: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(8px)",
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          style={{
            background: "var(--paper-card)",
            border: "1px solid var(--border)",
            borderRadius: 20,
            width: "100%",
            maxWidth: 620,
            boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(249, 115, 22, 0.15)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "16px 20px",
              borderBottom: "1px solid var(--border)",
              background: "var(--paper-warm)",
            }}
          >
            <Search size={18} className="text-orange-500 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command or search tools... (e.g. PDF, cover, demo, audit)"
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                width: "100%",
                fontSize: 14.5,
                color: "var(--ink)",
                fontFamily: "Instrument Sans, sans-serif",
                fontWeight: 600,
              }}
            />
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--ink-faint)",
                cursor: "pointer",
                padding: 4,
                borderRadius: 6,
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Commands List */}
          <div
            ref={listRef}
            style={{
              maxHeight: 380,
              overflowY: "auto",
              padding: "10px 12px 14px",
            }}
          >
            {filteredCommands.length === 0 ? (
              <div className="py-12 text-center text-ink-muted text-sm font-medium">
                No matching commands found for &ldquo;{query}&rdquo;
              </div>
            ) : (
              Object.entries(grouped).map(([category, items]) => (
                <div key={category} style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      fontSize: 10.5,
                      fontFamily: "DM Mono, monospace",
                      fontWeight: 800,
                      color: "var(--ink-faint)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      padding: "6px 10px 4px",
                    }}
                  >
                    {category}
                  </div>
                  {items.map(({ item, index }) => {
                    const isSelected = index === selectedIndex;
                    return (
                      <div
                        key={item.id}
                        onClick={() => item.action()}
                        onMouseEnter={() => setSelectedIndex(index)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                          padding: "9px 12px",
                          borderRadius: 12,
                          background: isSelected ? "var(--accent-bg)" : "transparent",
                          border: `1px solid ${isSelected ? "var(--accent-border)" : "transparent"}`,
                          cursor: "pointer",
                          transition: "all 0.1s ease",
                        }}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="shrink-0">{item.icon}</div>
                          <div className="min-w-0 flex-1">
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: isSelected ? 800 : 600,
                                color: isSelected ? "var(--accent)" : "var(--ink)",
                                fontFamily: "Instrument Sans, sans-serif",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {item.title}
                            </div>
                            {item.subtitle && (
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "var(--ink-muted)",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {item.subtitle}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Shortcut or Enter icon */}
                        <div className="flex items-center gap-2 shrink-0">
                          {item.shortcut && (
                            <span
                              style={{
                                fontSize: 10,
                                fontFamily: "DM Mono, monospace",
                                fontWeight: 700,
                                padding: "2px 6px",
                                borderRadius: 6,
                                background: "var(--paper-warm)",
                                border: "1px solid var(--border)",
                                color: "var(--ink-faint)",
                              }}
                            >
                              {item.shortcut}
                            </span>
                          )}
                          {isSelected && (
                            <CornerDownLeft size={13} className="text-orange-500 animate-pulse" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer Guide */}
          <div
            style={{
              padding: "10px 16px",
              borderTop: "1px solid var(--border)",
              background: "var(--paper-warm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 11,
              fontFamily: "DM Mono, monospace",
              color: "var(--ink-faint)",
            }}
          >
            <div className="flex items-center gap-3">
              <span>↑↓ to navigate</span>
              <span>↵ to select</span>
              <span>esc to close</span>
            </div>
            <div className="hidden sm:flex items-center gap-1">
              <span>ResumeLens Quick Actions</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
