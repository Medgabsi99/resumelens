"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error for tracking purposes
    console.error("Unhandled Application Error Boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 bg-paper overflow-hidden">
      {/* Background decoration */}
      <div className="glow-blob animate-blob-1 top-[-100px] left-[10%] w-[400px] h-[400px]" />
      <div className="glow-blob animate-blob-2 bottom-[-100px] right-[10%] w-[400px] h-[400px]" style={{ animationDelay: "-4s", background: "radial-gradient(circle, var(--accent-border) 0%, transparent 70%)" }} />

      <div className="relative z-10 glass-card bg-paper-card border border-border rounded-2xl p-8 max-w-lg w-full text-center shadow-2xl hover:translate-y-0 hover:border-border">
        {/* Glow accent */}
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-red-500/10 rounded-full blur-2xl" />
        
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto mb-6 text-2xl">
          ⚠️
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight text-ink mb-3">
          Something went wrong
        </h1>
        
        <p className="text-ink-muted text-sm mb-6 leading-relaxed">
          An unexpected error occurred. This could be due to a temporary connection issue, database failure, or an AI processing timeout.
        </p>

        {error.message && (
          <div className="text-left mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 font-mono text-xs text-red-500 max-h-[150px] overflow-y-auto">
            <div className="font-bold mb-1">Error Message:</div>
            {error.message}
            {error.digest && (
              <div className="mt-2 text-ink-faint">
                Digest ID: {error.digest}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto btn-gradient px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer text-center"
          >
            🔄 Try Again
          </button>
          
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold border border-border bg-paper-card text-ink hover:bg-paper-warm hover:border-accent-border transition-all duration-200 no-underline text-center"
          >
            🏠 Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
