"use client";

import { useEffect, useState } from "react";
import { AnalysisResult } from "@/types";

interface Props {
  result: AnalysisResult;
  hasJD: boolean;
}

export default function ResultsPanel({ result, hasJD }: Props) {
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    // Animate score bar after mount
    const t = setTimeout(() => setBarWidth(result.score), 200);
    return () => clearTimeout(t);
  }, [result.score]);

  const scoreColor =
    result.score >= 75
      ? "#2d6a4f"
      : result.score >= 55
      ? "#92400e"
      : "#7a2020";

  return (
    <div
      className="fade-up"
      style={{
        background: "var(--paper-card)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        overflow: "hidden",
        marginTop: 28,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "18px 24px",
          borderBottom: "1px solid var(--border)",
          background: "var(--paper-warm)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 22 }}>
          Analysis Complete
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontFamily: "DM Mono, monospace", color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Overall Score
            </div>
            <div style={{ height: 5, width: 130, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${barWidth}%`,
                  background: scoreColor,
                  borderRadius: 99,
                  transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
                }}
              />
            </div>
          </div>
          <div
            style={{
              fontFamily: "DM Serif Display, serif",
              fontSize: 40,
              lineHeight: 1,
              color: scoreColor,
            }}
          >
            {result.score}
          </div>
        </div>
      </div>

      <div style={{ padding: 24, display: "grid", gap: 24 }}>
        {/* Summary */}
        <Section title="Overall Assessment" delay={1}>
          <div
            style={{
              background: "var(--accent-bg)",
              border: "1px solid var(--accent-border)",
              borderRadius: 10,
              padding: "14px 18px",
              fontFamily: "DM Serif Display, serif",
              fontSize: 16,
              lineHeight: 1.65,
              color: "#6b2a12",
              fontStyle: "italic",
            }}
          >
            {result.summary}
          </div>
        </Section>

        {/* Strengths + Weaknesses */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <Section title="Strengths" delay={2}>
            <TagList tags={result.strengths} variant="success" />
          </Section>
          <Section title="Areas to Improve" delay={2}>
            <TagList tags={result.weaknesses} variant="warn" />
          </Section>
        </div>

        {/* Keyword gap */}
        {hasJD && result.keywords_matched && (
          <Section title="Keyword Analysis" delay={3}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 10 }}>
              {(result.keywords_matched || []).slice(0, 14).map((k) => (
                <Chip key={k} label={`✓ ${k}`} variant="match" />
              ))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {(result.keywords_missing || []).slice(0, 10).map((k) => (
                <Chip key={k} label={`✗ ${k}`} variant="miss" />
              ))}
            </div>
          </Section>
        )}

        {/* Rewrite suggestions */}
        <Section title="Rewrite Suggestions" delay={4}>
          <div style={{ display: "grid", gap: 14 }}>
            {result.suggestions.map((s, i) => (
              <div
                key={i}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "8px 14px",
                    background: "var(--paper-warm)",
                    borderBottom: "1px solid var(--border)",
                    fontSize: 11,
                    fontFamily: "DM Mono, monospace",
                    color: "var(--ink-muted)",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                  }}
                >
                  {s.section}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                  <div
                    style={{
                      padding: "13px 14px",
                      fontSize: 13,
                      lineHeight: 1.55,
                      color: "#7a2020",
                      background: "#fff8f8",
                      borderRight: "1px solid var(--border)",
                      textDecoration: "line-through",
                      textDecorationColor: "rgba(200,86,42,0.4)",
                    }}
                  >
                    {s.before}
                  </div>
                  <div
                    style={{
                      padding: "13px 14px",
                      fontSize: 13,
                      lineHeight: 1.55,
                      color: "#1e5c3a",
                      background: "#f6fbf8",
                    }}
                  >
                    {s.after}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  delay,
}: {
  title: string;
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <div className={`fade-up fade-up-delay-${delay}`}>
      <div
        style={{
          fontSize: 11,
          fontFamily: "DM Mono, monospace",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--ink-faint)",
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {title}
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>
      {children}
    </div>
  );
}

function TagList({
  tags,
  variant,
}: {
  tags: string[];
  variant: "success" | "warn";
}) {
  const colors =
    variant === "success"
      ? { bg: "#edf7f2", color: "#2d6a4f", border: "rgba(45,106,79,0.25)" }
      : { bg: "#fef3e2", color: "#92400e", border: "rgba(146,64,14,0.25)" };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {tags.map((tag) => (
        <span
          key={tag}
          style={{
            fontSize: 12.5,
            padding: "5px 11px",
            borderRadius: 6,
            background: colors.bg,
            color: colors.color,
            border: `1px solid ${colors.border}`,
            lineHeight: 1.4,
          }}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function Chip({ label, variant }: { label: string; variant: "match" | "miss" }) {
  const colors =
    variant === "match"
      ? { bg: "#f0faf5", color: "#1e5c3a", border: "rgba(45,106,79,0.3)" }
      : { bg: "#fff8f2", color: "#7a3010", border: "rgba(200,86,42,0.3)" };

  return (
    <span
      style={{
        fontSize: 12,
        fontFamily: "DM Mono, monospace",
        padding: "3px 10px",
        borderRadius: 4,
        background: colors.bg,
        color: colors.color,
        border: `1px solid ${colors.border}`,
      }}
    >
      {label}
    </span>
  );
}
