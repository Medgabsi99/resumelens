"use client";

import { useState } from "react";

interface Props {
  preview: { score: number; summary: string; strengths: string[] } | null;
  onClose: () => void;
}

export default function UpgradeModal({ preview, onClose }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  async function checkout(plan: "one_time" | "monthly") {
    setLoading(plan);
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else if (res.status === 401) window.location.href = "/login?next=/pricing";
    } finally {
      setLoading(null);
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md"
      style={{
        background: "var(--modal-backdrop)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-card bg-paper-card border border-border p-8 rounded-2xl relative shadow-premium max-w-xl w-full fade-up"
        style={{
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 40px var(--brand-glow)",
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-transparent border-none text-xl font-bold cursor-pointer text-ink-faint hover:text-ink transition-colors duration-150"
        >
          ×
        </button>

        <div className="text-center mb-8">
          <div className="font-display text-2xl font-bold mb-2">
            You've used your free analyses
          </div>
          {preview && (
            <div className="mt-4">
              <div className="font-display text-5xl text-accent font-bold mb-2">
                {preview.score}
              </div>
              <p className="text-sm text-ink-muted leading-relaxed max-w-sm mx-auto mb-4">
                {preview.summary}
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {preview.strengths.slice(0, 2).map((s) => (
                  <span
                    key={s}
                    className="text-xs px-2.5 py-1 rounded-lg font-medium border"
                    style={{
                      background: "rgba(16, 185, 129, 0.08)",
                      color: "#10b981",
                      borderColor: "rgba(16, 185, 129, 0.2)",
                    }}
                  >
                    ✓ {s}
                  </span>
                ))}
                <span className="text-xs px-2.5 py-1 rounded-lg font-medium border border-border text-ink-muted bg-paper">
                  + full report locked
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PlanCard
            title="One-time"
            price="$9"
            desc="Unlimited reviews, forever"
            cta="Buy Access"
            loading={loading === "one_time"}
            onClick={() => checkout("one_time")}
          />
          <PlanCard
            title="Pro Monthly"
            price="$19/mo"
            desc="Unlimited reviews + priority support"
            cta="Subscribe"
            featured
            loading={loading === "monthly"}
            onClick={() => checkout("monthly")}
          />
        </div>

        <p className="text-center text-[10px] text-ink-faint mt-6 uppercase tracking-wider font-mono">
          Powered by Stripe. Cancel subscriptions anytime.
        </p>
      </div>
    </div>
  );
}

function PlanCard({
  title,
  price,
  desc,
  cta,
  featured,
  loading,
  onClick,
}: {
  title: string;
  price: string;
  desc: string;
  cta: string;
  featured?: boolean;
  loading?: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className="border rounded-2xl p-5 relative flex flex-col justify-between transition-all duration-300 hover:scale-[1.01]"
      style={{
        borderColor: featured ? "var(--accent)" : "var(--border)",
        borderWidth: featured ? "2px" : "1px",
        background: featured ? "var(--accent-bg)" : "var(--paper)",
      }}
    >
      {featured && (
        <div
          className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[9px] font-mono font-bold tracking-widest text-white uppercase px-2.5 py-0.5 rounded-full"
          style={{
            background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)",
            boxShadow: "0 2px 6px var(--brand-glow)",
          }}
        >
          Popular
        </div>
      )}
      <div>
        <div className="font-semibold text-sm mb-1">{title}</div>
        <div className="font-display text-2xl font-bold text-ink mb-2">
          {price}
        </div>
        <div className="text-xs text-ink-muted leading-relaxed mb-4">{desc}</div>
      </div>
      <button
        onClick={onClick}
        disabled={loading}
        className="w-full btn-gradient py-2 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
        style={!featured ? {
          background: "transparent",
          border: "2px solid var(--accent)",
          color: "var(--accent)",
          boxShadow: "none",
        } : undefined}
      >
        {loading ? "..." : cta}
      </button>
    </div>
  );
}
