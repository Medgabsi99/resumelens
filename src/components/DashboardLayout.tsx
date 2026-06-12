"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import { createBrowserClient } from "@/lib/supabase";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  matchPaths: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "🏠",
    matchPaths: ["/dashboard"],
  },
  {
    href: "/dashboard/applications",
    label: "Applications",
    icon: "📋",
    matchPaths: ["/dashboard/applications"],
  },
  {
    href: "/dashboard/negotiator",
    label: "Salary Negotiator",
    icon: "💰",
    matchPaths: ["/dashboard/negotiator"],
  },
  {
    href: "/dashboard/interviews",
    label: "Mock Interviews",
    icon: "🎙️",
    matchPaths: ["/dashboard/interviews"],
  },
  {
    href: "/dashboard/scanner",
    label: "ATS Scanner",
    icon: "🔍",
    matchPaths: ["/dashboard/scanner"],
  },
  {
    href: "/dashboard/learning-paths",
    label: "Learning Paths",
    icon: "🎓",
    matchPaths: ["/dashboard/learning-paths"],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  // Load user session to display email in nav
  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) setUserEmail(session.user.email);
    });
  }, []);

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

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--paper)" }}>
      {/* Background decoration */}
      <div className="glow-blob animate-blob-1 top-[-150px] left-[10%] w-[450px] h-[450px]" />
      <div className="glow-blob animate-blob-2 bottom-[-150px] right-[5%] w-[400px] h-[400px]" style={{ animationDelay: "-4s", background: "radial-gradient(circle, var(--accent-border) 0%, transparent 70%)" }} />

      {/* Top nav */}
      <nav
        className="sticky top-0 z-50 backdrop-blur-md border-b flex items-center justify-between py-4 px-6 md:px-12 transition-all duration-300"
        style={{
          background: "var(--nav-bg)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="font-display text-2xl font-bold tracking-tight no-underline text-ink"
          >
            ResumeLens
          </Link>

          <div className="hidden sm:flex items-center gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = item.matchPaths.some((p) =>
                p === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(p)
              );
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-4 py-2 rounded-xl text-sm font-semibold no-underline flex items-center gap-2 transition-all duration-200"
                  style={{
                    color: isActive ? "var(--accent)" : "var(--ink-muted)",
                    background: isActive ? "var(--accent-bg)" : "transparent",
                    border: `1px solid ${isActive ? "var(--accent-border)" : "transparent"}`,
                  }}
                >
                  <span className="text-base leading-none">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          {userEmail && (
            <span className="hidden md:inline-block font-mono text-xs text-ink-faint max-w-[160px] truncate">
              {userEmail}
            </span>
          )}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="text-xs font-semibold text-ink-muted hover:text-accent border border-border hover:border-accent-border px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer"
            style={{ background: "var(--paper-card)" }}
          >
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </nav>

      {/* Main content wrapper */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  );
}
