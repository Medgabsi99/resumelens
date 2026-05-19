"use client";

import { useState } from "react";

const PLANS = [
  {
    key: "free",
    name: "Free",
    price: "$0",
    period: "",
    desc: "Try it out",
    features: ["2 resume analyses", "Score + summary", "Strengths & weaknesses", "—"],
    cta: "Get started",
    href: "/login",
    stripe: false,
    featured: false,
  },
  {
    key: "one_time",
    name: "Lifetime",
    price: "$9",
    period: "one-time",
    desc: "Pay once, use forever",
    features: ["Unlimited analyses", "Full rewrite suggestions", "Keyword gap analysis", "All future features"],
    cta: "Buy Lifetime Access",
    stripe: true,
    featured: false,
  },
  {
    key: "monthly",
    name: "Pro",
    price: "$19",
    period: "/ month",
    desc: "For active job seekers",
    features: ["Unlimited analyses", "Full rewrite suggestions", "Keyword gap analysis", "Priority support"],
    cta: "Start Pro",
    stripe: true,
    featured: true,
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  async function checkout(plan: string) {
    setLoading(plan);
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else if (res.status === 401) window.location.href = `/login?next=/pricing`;
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <nav style={{ borderBottom: "1px solid var(--border)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--paper-card)" }}>
        <a href="/" style={{ fontFamily: "DM Serif Display, serif", fontSize: 22, textDecoration: "none", color: "var(--ink)" }}>
          Resume<em style={{ color: "var(--accent)" }}>Lens</em>
        </a>
        <a href="/login" style={{ fontSize: 13, color: "var(--ink-muted)", textDecoration: "none" }}>Sign in</a>
      </nav>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "3rem 1.5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1 style={{ fontFamily: "DM Serif Display, serif", fontSize: "clamp(28px, 4vw, 44px)", marginBottom: 12 }}>
            Simple, honest pricing
          </h1>
          <p style={{ color: "var(--ink-muted)", fontSize: 16, maxWidth: 400, margin: "0 auto" }}>
            Start free. Upgrade when you need full feedback.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              style={{
                background: "var(--paper-card)",
                border: plan.featured ? "2px solid var(--accent)" : "1px solid var(--border)",
                borderRadius: 16,
                padding: 24,
                position: "relative",
              }}
            >
              {plan.featured && (
                <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "var(--accent)", color: "white", fontSize: 11, fontWeight: 600, padding: "4px 14px", borderRadius: 99, whiteSpace: "nowrap" }}>
                  Most Popular
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-faint)", marginBottom: 6 }}>{plan.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                  <span style={{ fontFamily: "DM Serif Display, serif", fontSize: 36, color: plan.featured ? "var(--accent)" : "var(--ink)" }}>{plan.price}</span>
                  {plan.period && <span style={{ fontSize: 13, color: "var(--ink-faint)" }}>{plan.period}</span>}
                </div>
                <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>{plan.desc}</div>
              </div>

              <ul style={{ listStyle: "none", display: "grid", gap: 9, marginBottom: 22 }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ fontSize: 13.5, color: f === "—" ? "var(--ink-faint)" : "var(--ink)", display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ color: f === "—" ? "var(--ink-faint)" : "#2d6a4f", flexShrink: 0, marginTop: 1 }}>
                      {f === "—" ? "—" : "✓"}
                    </span>
                    {f === "—" ? "Priority support" : f}
                  </li>
                ))}
              </ul>

              {plan.stripe ? (
                <button
                  onClick={() => checkout(plan.key)}
                  disabled={loading === plan.key}
                  style={{
                    width: "100%",
                    background: plan.featured ? "var(--accent)" : "transparent",
                    color: plan.featured ? "white" : "var(--accent)",
                    border: "1.5px solid var(--accent)",
                    borderRadius: 10,
                    padding: "11px 0",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: loading === plan.key ? "not-allowed" : "pointer",
                    opacity: loading === plan.key ? 0.6 : 1,
                  }}
                >
                  {loading === plan.key ? "..." : plan.cta}
                </button>
              ) : (
                <a
                  href={plan.href}
                  style={{
                    display: "block",
                    textAlign: "center",
                    textDecoration: "none",
                    background: "transparent",
                    color: "var(--ink-muted)",
                    border: "1.5px solid var(--border-strong)",
                    borderRadius: 10,
                    padding: "11px 0",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {plan.cta}
                </a>
              )}
            </div>
          ))}
        </div>

        <p style={{ textAlign: "center", fontSize: 13, color: "var(--ink-faint)", marginTop: 28 }}>
          Payments handled by Stripe. Cancel subscriptions anytime from your dashboard.
        </p>
      </div>
    </div>
  );
}
