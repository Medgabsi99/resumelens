"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Check } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase";

const PLANS = [
  {
    key: "community",
    name: "Community",
    price: "$0",
    period: "forever",
    desc: "100% Free & Open Access for all job seekers",
    features: [
      { name: "Unlimited AI resume reviews & ATS scans", included: true },
      { name: "Full AI resume rewrite & bullet enhancement", included: true },
      { name: "ATS keyword gap & match scoring", included: true },
      { name: "Custom cover letter generator", included: true },
      { name: "Professional recruiter outreach generator", included: true },
      { name: "Interactive Mock Interview simulator", included: true },
      { name: "Skill-gap custom learning paths", included: true },
      { name: "Salary negotiation sandbox", included: true },
      { name: "Personal portfolio website generator", included: true },
    ],
    cta: "Launch Dashboard",
    href: "/dashboard",
    featured: true,
  },
];

export default function PricingPage() {
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null); // null = loading

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsSignedIn(!!session?.user);
    });
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--paper)" }}>
      {/* Background glow blobs */}
      <div className="glow-blob top-[-50px] right-[-50px] w-[350px] h-[350px]" />
      <div
        className="glow-blob bottom-[-50px] left-[-50px] w-[300px] h-[300px]"
        style={{ animationDelay: "-1s" }}
      />

      <nav
        className="sticky top-0 z-50 backdrop-blur-md border-b flex items-center justify-between py-4 px-6 md:px-12 transition-all duration-300"
        style={{
          background: "var(--nav-bg)",
          borderColor: "var(--border)",
        }}
      >
        <a
          href="/"
          className="font-display text-2xl font-bold tracking-tight no-underline text-ink"
        >
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
            Dashboard <ArrowRight size={13} />
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

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-16">
        <div className="text-center max-w-xl mx-auto mb-16 fade-up">
          <h1
            className="font-display tracking-tight leading-tight mb-4"
            style={{ fontSize: "clamp(32px, 5vw, 48px)" }}
          >
            Simple, honest pricing
          </h1>
          <p className="text-ink-muted text-base md:text-lg max-w-md mx-auto leading-relaxed">
            Choose the plan that matches your job search speed. Upgrades pay for themselves in just
            one application review.
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
                    background:
                      "linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)",
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
                    <span className="text-sm font-medium text-ink-faint">{plan.period}</span>
                  )}
                </div>
                <p className="text-xs text-ink-muted leading-relaxed mb-6">{plan.desc}</p>

                <div className="h-px w-full my-6" style={{ background: "var(--border)" }} />

                <ul className="list-none p-0 m-0 flex flex-col gap-3.5 mb-8">
                  {plan.features.map((f, i) => (
                    <li
                      key={i}
                      className="text-xs md:text-sm flex items-start gap-3"
                      style={{ color: f.included ? "var(--ink)" : "var(--ink-faint)" }}
                    >
                      <span
                        className="text-base flex-shrink-0 leading-none flex items-center justify-center"
                        style={{ color: f.included ? "#10b981" : "var(--ink-faint)" }}
                      >
                        {f.included ? <Check size={14} /> : "—"}
                      </span>
                      <span
                        style={{
                          textDecoration: f.included ? "none" : "line-through",
                          opacity: f.included ? 1 : 0.6,
                        }}
                      >
                        {f.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href={plan.href}
                className="w-full btn-gradient py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 no-underline text-white cursor-pointer shadow-lg hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 text-center"
              >
                <span>{plan.cta}</span>
                <ArrowRight size={16} />
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-ink-faint mt-10">
          All tools are 100% free and open for personal career development.
        </p>
      </main>
    </div>
  );
}
