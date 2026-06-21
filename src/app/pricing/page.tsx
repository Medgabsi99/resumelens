"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase";

const PLANS = [
  {
    key: "free",
    name: "Free",
    price: "$0",
    period: "",
    desc: "Test-drive the core features",
    features: [
      { name: "2 resume reviews included", included: true },
      { name: "Core ATS scoring & summary", included: true },
      { name: "Top strengths & weaknesses", included: true },
      { name: "Cover letter generator", included: false },
      { name: "Professional outreach generator", included: false },
      { name: "Interactive Mock Interview room", included: false },
      { name: "Skill-gap custom learning paths", included: false },
      { name: "Salary negotiation sandbox", included: false },
      { name: "Personal portfolio website generator", included: false },
    ],
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
    desc: "Pay once, review resumes forever",
    features: [
      { name: "Unlimited resume reviews", included: true },
      { name: "Full AI rewrite suggestions", included: true },
      { name: "ATS keyword gap analysis", included: true },
      { name: "Cover letter generator (Basic)", included: true },
      { name: "Outreach generator (Basic)", included: true },
      { name: "Interactive Mock Interview room", included: false },
      { name: "Skill-gap custom learning paths", included: false },
      { name: "Salary negotiation sandbox", included: false },
      { name: "Personal portfolio website generator", included: false },
    ],
    cta: "Buy Lifetime Access",
    stripe: true,
    featured: false,
  },
  {
    key: "monthly",
    name: "Pro",
    price: "$19",
    period: "/ month",
    desc: "For active, aggressive job seekers",
    features: [
      { name: "Unlimited resume reviews", included: true },
      { name: "Full AI rewrite suggestions", included: true },
      { name: "ATS keyword gap analysis", included: true },
      { name: "Cover letter generator (Premium)", included: true },
      { name: "Professional outreach generator", included: true },
      { name: "Interactive Mock Interview simulator", included: true },
      { name: "Skill-gap custom learning paths", included: true },
      { name: "Salary negotiation sandbox", included: true },
      { name: "Personal portfolio website generator", included: true },
    ],
    cta: "Start Pro",
    stripe: true,
    featured: true,
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null); // null = loading

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsSignedIn(!!session?.user);
    });
  }, []);

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
  }  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--paper)" }}>
      {/* Background glow blobs */}
      <div className="glow-blob top-[-50px] right-[-50px] w-[350px] h-[350px]" />
      <div className="glow-blob bottom-[-50px] left-[-50px] w-[300px] h-[300px]" style={{ animationDelay: "-1s" }} />

      <nav
        className="sticky top-0 z-50 backdrop-blur-md border-b flex items-center justify-between py-4 px-6 md:px-12 transition-all duration-300"
        style={{
          background: "var(--nav-bg)",
          borderColor: "var(--border)",
        }}
      >
        <a href="/" className="font-display text-2xl font-bold tracking-tight no-underline text-ink">
          Resume<span style={{ color: "var(--accent)" }}>Lens</span>
        </a>
        {isSignedIn === null ? (
          // Loading skeleton for nav action
          <div className="skeleton w-24 h-8 rounded-xl" />
        ) : isSignedIn ? (
          <a
            href="/dashboard"
            className="text-sm font-semibold text-ink-muted hover:text-accent border border-border hover:border-accent-border px-4 py-2 rounded-xl no-underline transition-all duration-200 flex items-center gap-1.5"
            style={{ background: "var(--paper-card)" }}
          >
            Dashboard →
          </a>
        ) : (
          <a
            href="/login"
            className="text-sm font-semibold text-ink-muted hover:text-accent border border-border hover:border-accent-border px-4 py-2 rounded-xl no-underline transition-all duration-200"
            style={{ background: "var(--paper-card)" }}
          >
            Sign in
          </a>
        )}
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-16">
        <div className="text-center max-w-xl mx-auto mb-16 fade-up">
          <h1 className="font-display tracking-tight leading-tight mb-4" style={{ fontSize: "clamp(32px, 5vw, 48px)" }}>
            Simple, honest pricing
          </h1>
          <p className="text-ink-muted text-base md:text-lg max-w-md mx-auto leading-relaxed">
            Choose the plan that matches your job search speed. Upgrades pay for themselves in just one application review.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-12">
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className="glass-card flex flex-col justify-between p-8 rounded-2xl relative bg-paper-card transition-all duration-300 hover:scale-[1.02] shadow-premium"
              style={{
                borderColor: plan.featured ? "var(--accent)" : "var(--border)",
                borderWidth: plan.featured ? "2px" : "1px",
              }}
            >
              {plan.featured && (
                <div
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[10px] font-mono font-bold tracking-widest text-white uppercase px-3 py-1 rounded-full"
                  style={{
                    background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)",
                    boxShadow: "0 4px 10px var(--brand-glow)",
                  }}
                >
                  Most Popular
                </div>
              )}

              <div>
                <div className="font-mono text-[10px] font-bold tracking-widest uppercase text-ink-faint mb-2">
                  {plan.name}
                </div>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="font-display text-4xl font-bold tracking-tight text-ink">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-sm font-medium text-ink-faint">
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-muted leading-relaxed mb-6">
                  {plan.desc}
                </p>

                <div className="h-px w-full my-6" style={{ background: "var(--border)" }} />

                <ul className="list-none p-0 m-0 flex flex-col gap-3.5 mb-8">
                  {plan.features.map((f, i) => (
                    <li
                      key={i}
                      className="text-xs md:text-sm flex items-start gap-3"
                      style={{ color: f.included ? "var(--ink)" : "var(--ink-faint)" }}
                    >
                      <span
                        className="text-base flex-shrink-0 leading-none"
                        style={{ color: f.included ? "#10b981" : "var(--ink-faint)" }}
                      >
                        {f.included ? "✓" : "—"}
                      </span>
                      <span style={{ textDecoration: f.included ? "none" : "line-through", opacity: f.included ? 1 : 0.6 }}>
                        {f.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {plan.stripe ? (
                <button
                  onClick={() => checkout(plan.key)}
                  disabled={loading === plan.key}
                  className="w-full btn-gradient py-3 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50"
                  style={!plan.featured ? {
                    background: "transparent",
                    border: "2px solid var(--accent)",
                    color: "var(--accent)",
                    boxShadow: "none",
                  } : undefined}
                >
                  {loading === plan.key ? "Connecting..." : plan.cta}
                </button>
              ) : (
                <a
                  href={plan.href}
                  className="w-full flex items-center justify-center border border-border-strong hover:border-ink rounded-xl py-3 text-sm font-semibold text-ink-muted hover:text-ink no-underline transition-all duration-200 text-center"
                  style={{ background: "var(--paper)" }}
                >
                  {plan.cta}
                </a>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-ink-faint mt-10">
          Secure checkout and billing handled via Stripe. Cancel subscription anytime with one click in your settings.
        </p>
      </div>
    </div>
  );
}
