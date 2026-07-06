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

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  matchPaths: string[];
  shortcut: string;
}

// SVG icon components — consistent cross-platform rendering
function IconHome() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/>
    </svg>
  );
}
function IconBriefcase() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="12"/>
    </svg>
  );
}
function IconDollar() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6"/>
    </svg>
  );
}
function IconMic() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  );
}
function IconSearch() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
function IconGradCap() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  );
}
function IconSettings() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}
function IconMenu() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}
function IconX() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
function IconSparkles() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <IconHome />, matchPaths: ["/dashboard"], shortcut: "g + d" },
  { href: "/dashboard/applications", label: "Applications", icon: <IconBriefcase />, matchPaths: ["/dashboard/applications"], shortcut: "g + a" },
  { href: "/dashboard/negotiator", label: "Salary Negotiator", icon: <IconDollar />, matchPaths: ["/dashboard/negotiator"], shortcut: "g + n" },
  { href: "/dashboard/interviews", label: "Mock Interviews", icon: <IconMic />, matchPaths: ["/dashboard/interviews"], shortcut: "g + i" },
  { href: "/dashboard/scanner", label: "ATS Scanner", icon: <IconSearch />, matchPaths: ["/dashboard/scanner"], shortcut: "g + s" },
  { href: "/dashboard/learning-paths", label: "Learning Paths", icon: <IconGradCap />, matchPaths: ["/dashboard/learning-paths"], shortcut: "g + l" },
  { href: "/dashboard/tailor", label: "Tailor Sandbox", icon: <IconSparkles />, matchPaths: ["/dashboard/tailor"], shortcut: "g + t" },
  { href: "/dashboard/committee", label: "Recruiter Sandbox", icon: <IconUsers />, matchPaths: ["/dashboard/committee"], shortcut: "g + c" },
  { href: "/dashboard/settings", label: "Settings", icon: <IconSettings />, matchPaths: ["/dashboard/settings"], shortcut: "g + e" },
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
  const gPendingRef = useRef(false);         // tracks "G" prefix for go-to shortcuts
  const gTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const toggleSidebar = () => {
    setCollapsed((v) => {
      const nextVal = !v;
      localStorage.setItem("sidebar_collapsed", String(nextVal));
      return nextVal;
    });
  };

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
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (e.target as HTMLElement)?.isContentEditable;
      if (isEditable || e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key;

      // ── G prefix — vim-style go-to navigation ─────────────
      if (gPendingRef.current) {
        gPendingRef.current = false;
        if (gTimerRef.current) clearTimeout(gTimerRef.current);
        const GOTO: Record<string, string> = {
          d: "/dashboard",
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
            <svg
              className={`w-3 h-3 text-ink-muted transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Brand branding */}
          <div className="p-6 border-b border-border flex items-center justify-center h-[73px]">
            {isCollapsed ? (
              <span className="bg-accent/15 text-accent border border-accent/20 w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shadow-sm select-none">
                RL
              </span>
            ) : (
              <Link
                href="/"
                className="font-display text-xl font-bold tracking-tight no-underline text-ink hover:text-accent transition-colors block w-full truncate"
              >
                ResumeLens
              </Link>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-6 overflow-y-auto space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? `${item.label} (${item.shortcut})` : undefined}
                className={`group px-3 py-2.5 rounded-xl text-sm font-semibold no-underline flex items-center transition-all duration-200 ${
                  isCollapsed ? "justify-center" : "gap-3"
                }`}
                style={{
                  color: isActive(item) ? "var(--accent)" : "var(--ink-muted)",
                  background: isActive(item) ? "var(--accent-bg)" : "transparent",
                  border: `1px solid ${isActive(item) ? "var(--accent-border)" : "transparent"}`,
                }}
              >
                <span className="flex-shrink-0 opacity-80">{item.icon}</span>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
                {!isCollapsed && (
                  <span className="ml-auto font-mono text-[9px] font-medium text-ink-faint opacity-50 group-hover:opacity-100 transition bg-paper border border-border/60 px-1.5 py-0.5 rounded leading-none select-none flex-shrink-0">
                    {item.shortcut}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Profile & Controls Area */}
          <div className="p-4 border-t border-border space-y-3 bg-paper/20 backdrop-blur-sm">
            {isCollapsed ? (
              <div className="flex flex-col items-center gap-3">
                {/* Collapsed User Avatar with popup tooltip */}
                <div
                  className="w-9 h-9 rounded-xl bg-paper border border-border/40 flex items-center justify-center text-sm cursor-help relative group"
                  title={userEmail || "User Session"}
                >
                  👤
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
                  {signingOut ? "..." : "→"}
                </button>
              </div>
            ) : (
              // Expanded Area
              <>
                {userEmail && (
                  <div className="font-mono text-[11px] text-ink-faint px-2.5 py-1.5 rounded-lg bg-paper border border-border/40 truncate select-all" title={userEmail}>
                    👤 {userEmail}
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
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-ink-muted hover:text-accent border border-border hover:border-accent-border rounded-xl transition-all duration-200 bg-paper-card cursor-pointer"
                >
                  {signingOut ? "Signing out..." : "Sign out →"}
                </button>
              </>
            )}
          </div>
        </aside>

        {/* Right Pane: Content Panel & Top Headers */}
        <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
          {/* Desktop header (visible on lg and above) */}
          <header
            className="hidden lg:flex items-center justify-between py-3.5 px-8 border-b border-border backdrop-blur-md sticky top-0 z-30 flex-shrink-0"
            style={{ background: "var(--nav-bg)" }}
          >
            <div>
              {/* Command Palette Trigger */}
              <button
                onClick={() => setPaletteOpen(true)}
                aria-label="Open command palette"
                title="Search commands (Ctrl+K)"
                className="flex items-center gap-2.5 text-xs font-semibold text-ink-muted hover:text-ink border border-border hover:border-accent-border px-4 py-2 rounded-xl transition-all duration-200 bg-paper-card"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span>Search commands...</span>
                <span className="flex items-center gap-0.5 ml-4">
                  <kbd className="font-mono text-[9px] bg-paper border border-border rounded px-1">⌘</kbd>
                  <kbd className="font-mono text-[9px] bg-paper border border-border rounded px-1">K</kbd>
                </span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell />
              <span className="text-[10px] text-ink-faint font-bold uppercase tracking-wider bg-paper border border-border px-3 py-1 rounded-lg">
                🚀 AI Career Suite
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
              <Link href="/" className="font-display text-xl font-bold tracking-tight no-underline text-ink">
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
                  {mobileOpen ? <IconX /> : <IconMenu />}
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
                <div className="border-t pt-3 mt-1 flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
                  {userEmail && (
                    <span className="font-mono text-xs text-ink-faint truncate max-w-[180px]">{userEmail}</span>
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

          {/* Main content area */}
          <main className="relative z-10 flex-1">
            <PageTransition className="w-full max-w-6xl mx-auto px-4 md:px-8 py-10">
              <Breadcrumbs />
              {children}
            </PageTransition>
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
