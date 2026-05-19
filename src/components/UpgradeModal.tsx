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
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(26,26,24,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--paper-card)",
          borderRadius: 20,
          maxWidth: 480,
          width: "100%",
          padding: 32,
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "none",
            border: "none",
            fontSize: 20,
            cursor: "pointer",
            color: "var(--ink-faint)",
            lineHeight: 1,
          }}
        >
          ×
        </button>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 28, marginBottom: 8 }}>
            You've used your free analyses
          </div>
          {preview && (
            <>
              <div style={{ fontSize: 48, fontFamily: "DM Serif Display, serif", color: "var(--accent)", lineHeight: 1, marginBottom: 8 }}>
                {preview.score}
              </div>
              <p style={{ fontSize: 14, color: "var(--ink-muted)", lineHeight: 1.6, maxWidth: 360, margin: "0 auto 16px" }}>
                {preview.summary}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 20 }}>
                {preview.strengths.map((s) => (
                  <span key={s} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "#edf7f2", color: "#2d6a4f", border: "1px solid rgba(45,106,79,0.25)" }}>
                    {s}
                  </span>
                ))}
                <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "var(--paper-warm)", color: "var(--ink-muted)", border: "1px solid var(--border)" }}>
                  + full report locked...
                </span>
              </div>
            </>
          )}
        </div>

        {/* Plans */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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

        <p style={{ textAlign: "center", fontSize: 12, color: "var(--ink-faint)", marginTop: 16 }}>
          Powered by Stripe. Cancel anytime.
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
      style={{
        border: featured ? "2px solid var(--accent)" : "1px solid var(--border)",
        borderRadius: 12,
        padding: 18,
        position: "relative",
      }}
    >
      {featured && (
        <div
          style={{
            position: "absolute",
            top: -10,
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--accent)",
            color: "white",
            fontSize: 10,
            fontWeight: 600,
            padding: "2px 10px",
            borderRadius: 99,
            whiteSpace: "nowrap",
          }}
        >
          Most Popular
        </div>
      )}
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{title}</div>
      <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 24, color: featured ? "var(--accent)" : "var(--ink)", marginBottom: 6 }}>
        {price}
      </div>
      <div style={{ fontSize: 12, color: "var(--ink-muted)", marginBottom: 14, lineHeight: 1.4 }}>{desc}</div>
      <button
        onClick={onClick}
        disabled={loading}
        style={{
          width: "100%",
          background: featured ? "var(--accent)" : "transparent",
          color: featured ? "white" : "var(--accent)",
          border: `1.5px solid var(--accent)`,
          borderRadius: 8,
          padding: "9px 0",
          fontSize: 13,
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "..." : cta}
      </button>
    </div>
  );
}
