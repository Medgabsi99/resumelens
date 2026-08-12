"use client";

import { useEffect } from "react";
import Link from "next/link";
import { logger } from "@/lib/logger";
import { ClipboardList, RefreshCw, LayoutDashboard } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function TrackerErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    logger.error("Tracker local boundary error:", error);
  }, [error]);

  return (
    <div className="relative z-10 glass-card bg-paper-card border border-border rounded-2xl p-8 max-w-xl mx-auto my-12 text-center shadow-lg">
      <div className="w-16 h-16 rounded-full bg-slate-500/10 flex items-center justify-center text-slate-500 mx-auto mb-6">
        <ClipboardList size={28} />
      </div>
      <h2 className="font-display text-2xl font-bold tracking-tight text-ink mb-3">
        Tracker Error
      </h2>
      <p className="text-ink-muted text-sm mb-6 leading-relaxed max-w-md mx-auto">
        Unable to load application tracker. Please retry.
      </p>
      {error.message && (
        <div className="text-left mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 font-mono text-xs text-red-500 max-h-[150px] overflow-y-auto">
          <div className="font-bold mb-1">Details:</div>
          {error.message}
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
        <button
          onClick={() => reset()}
          className="w-full sm:w-auto btn-gradient px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer text-center flex items-center justify-center gap-2"
        >
          <RefreshCw size={14} /> Retry
        </button>
        <Link
          href="/dashboard"
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold border border-border bg-paper-card text-ink hover:bg-paper-warm hover:border-accent-border transition-all duration-200 no-underline text-center flex items-center justify-center gap-2"
        >
          <LayoutDashboard size={14} /> Exit to Dashboard
        </Link>
      </div>
    </div>
  );
}
