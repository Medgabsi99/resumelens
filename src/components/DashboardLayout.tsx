"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import ThemeToggle from "./ThemeToggle";
import { createBrowserClient } from "@/lib/supabase";
import CommandPalette from "./CommandPalette";
import AuroraBackground from "./AuroraBackground";
import KeyboardShortcutsPanel from "./KeyboardShortcutsPanel";
import { useTheme } from "./ThemeProvider";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  matchPaths: string[];
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

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <IconHome />, matchPaths: ["/dashboard"] },
  { href: "/dashboard/applications", label: "Applications", icon: <IconBriefcase />, matchPaths: ["/dashboard/applications"] },
  { href: "/dashboard/negotiator", label: "Salary Negotiator", icon: <IconDollar />, matchPaths: ["/dashboard/negotiator"] },
  { href: "/dashboard/interviews", label: "Mock Interviews", icon: <IconMic />, matchPaths: ["/dashboard/interviews"] },
  { href: "/dashboard/scanner", label: "ATS Scanner", icon: <IconSearch />, matchPaths: ["/dashboard/scanner"] },
  { href: "/dashboard/learning-paths", label: "Learning Paths", icon: <IconGradCap />, matchPaths: ["/dashboard/learning-paths"] },
  { href: "/dashboard/settings", label: "Settings", icon: <IconSettings />, matchPaths: ["/dashboard/settings"] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // ── Unified global keyboard handler ──────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // ── ⌘K / Ctrl+K — command palette ────────────────────
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
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
    [router, toggleTheme]
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
      console.error(e);
    } finally {
      setSigningOut(false);
    }
  }

  const isActive = (item: NavItem) =>
    item.matchPaths.some((p) =>
      p === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(p)
    );

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--paper)" }}>
      {/* Aurora animated background */}
      <AuroraBackground />

      {/* Top nav */}
      <nav
        className="sticky top-0 z-50 backdrop-blur-md border-b transition-all duration-300"
        style={{ background: "var(--nav-bg)", borderColor: "var(--border)" }}
        ref={mobileMenuRef}
      >
        <div className="flex items-center justify-between py-3.5 px-6 md:px-10">
          {/* Brand */}
          <div className="flex items-center gap-8">
            <Link href="/" className="font-display text-xl font-bold tracking-tight no-underline text-ink flex-shrink-0">
              ResumeLens
            </Link>

            {/* Desktop nav — hidden below lg */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 rounded-xl text-sm font-semibold no-underline flex items-center gap-2 transition-all duration-200"
                  style={{
                    color: isActive(item) ? "var(--accent)" : "var(--ink-muted)",
                    background: isActive(item) ? "var(--accent-bg)" : "transparent",
                    border: `1px solid ${isActive(item) ? "var(--accent-border)" : "transparent"}`,
                  }}
                >
                  <span className="flex-shrink-0 opacity-80">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* ⌘K trigger button */}
            <button
              onClick={() => setPaletteOpen(true)}
              aria-label="Open command palette"
              title="Search commands (Ctrl+K)"
              className="hidden md:flex items-center gap-2 text-xs font-semibold text-ink-muted hover:text-ink border border-border hover:border-accent-border px-3 py-1.5 rounded-xl transition-all duration-200"
              style={{ background: "var(--paper-card)" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>Search</span>
              <span className="flex items-center gap-0.5">
                <kbd className="font-mono text-[10px] bg-paper border border-border rounded px-1">⌘</kbd>
                <kbd className="font-mono text-[10px] bg-paper border border-border rounded px-1">K</kbd>
              </span>
            </button>

            {/* ? shortcuts trigger */}
            <button
              onClick={() => setShortcutsOpen(true)}
              aria-label="Show keyboard shortcuts"
              title="Keyboard shortcuts (?)"
              className="hidden md:flex items-center justify-center w-8 h-8 text-sm font-bold text-ink-muted hover:text-ink border border-border hover:border-accent-border rounded-xl transition-all duration-200"
              style={{ background: "var(--paper-card)", fontFamily: "DM Mono, monospace" }}
            >
              ?
            </button>

            <ThemeToggle />
            {userEmail && (
              <span className="hidden md:inline-block font-mono text-xs text-ink-faint max-w-[150px] truncate">
                {userEmail}
              </span>
            )}
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              aria-label="Sign out"
              className="hidden sm:block text-xs font-semibold text-ink-muted hover:text-accent border border-border hover:border-accent-border px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer"
              style={{ background: "var(--paper-card)" }}
            >
              {signingOut ? "Signing out..." : "Sign out"}
            </button>

            {/* Hamburger — visible below lg */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-border text-ink-muted hover:text-ink hover:bg-paper-warm transition-all duration-200"
              style={{ background: "var(--paper-card)" }}
            >
              {mobileOpen ? <IconX /> : <IconMenu />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileOpen && (
          <div
            className="lg:hidden border-t px-4 py-3 flex flex-col gap-1 animate-fadeIn"
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

      {/* Main content */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-10">
        {children}
      </main>

      {/* Command Palette */}
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* Keyboard Shortcuts Panel */}
      <KeyboardShortcutsPanel isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}
