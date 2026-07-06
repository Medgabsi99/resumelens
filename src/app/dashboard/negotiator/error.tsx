"use client";

import { useEffect } from "react";
import Link from "next/link";
import { logger } from "@/lib/logger";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function NegotiatorErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    logger.error("Salary Negotiator local boundary error:", error);
  }, [error]);

  return (
    <div className="relative z-10 glass-card bg-paper-card border border-border rounded-2xl p-8 max-w-xl mx-auto my-12 text-center shadow-lg">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto mb-6 text-2xl">
        💰
      </div>

      <h2 className="font-display text-2xl font-bold tracking-tight text-ink mb-3">
        Salary Negotiator Room Error
      </h2>

      <p className="text-ink-muted text-sm mb-6 leading-relaxed max-w-md mx-auto">
        The salary negotiator room encountered an unexpected state error. This can happen due to browser speech synthesis issues, negotiation timeline mismatch, or AI service interruptions.
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
          className="w-full sm:w-auto btn-gradient px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer text-center"
        >
          🔄 Restart Negotiation
        </button>

        <Link
          href="/dashboard"
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold border border-border bg-paper-card text-ink hover:bg-paper-warm hover:border-accent-border transition-all duration-200 no-underline text-center"
        >
          🏠 Exit to Dashboard
        </Link>
      </div>
    </div>
  );
}
