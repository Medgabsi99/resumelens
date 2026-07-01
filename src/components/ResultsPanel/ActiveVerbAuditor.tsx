"use client";

import { useMemo, useState } from "react";

interface Props {
  resumeText: string;
}

const WEAK_VERBS: Record<string, string[]> = {
  helped: ["Collaborated", "Assisted", "Co-engineered", "Supported"],
  worked: ["Engineered", "Built", "Developed", "Delivered"],
  "worked on": ["Engineered", "Developed", "Architected", "Implemented"],
  responsible: ["Owned", "Managed", "Delivered", "Led"],
  "responsible for": ["Owned", "Directed", "Spearheaded", "Delivered"],
  managed: ["Orchestrated", "Directed", "Oversaw", "Supervised"],
  handled: ["Owned", "Executed", "Managed", "Administered"],
  did: ["Executed", "Delivered", "Implemented", "Completed"],
  made: ["Engineered", "Designed", "Constructed", "Crafted"],
  created: ["Architected", "Designed", "Launched", "Built"],
  assisted: ["Co-led", "Partnered", "Collaborated", "Supported"],
  involved: ["Contributed", "Executed", "Participated in leading"],
  "in charge": ["Directed", "Led", "Owned", "Spearheaded"],
  participated: ["Contributed to", "Led", "Coordinated"],
  "part of": ["Led", "Contributed to", "Collaborated on"],
  updated: ["Revitalized", "Modernized", "Refactored", "Optimized"],
  improved: ["Increased", "Enhanced", "Boosted", "Accelerated"],
  "helped build": ["Co-architected", "Co-engineered", "Developed"],
  tried: ["Implemented", "Executed", "Delivered"],
  attempted: ["Delivered", "Engineered", "Executed"],
  oversaw: ["Directed", "Spearheaded", "Orchestrated"],
  used: ["Leveraged", "Applied", "Deployed", "Implemented"],
  following: ["Utilizing", "Applying", "Implementing"],
  coordinated: ["Orchestrated", "Led", "Directed", "Managed"],
};

interface WeakVerbMatch {
  verb: string;
  count: number;
  suggestions: string[];
  lineSnippets: string[];
}

function detectWeakVerbs(text: string): WeakVerbMatch[] {
  const lines = text.split("\n");
  const found: Map<string, WeakVerbMatch> = new Map();

  for (const [weak, suggestions] of Object.entries(WEAK_VERBS)) {
    const pattern = new RegExp(`\\b${weak}\\b`, "gi");
    const snippets: string[] = [];
    let count = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const matches = trimmed.match(pattern);
      if (matches) {
        count += matches.length;
        if (snippets.length < 2) {
          snippets.push(trimmed.length > 90 ? trimmed.slice(0, 90) + "…" : trimmed);
        }
      }
    }

    if (count > 0) {
      const key = weak.toLowerCase();
      if (!found.has(key)) {
        found.set(key, { verb: weak, count, suggestions: suggestions.slice(0, 3), lineSnippets: snippets });
      }
    }
  }

  // Sort by frequency desc
  return Array.from(found.values()).sort((a, b) => b.count - a.count);
}

function scoreVerbStrength(matches: WeakVerbMatch[]): number {
  const totalWeak = matches.reduce((s, m) => s + m.count, 0);
  if (totalWeak === 0) return 100;
  if (totalWeak >= 10) return 15;
  if (totalWeak >= 7) return 30;
  if (totalWeak >= 5) return 45;
  if (totalWeak >= 3) return 60;
  if (totalWeak >= 2) return 75;
  return 85;
}

export default function ActiveVerbAuditor({ resumeText }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [expandedVerb, setExpandedVerb] = useState<string | null>(null);

  const matches = useMemo(() => detectWeakVerbs(resumeText), [resumeText]);
  const score = useMemo(() => scoreVerbStrength(matches), [matches]);

  const totalWeak = matches.reduce((s, m) => s + m.count, 0);

  const scoreColor =
    score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";

  const scoreLabel =
    score >= 80
      ? "Strong Verbs ✅"
      : score >= 60
      ? "Needs Improvement ⚠️"
      : "Weak Verb Usage 🚨";

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 14,
        background: "var(--paper-card)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <span style={{ fontSize: 22 }}>⚡</span>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--ink)",
              marginBottom: 2,
            }}
          >
            Active Verb Strength Auditor
          </div>
          <div style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>
            {totalWeak === 0
              ? "No weak verbs detected — excellent!"
              : `${totalWeak} weak verb occurrence${totalWeak !== 1 ? "s" : ""} detected across ${matches.length} verb type${matches.length !== 1 ? "s" : ""}`}
          </div>
        </div>
        {/* Score badge */}
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: scoreColor,
              lineHeight: 1,
              fontFamily: "DM Mono, monospace",
            }}
          >
            {score}
          </div>
          <div style={{ fontSize: 9.5, color: scoreColor, fontWeight: 700, marginTop: 2 }}>
            {scoreLabel}
          </div>
        </div>
        <span style={{ color: "var(--ink-faint)", fontSize: 14, marginLeft: 4 }}>
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {/* Score bar */}
      <div style={{ padding: "0 20px 4px" }}>
        <div
          style={{
            height: 5,
            background: "var(--border)",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${score}%`,
              background: scoreColor,
              borderRadius: 10,
              transition: "width 0.6s ease",
            }}
          />
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: "1px solid var(--border)", padding: 16 }}>
          {totalWeak === 0 ? (
            <div
              style={{
                padding: "16px 20px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 10,
                color: "#15803d",
                fontSize: 13,
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              ✅ Excellent! Your resume uses strong, active action verbs throughout.
            </div>
          ) : (
            <>
              <div
                style={{
                  padding: "10px 14px",
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  borderRadius: 10,
                  fontSize: 12,
                  color: "#92400e",
                  marginBottom: 14,
                  lineHeight: 1.5,
                }}
              >
                <strong>Recruiter tip:</strong> Recruiters spend ~6 seconds scanning your resume.
                Strong action verbs (Engineered, Spearheaded, Architected) create immediate
                credibility and signal ownership. Replace weak verbs to boost your impact score.
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {matches.map((m) => (
                  <div
                    key={m.verb}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      overflow: "hidden",
                    }}
                  >
                    {/* Verb row */}
                    <div
                      style={{
                        padding: "10px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        cursor: "pointer",
                        background:
                          expandedVerb === m.verb ? "var(--paper)" : "var(--paper-card)",
                      }}
                      onClick={() =>
                        setExpandedVerb(expandedVerb === m.verb ? null : m.verb)
                      }
                    >
                      <span
                        style={{
                          background: "#fef3c7",
                          border: "1px solid #fde68a",
                          padding: "2px 10px",
                          borderRadius: 20,
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: "#92400e",
                          fontFamily: "DM Mono, monospace",
                          textTransform: "capitalize",
                        }}
                      >
                        "{m.verb}"
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--ink-muted)",
                          flex: 1,
                        }}
                      >
                        used {m.count}× — replace with:
                      </span>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {m.suggestions.map((s) => (
                          <span
                            key={s}
                            style={{
                              background: "#eff6ff",
                              border: "1px solid #bfdbfe",
                              padding: "2px 9px",
                              borderRadius: 20,
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#1d4ed8",
                            }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                      <span style={{ color: "var(--ink-faint)", fontSize: 12 }}>
                        {expandedVerb === m.verb ? "▲" : "▼"}
                      </span>
                    </div>

                    {/* Line snippets */}
                    {expandedVerb === m.verb && m.lineSnippets.length > 0 && (
                      <div
                        style={{
                          borderTop: "1px solid var(--border)",
                          padding: "10px 14px",
                          background: "var(--paper)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "var(--ink-faint)",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            marginBottom: 6,
                          }}
                        >
                          Found in:
                        </div>
                        {m.lineSnippets.map((line, i) => (
                          <div
                            key={i}
                            style={{
                              padding: "6px 10px",
                              background: "#fef9c3",
                              borderLeft: "3px solid #fde047",
                              borderRadius: "0 6px 6px 0",
                              fontSize: 12,
                              color: "#713f12",
                              marginBottom: 4,
                              lineHeight: 1.4,
                              fontStyle: "italic",
                            }}
                          >
                            "{line}"
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
