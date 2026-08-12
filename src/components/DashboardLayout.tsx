"use client";
import { logger } from "@/lib/logger";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import ThemeToggle from "./ThemeToggle";
import { createBrowserClient } from "@/lib/supabase";
import CommandPalette from "./CommandPalette";
import AuroraBackground from "./AuroraBackground";
import PageTransition from "./PageTransition";
import OnboardingTour from "./OnboardingTour";
import KeyboardShortcutsPanel from "./KeyboardShortcutsPanel";
import Breadcrumbs from "./Breadcrumbs";
import { useTheme } from "./ThemeProvider";
import NotificationBell from "./NotificationBell";
import ScrollToTop from "./ScrollToTop";
import FloatingActionButton from "./FloatingActionButton";
import {
  Home,
  Briefcase,
  DollarSign,
  Mic,
  Search,
  GraduationCap,
  Settings,
  Menu,
  X,
  Sparkles,
  Users,
  User,
  LogOut,
  ChevronLeft,
  BarChart2,
  GitCompare,
  Columns,
  PenSquare,
  Puzzle,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  matchPaths: string[];
  shortcut: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <Home size={15} />,
    matchPaths: ["/dashboard"],
    shortcut: "g + d",
  },
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    icon: <BarChart2 size={15} />,
    matchPaths: ["/dashboard/analytics"],
    shortcut: "g + y",
  },
  {
    href: "/dashboard/ab-testing",
    label: "A/B Testing",
    icon: <GitCompare size={15} />,
    matchPaths: ["/dashboard/ab-testing"],
    shortcut: "g + b",
  },
  {
    href: "/dashboard/compare",
    label: "Compare Resumes",
    icon: <Columns size={15} />,
    matchPaths: ["/dashboard/compare"],
    shortcut: "g + m",
  },
  {
    href: "/dashboard/builder",
    label: "Resume Builder",
    icon: <PenSquare size={15} />,
    matchPaths: ["/dashboard/builder"],
    shortcut: "g + w",
  },
  {
    href: "/dashboard/applications",
    label: "Applications",
    icon: <Briefcase size={15} />,
    matchPaths: ["/dashboard/applications"],
    shortcut: "g + a",
  },
  {
    href: "/dashboard/extension",
    label: "Chrome Extension",
    icon: <Puzzle size={15} />,
    matchPaths: ["/dashboard/extension"],
    shortcut: "g + x",
  },
  {
    href: "/dashboard/negotiator",
    label: "Salary Negotiator",
    icon: <DollarSign size={15} />,
    matchPaths: ["/dashboard/negotiator"],
    shortcut: "g + n",
  },
  {
    href: "/dashboard/interviews",
    label: "Mock Interviews",
    icon: <Mic size={15} />,
    matchPaths: ["/dashboard/interviews"],
    shortcut: "g + i",
  },
  {
    href: "/dashboard/scanner",
    label: "ATS Scanner",
    icon: <Search size={15} />,
    matchPaths: ["/dashboard/scanner"],
    shortcut: "g + s",
  },
  {
    href: "/dashboard/learning-paths",
    label: "Learning Paths",
    icon: <GraduationCap size={15} />,
    matchPaths: ["/dashboard/learning-paths"],
    shortcut: "g + l",
  },
  {
    href: "/dashboard/tailor",
    label: "Tailor Sandbox",
    icon: <Sparkles size={15} />,
    matchPaths: ["/dashboard/tailor"],
    shortcut: "g + t",
  },
  {
    href: "/dashboard/committee",
    label: "Recruiter Sandbox",
    icon: <Users size={15} />,
    matchPaths: ["/dashboard/committee"],
    shortcut: "g + c",
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: <Settings size={15} />,
    matchPaths: ["/dashboard/settings"],
    shortcut: "g + e",
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  // Collapsible Sidebar States
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const gPendingRef = useRef(false); // tracks "G" prefix for go-to shortcuts
  const gTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toggle: toggleTheme } = useTheme();

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) setUserEmail(session.user.email);
    });
  }, []);

  // Initialize preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved === "true") setCollapsed(true);
    setMounted(true);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleSidebar = useCallback(() => {
    setCollapsed((v) => {
      const nextVal = !v;
      localStorage.setItem("sidebar_collapsed", String(nextVal));
      return nextVal;
    });
  }, []);

  // ── Unified global keyboard handler ──────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // ── ⌘K / Ctrl+K — command palette ────────────────────
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }

      // ── ⌘\ / Ctrl+\ — sidebar toggle ─────────────────────
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Skip single-key shortcuts when focus is in a text field
      const tag = (e.target as HTMLElement)?.tagName;
      const isEditable =
        tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;
      if (isEditable || e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key;

      // ── G prefix — vim-style go-to navigation ─────────────
      if (gPendingRef.current) {
        gPendingRef.current = false;
        if (gTimerRef.current) clearTimeout(gTimerRef.current);
        const GOTO: Record<string, string> = {
          d: "/dashboard",
          y: "/dashboard/analytics",
          b: "/dashboard/ab-testing",
          a: "/dashboard/applications",
          n: "/dashboard/negotiator",
          i: "/dashboard/interviews",
          s: "/dashboard/scanner",
          l: "/dashboard/learning-paths",
          t: "/dashboard/tailor",
          c: "/dashboard/committee",
          e: "/dashboard/settings",
          h: "/",
        };
        const dest = GOTO[key.toLowerCase()];
        if (dest) {
          e.preventDefault();
          router.push(dest);
        }
        return;
      }

      // ── G — prime the go-to sequence ──────────────────────
      if (key === "g" || key === "G") {
        e.preventDefault();
        gPendingRef.current = true;
        // Auto-cancel after 800 ms if no second key arrives
        gTimerRef.current = setTimeout(() => {
          gPendingRef.current = false;
        }, 800);
        return;
      }

      // ── [ — toggle sidebar (single-key, VS-Code-style) ────
      if (key === "[") {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // ── ? — shortcuts panel ───────────────────────────────
      if (key === "?") {
        e.preventDefault();
        setShortcutsOpen((v) => !v);
        return;
      }

      // ── T — toggle theme ──────────────────────────────────
      if (key === "t" || key === "T") {
        e.preventDefault();
        toggleTheme();
        return;
      }

      // ── Escape — close any open overlay ──────────────────
      if (key === "Escape") {
        setPaletteOpen(false);
        setShortcutsOpen(false);
        return;
      }
    },
    [router, toggleTheme, toggleSidebar]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (gTimerRef.current) clearTimeout(gTimerRef.current);
    };
  }, [handleKeyDown]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    }
    if (mobileOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileOpen]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (e) {
      logger.error("Sign out failed", e);
    } finally {
      setSigningOut(false);
    }
  }

  const isActive = (item: NavItem) =>
    item.matchPaths.some((p) =>
      p === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(p)
    );

  const isCollapsed = mounted && collapsed;

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--paper)" }}>
      {/* Aurora animated background */}
      <AuroraBackground />

      <div className="flex min-h-screen relative z-10">
        {/* Left Pane: Desktop Sticky Sidebar */}
        <aside
          className={`hidden lg:flex flex-col h-screen sticky top-0 border-r border-border backdrop-blur-md z-40 select-none flex-shrink-0 transition-all duration-300 ease-in-out relative ${
            isCollapsed ? "w-20" : "w-64"
          }`}
          style={{ background: "var(--nav-bg)" }}
        >
          {/* Collapse Toggle Button */}
          <button
            onClick={toggleSidebar}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="absolute -right-3 top-6 z-50 w-6 h-6 bg-paper border border-border hover:border-accent hover:text-accent rounded-full flex items-center justify-center cursor-pointer transition shadow-md focus:outline-none"
          >
            <ChevronLeft
              className={`w-3.5 h-3.5 text-ink-muted transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
              strokeWidth={3}
            />
          </button>

          {/* Brand branding */}
          <div className="p-6 border-b border-border flex items-center justify-between h-[73px]">
            {isCollapsed ? (
              <span className="bg-gradient-to-br from-accent to-amber-500 text-white w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shadow-md select-none mx-auto">
                RL
              </span>
            ) : (
              <Link
                href="/"
                className="font-display text-xl font-bold tracking-tight no-underline text-ink hover:text-accent transition-colors flex items-center gap-2.5 truncate"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-amber-500 flex items-center justify-center text-white font-black text-xs shadow-md flex-shrink-0">
                  RL
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-heading font-extrabold text-base leading-tight tracking-tight text-ink">
                    ResumeLens
                  </span>
                  <span className="font-mono text-[9px] font-bold text-accent tracking-wider uppercase">
                    Pro Edition
                  </span>
                </div>
              </Link>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
            {/* Section 1: Main */}
            <div>
              {!isCollapsed && (
                <div className="px-3 mb-2 font-mono text-[9px] font-bold tracking-wider text-ink-faint uppercase">
                  Workspace
                </div>
              )}
              <div className="space-y-1">
                {NAV_ITEMS.slice(0, 5).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? `${item.label} (${item.shortcut})` : undefined}
                    className={`group relative px-3 py-2 rounded-xl text-xs font-semibold no-underline flex items-center transition-all duration-200 ${
                      isCollapsed ? "justify-center" : "gap-3"
                    }`}
                    style={{
                      color: isActive(item) ? "var(--accent)" : "var(--ink-muted)",
                      background: isActive(item) ? "var(--accent-bg)" : "transparent",
                      border: `1px solid ${isActive(item) ? "var(--accent-border)" : "transparent"}`,
                    }}
                  >
                    {isActive(item) && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-accent rounded-r-full shadow-sm" />
                    )}
                    <span className="flex-shrink-0 opacity-90 transition-transform group-hover:scale-110">
                      {item.icon}
                    </span>
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                    {!isCollapsed && (
                      <span className="ml-auto font-mono text-[9px] font-medium text-ink-faint opacity-40 group-hover:opacity-100 transition bg-paper border border-border px-1.5 py-0.5 rounded leading-none select-none flex-shrink-0">
                        {item.shortcut}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>

            {/* Section 2: AI Suite */}
            <div>
              {!isCollapsed && (
                <div className="px-3 mb-2 font-mono text-[9px] font-bold tracking-wider text-ink-faint uppercase">
                  AI Optimization
                </div>
              )}
              <div className="space-y-1">
                {NAV_ITEMS.slice(5, 10).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? `${item.label} (${item.shortcut})` : undefined}
                    className={`group relative px-3 py-2 rounded-xl text-xs font-semibold no-underline flex items-center transition-all duration-200 ${
                      isCollapsed ? "justify-center" : "gap-3"
                    }`}
                    style={{
                      color: isActive(item) ? "var(--accent)" : "var(--ink-muted)",
                      background: isActive(item) ? "var(--accent-bg)" : "transparent",
                      border: `1px solid ${isActive(item) ? "var(--accent-border)" : "transparent"}`,
                    }}
                  >
                    {isActive(item) && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-accent rounded-r-full shadow-sm" />
                    )}
                    <span className="flex-shrink-0 opacity-90 transition-transform group-hover:scale-110">
                      {item.icon}
                    </span>
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                    {!isCollapsed && (
                      <span className="ml-auto font-mono text-[9px] font-medium text-ink-faint opacity-40 group-hover:opacity-100 transition bg-paper border border-border px-1.5 py-0.5 rounded leading-none select-none flex-shrink-0">
                        {item.shortcut}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>

            {/* Section 3: Tools & Growth */}
            <div>
              {!isCollapsed && (
                <div className="px-3 mb-2 font-mono text-[9px] font-bold tracking-wider text-ink-faint uppercase">
                  Career Growth
                </div>
              )}
              <div className="space-y-1">
                {NAV_ITEMS.slice(10).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? `${item.label} (${item.shortcut})` : undefined}
                    className={`group relative px-3 py-2 rounded-xl text-xs font-semibold no-underline flex items-center transition-all duration-200 ${
                      isCollapsed ? "justify-center" : "gap-3"
                    }`}
                    style={{
                      color: isActive(item) ? "var(--accent)" : "var(--ink-muted)",
                      background: isActive(item) ? "var(--accent-bg)" : "transparent",
                      border: `1px solid ${isActive(item) ? "var(--accent-border)" : "transparent"}`,
                    }}
                  >
                    {isActive(item) && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-accent rounded-r-full shadow-sm" />
                    )}
                    <span className="flex-shrink-0 opacity-90 transition-transform group-hover:scale-110">
                      {item.icon}
                    </span>
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                    {!isCollapsed && (
                      <span className="ml-auto font-mono text-[9px] font-medium text-ink-faint opacity-40 group-hover:opacity-100 transition bg-paper border border-border px-1.5 py-0.5 rounded leading-none select-none flex-shrink-0">
                        {item.shortcut}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          {/* Profile & Controls Area */}
          <div className="p-4 border-t border-border space-y-3 bg-paper/20 backdrop-blur-sm">
            {isCollapsed ? (
              <div className="flex flex-col items-center gap-3">
                {/* Collapsed User Avatar with popup tooltip */}
                <div
                  className="w-9 h-9 rounded-xl bg-paper border border-border/40 flex items-center justify-center cursor-help relative group text-ink-muted hover:text-ink transition-colors"
                  title={userEmail || "User Session"}
                >
                  <User size={16} />
                  {userEmail && (
                    <div className="absolute left-12 scale-0 group-hover:scale-100 transition-all duration-150 z-[9999] bg-slate-900 text-slate-100 text-[10px] px-2.5 py-1.5 rounded-md border border-slate-800 shadow-xl whitespace-nowrap font-mono">
                      {userEmail}
                    </div>
                  )}
                </div>

                {/* Theme Toggle */}
                <div className="flex items-center justify-center w-8 h-8">
                  <ThemeToggle />
                </div>

                {/* Keyboard Shortcuts Trigger */}
                <button
                  onClick={() => setShortcutsOpen(true)}
                  aria-label="Show keyboard shortcuts"
                  title="Keyboard shortcuts (?)"
                  className="flex items-center justify-center w-8 h-8 text-xs font-bold text-ink-muted hover:text-ink border border-border rounded-xl transition-all duration-200 bg-paper-card"
                  style={{ fontFamily: "DM Mono, monospace" }}
                >
                  ?
                </button>

                {/* Logout Button */}
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  aria-label="Sign out"
                  title="Sign out"
                  className="flex items-center justify-center w-8 h-8 text-ink-muted hover:text-accent border border-border hover:border-accent-border rounded-xl transition-all duration-200 bg-paper-card cursor-pointer"
                >
                  {signingOut ? "..." : <LogOut size={14} />}
                </button>
              </div>
            ) : (
              // Expanded Area
              <>
                {userEmail && (
                  <div
                    className="font-mono text-[11px] text-ink-faint px-2.5 py-1.5 rounded-lg bg-paper border border-border/40 truncate select-all flex items-center gap-2"
                    title={userEmail}
                  >
                    <User size={13} className="text-ink-muted" />
                    <span>{userEmail}</span>
                  </div>
                )}
                <div className="flex items-center justify-between px-1">
                  <ThemeToggle />

                  <button
                    onClick={() => setShortcutsOpen(true)}
                    aria-label="Show keyboard shortcuts"
                    title="Keyboard shortcuts (?)"
                    className="flex items-center justify-center w-8 h-8 text-xs font-bold text-ink-muted hover:text-ink border border-border rounded-xl transition-all duration-200 bg-paper-card"
                    style={{ fontFamily: "DM Mono, monospace" }}
                  >
                    ?
                  </button>
                </div>

                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  aria-label="Sign out"
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-ink-muted hover:text-accent border border-border hover:border-accent-border rounded-xl transition-all duration-200 bg-paper-card cursor-pointer flex items-center justify-between"
                >
                  <span>{signingOut ? "Signing out..." : "Sign out"}</span>
                  <LogOut size={13} />
                </button>
              </>
            )}
          </div>
        </aside>

        {/* Right Pane: Content Panel & Top Headers */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Desktop header (visible on lg and above) */}
          <header
            className="hidden lg:flex items-center justify-between py-3 px-6 border-b border-border backdrop-blur-md flex-shrink-0 z-30"
            style={{ background: "var(--nav-bg)", height: "57px" }}
          >
            {/* Left zone: current page context breadcrumb */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-2">
                {NAV_ITEMS.map((item) =>
                  isActive(item) ? (
                    <span
                      key={item.href}
                      className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-muted"
                    >
                      <span className="text-accent opacity-70">{item.icon}</span>
                      <span className="text-ink font-bold truncate max-w-[160px]">
                        {item.label}
                      </span>
                    </span>
                  ) : null
                )}
              </div>
            </div>

            {/* Center zone: Command Palette search bar — the hero action */}
            <div className="flex-1 flex justify-center px-6">
              <button
                onClick={() => setPaletteOpen(true)}
                aria-label="Open command palette"
                title="Search commands (Ctrl+K)"
                className="flex items-center gap-2.5 text-xs font-medium text-ink-muted hover:text-ink border border-border hover:border-accent-border px-4 py-2 rounded-xl transition-all duration-200 bg-paper-warm/60 w-full max-w-sm"
              >
                <Search size={13} className="flex-shrink-0" />
                <span className="flex-1 text-left">Search features, resumes, commands...</span>
                <span className="flex items-center gap-0.5 flex-shrink-0">
                  <kbd className="font-mono text-[9px] bg-paper border border-border rounded px-1.5 py-0.5">
                    Ctrl
                  </kbd>
                  <kbd className="font-mono text-[9px] bg-paper border border-border rounded px-1.5 py-0.5">
                    K
                  </kbd>
                </span>
              </button>
            </div>

            {/* Right zone: Notifications + badge + theme */}
            <div className="flex items-center gap-2.5">
              <NotificationBell />
              <span className="status-pill status-pill-accent text-[10px]">
                <span className="pulse-live" />
                AI Suite
              </span>
            </div>
          </header>

          {/* Mobile navigation header (visible below lg) */}
          <nav
            className="sticky top-0 lg:hidden z-50 backdrop-blur-md border-b transition-all duration-300 flex-shrink-0"
            style={{ background: "var(--nav-bg)", borderColor: "var(--border)" }}
            ref={mobileMenuRef}
          >
            <div className="flex items-center justify-between py-3.5 px-6">
              <Link
                href="/"
                className="font-display text-xl font-bold tracking-tight no-underline text-ink"
              >
                ResumeLens
              </Link>

              <div className="flex items-center gap-3">
                <NotificationBell />
                <ThemeToggle />
                <button
                  onClick={() => setMobileOpen((v) => !v)}
                  aria-label={mobileOpen ? "Close menu" : "Open menu"}
                  aria-expanded={mobileOpen}
                  className="flex items-center justify-center w-9 h-9 rounded-xl border border-border text-ink-muted hover:text-ink hover:bg-paper-warm transition-all duration-200 bg-paper-card"
                >
                  {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </div>

            {/* Mobile Dropdown menu list */}
            {mobileOpen && (
              <div
                className="border-t px-4 py-3 flex flex-col gap-1 animate-fadeIn"
                style={{
                  background: "var(--nav-bg)",
                  borderColor: "var(--border)",
                }}
              >
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold no-underline transition-all duration-200"
                    style={{
                      color: isActive(item) ? "var(--accent)" : "var(--ink-muted)",
                      background: isActive(item) ? "var(--accent-bg)" : "transparent",
                      border: `1px solid ${isActive(item) ? "var(--accent-border)" : "transparent"}`,
                    }}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
                <div
                  className="border-t pt-3 mt-1 flex items-center justify-between"
                  style={{ borderColor: "var(--border)" }}
                >
                  {userEmail && (
                    <span className="font-mono text-xs text-ink-faint truncate max-w-[180px]">
                      {userEmail}
                    </span>
                  )}
                  <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="text-xs font-semibold text-ink-muted hover:text-accent transition-colors"
                  >
                    {signingOut ? "Signing out..." : "Sign out →"}
                  </button>
                </div>
              </div>
            )}
          </nav>

          {/* Main content area — viewport-locked, children scroll independently */}
          <main className="relative z-10 flex-1 overflow-hidden">
            <PageTransition className="h-full">{children}</PageTransition>
          </main>
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* Keyboard Shortcuts Panel */}
      <KeyboardShortcutsPanel isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      {/* First-run Onboarding Tour */}
      <OnboardingTour forceOpen={tourOpen} onClose={() => setTourOpen(false)} />
      <ScrollToTop />
      <FloatingActionButton />
    </div>
  );
}
