"use client";

import React from "react";
import { Star, ShieldCheck, TrendingUp, Users } from "lucide-react";

export default function SocialProofTicker() {
  const companies = [
    "Google",
    "Stripe",
    "Amazon",
    "Meta",
    "Microsoft",
    "Snowflake",
    "Uber",
    "Datadog",
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        margin: "0 auto 36px",
        maxWidth: 780,
      }}
    >
      {/* Metric badges */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs font-semibold text-ink-muted">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-paper-card border border-border shadow-xs">
          <div className="flex text-amber-500">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={13} fill="currentColor" />
            ))}
          </div>
          <span className="text-ink font-bold">4.9/5</span>
          <span className="text-ink-faint">(12,000+ reviews)</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-paper-card border border-border shadow-xs">
          <TrendingUp size={13} className="text-emerald-500" />
          <span className="text-ink font-bold">+93%</span>
          <span>Interview Pass Rate</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-paper-card border border-border shadow-xs">
          <ShieldCheck size={13} className="text-indigo-500" />
          <span>Workday &amp; Taleo Verified</span>
        </div>
      </div>

      {/* Social proof logos */}
      <div className="flex items-center gap-2 text-[11px] font-mono text-ink-faint uppercase tracking-wider">
        <span>Candidates hired at:</span>
        <div className="flex items-center gap-3.5 flex-wrap justify-center font-bold text-ink-muted">
          {companies.map((c) => (
            <span key={c} className="hover:text-ink transition-colors cursor-default">
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
