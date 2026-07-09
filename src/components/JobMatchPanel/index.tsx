"use client";

import * as Diff from "diff";
import { parseResume } from "@/lib/parseResume";
import SpotlightCard from "@/components/SpotlightCard";
import { useJobMatch } from "./useJobMatch";
import { useAutoTailor } from "./useAutoTailor";

interface Props {
  resumeText: string;
  defaultJobDescription?: string;
  defaultJobTitle?: string;
  defaultCompanyName?: string;
}

const VERDICT_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  strong: { bg: "#edf7f2", text: "#1e5c3a", label: "Strong Fit" },
  good:   { bg: "#e8f4f8", text: "#1c5878", label: "Good Fit" },
  fair:   { bg: "#fef3e2", text: "#92400e", label: "Fair Fit" },
  weak:   { bg: "#fce8e8", text: "#7a2020", label: "Weak Fit" },
};

const EXP_VERDICT_COLORS: Record<string, string> = {
  exceeds:        "#1e5c3a",
  meets:          "#1c5878",
  "slightly-below": "#92400e",
  below:          "#7a2020",
};

const EXP_VERDICT_LABELS: Record<string, string> = {
  exceeds:          "Exceeds",
  meets:            "Meets",
  "slightly-below": "Slightly Below",
  below:            "Below",
};

function DiffText({ original, tailored }: { original: string; tailored: string }) {
  if (!original) {
    return <span style={{ color: "#2d6a4f", fontWeight: 600 }}>{tailored}</span>;
  }
  if (!tailored) {
    return <span style={{ color: "#7a2020", textDecoration: "line-through" }}>{original}</span>;
  }

  const diffResult = Diff.diffWordsWithSpace(original, tailored);

  return (
    <span style={{ lineHeight: 1.5, fontSize: "13.5px" }}>
      {diffResult.map((part, index) => {
        if (part.added) {
          return (
            <span
              key={index}
              style={{
                backgroundColor: "#e6ffec",
                color: "#1a7f37",
                padding: "2px 0",
                borderRadius: 2,
                fontWeight: 600,
              }}
            >
              {part.value}
            </span>
          );
        }
        if (part.removed) {
          return (
            <span
              key={index}
              style={{
                backgroundColor: "#ffebe9",
                color: "#cf222e",
                textDecoration: "line-through",
                padding: "2px 0",
                borderRadius: 2,
              }}
            >
              {part.value}
            </span>
          );
        }
        return <span key={index} style={{ color: "var(--ink)" }}>{part.value}</span>;
      })}
    </span>
  );
}


export default function JobMatchPanel({
  resumeText,
  defaultJobDescription = "",
  defaultJobTitle = "",
  defaultCompanyName = "",
}: Props) {
  const {
    jobDescription, setJobDescription,
    jobTitle, setJobTitle,
    companyName, setCompanyName,
    isMatching,
    error, setError,
    result,
    handleMatch,
    clearResult,
  } = useJobMatch({ resumeText, defaultJobDescription, defaultJobTitle, defaultCompanyName });

  const {
    isTailoring,
    tailorError,
    tailoredResult,
    showDiff, setShowDiff,
    appliedTailored,
    handleAutoTailor,
    applyTailoredResume,
    resetTailor,
  } = useAutoTailor({ resumeText, jobDescription, jobTitle });

  function handleReset() {
    clearResult();
    resetTailor();
  }
  // Result view
  if (result) {
    const verdict = VERDICT_COLORS[result.fitVerdict] || VERDICT_COLORS.fair;
    const expVerdictColor = EXP_VERDICT_COLORS[result.experienceMatch.verdict];
    const expVerdictLabel = EXP_VERDICT_LABELS[result.experienceMatch.verdict];

    return (
      <div>
        {/* Score Header */}
        <div
          style={{
            background: verdict.bg,
            border: `1.5px solid ${verdict.text}30`,
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
          }}
          className="flex flex-wrap items-center gap-5"
        >
          <div
            style={{
              fontFamily: "DM Serif Display, serif",
              fontSize: 56,
              lineHeight: 1,
              color: verdict.text,
              fontWeight: 800,
            }}
          >
            {result.overallScore}
          </div>
          <div>
            <div
              style={{
                display: "inline-block",
                background: verdict.text,
                color: "white",
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 6,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 8,
              }}
            >
              {verdict.label}
            </div>
            <div style={{ fontSize: 14, color: "#1a202c", lineHeight: 1.55 }}>
              {result.summary}
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 10,
            marginBottom: 20,
          }}
        >
          {[
            { label: "Skills", value: result.breakdown.skills, hint: "Required skills match" },
            { label: "Experience", value: result.breakdown.experience, hint: "Relevant experience" },
            { label: "Responsibilities", value: result.breakdown.responsibilities, hint: "Past work alignment" },
            { label: "Education", value: result.breakdown.education, hint: "Education match" },
            { label: "Culture", value: result.breakdown.culture, hint: "Values & work style" },
          ].map((b) => {
            const color = b.value >= 75 ? "#2d6a4f" : b.value >= 55 ? "#92400e" : "#7a2020";
            return (
              <div
                key={b.label}
                style={{
                  background: "var(--paper-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "12px 14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>
                    {b.label}
                  </span>
                  <span
                    style={{
                      fontFamily: "DM Serif Display, serif",
                      fontSize: 18,
                      color,
                    }}
                  >
                    {b.value}
                  </span>
                </div>
                <div
                  style={{
                    height: 3,
                    background: "var(--border)",
                    borderRadius: 99,
                    overflow: "hidden",
                    marginBottom: 4,
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${b.value}%`,
                      background: color,
                      borderRadius: 99,
                      transition: "width 1s",
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--ink-faint)",
                    fontFamily: "DM Mono, monospace",
                  }}
                >
                  {b.hint}
                </div>
              </div>
            );
          })}
        </div>

        {/* Experience Match */}
        <div
          style={{
            background: "var(--paper-card)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontFamily: "DM Mono, monospace",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--ink-faint)",
              marginBottom: 10,
            }}
          >
            Experience Match
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <div>
              <div style={{ fontSize: 11, color: "var(--ink-faint)", marginBottom: 2 }}>
                They want
              </div>
              <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>
                {result.experienceMatch.required}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--ink-faint)", marginBottom: 2 }}>
                You have
              </div>
              <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>
                {result.experienceMatch.yours}
              </div>
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "white",
                background: expVerdictColor,
                padding: "6px 10px",
                borderRadius: 6,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {expVerdictLabel}
            </div>
          </div>
        </div>

        {/* Strengths & Gaps */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          style={{ marginBottom: 20 }}
        >
          <div
            style={{
              background: "#edf7f2",
              border: "1px solid rgba(45,106,79,0.25)",
              borderRadius: 10,
              padding: 16,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontFamily: "DM Mono, monospace",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#1e5c3a",
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              ✓ Why you're a good fit
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, listStyle: "none" }}>
              {result.strengths.map((s, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: 13,
                    color: "#1e5c3a",
                    marginBottom: 6,
                    lineHeight: 1.5,
                    position: "relative",
                    paddingLeft: 4,
                  }}
                >
                  <span style={{ color: "#2d6a4f", fontWeight: 700, marginRight: 6 }}>+</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div
            style={{
              background: "#fce8e8",
              border: "1px solid rgba(122,32,32,0.25)",
              borderRadius: 10,
              padding: 16,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontFamily: "DM Mono, monospace",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#7a2020",
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              ✗ Gaps to address
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, listStyle: "none" }}>
              {result.gaps.map((g, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: 13,
                    color: "#7a2020",
                    marginBottom: 6,
                    lineHeight: 1.5,
                    position: "relative",
                    paddingLeft: 4,
                  }}
                >
                  <span style={{ color: "#7a2020", fontWeight: 700, marginRight: 6 }}>−</span>
                  {g}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Skills */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          style={{ marginBottom: 20 }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontFamily: "DM Mono, monospace",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--ink-faint)",
                marginBottom: 8,
              }}
            >
              Matched Skills ({result.matchedSkills.length})
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {result.matchedSkills.length === 0 ? (
                <span style={{ fontSize: 12, color: "var(--ink-faint)", fontStyle: "italic" }}>
                  None identified
                </span>
              ) : (
                result.matchedSkills.map((s, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 11,
                      padding: "3px 8px",
                      borderRadius: 4,
                      background: "#f0faf5",
                      color: "#1e5c3a",
                      border: "1px solid rgba(45,106,79,0.3)",
                      fontFamily: "DM Mono, monospace",
                    }}
                  >
                    ✓ {s}
                  </span>
                ))
              )}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                fontFamily: "DM Mono, monospace",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--ink-faint)",
                marginBottom: 8,
              }}
            >
              Missing Skills ({result.missingSkills.length})
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {result.missingSkills.length === 0 ? (
                <span style={{ fontSize: 12, color: "var(--ink-faint)", fontStyle: "italic" }}>
                  None — you have everything they want!
                </span>
              ) : (
                result.missingSkills.map((s, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 11,
                      padding: "3px 8px",
                      borderRadius: 4,
                      background: "#fff8f2",
                      color: "#7a3010",
                      border: "1px solid rgba(200,86,42,0.3)",
                      fontFamily: "DM Mono, monospace",
                    }}
                  >
                    ✗ {s}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Top Recommendations */}
        <SpotlightCard
          style={{
            background: "var(--paper-card)",
            border: "1.5px solid var(--accent-border)",
            borderRadius: 10,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontFamily: "DM Mono, monospace",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--accent)",
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            💡 Top recommendations to improve your match
          </div>
          <ol style={{ margin: 0, paddingLeft: 20 }}>
            {result.topRecommendations.map((r, i) => (
              <li
                key={i}
                style={{
                  fontSize: 13.5,
                  color: "var(--ink)",
                  marginBottom: 8,
                  lineHeight: 1.6,
                }}
              >
                {r}
              </li>
            ))}
          </ol>
        </SpotlightCard>

        {/* Applied Tailored Badge */}
        {appliedTailored && (
          <div
            style={{
              background: "#edf7f2",
              border: "1.5px solid rgba(45, 106, 79, 0.25)",
              borderRadius: 12,
              padding: "16px 20px",
              marginBottom: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1e5c3a", marginBottom: 2 }}>
                ✓ Tailored Resume Applied!
              </div>
              <div style={{ fontSize: 12, color: "#2d6a4f", lineHeight: 1.4 }}>
                The optimized text has been loaded into your editor. Scroll up to review, preview template options, and export your PDF.
              </div>
            </div>
            <button
              onClick={() => {
                const editorElement = document.querySelector(".sbs-editor-grid");
                if (editorElement) {
                  editorElement.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              style={{
                background: "#2d6a4f",
                color: "white",
                border: "none",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "Instrument Sans, sans-serif",
                whiteSpace: "nowrap",
              }}
            >
              Go to Editor ✏️
            </button>
          </div>
        )}

        {/* Auto-Tailor CTA */}
        {!showDiff && !appliedTailored && (
          <SpotlightCard
            style={{
              background: "linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)",
              border: "1.5px dashed rgba(99, 102, 241, 0.4)",
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              textAlign: "center",
            }}
          >
            <div>
              <span
                style={{
                  display: "inline-block",
                  background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                  color: "white",
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "3px 8px",
                  borderRadius: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 8,
                }}
              >
                AI Auto-Tailor
              </span>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>
                Tailor your resume for this role in seconds
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-muted)", maxWidth: "500px", lineHeight: 1.5 }}>
                Optimize your professional summary, work experience bullets, and skills list with targeted keywords from this job description to maximize your ATS score.
              </div>
            </div>
            <button
              onClick={handleAutoTailor}
              disabled={isTailoring}
              style={{
                background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                color: "white",
                border: "none",
                borderRadius: 8,
                padding: "10px 24px",
                fontSize: 13,
                fontWeight: 600,
                cursor: isTailoring ? "wait" : "pointer",
                fontFamily: "Instrument Sans, sans-serif",
                transition: "opacity 0.2s",
                boxShadow: "0 2px 10px rgba(99, 102, 241, 0.3)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {isTailoring ? (
                <>
                  <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⚙️</span>
                  Tailoring Resume points...
                </>
              ) : (
                <>✨ Auto-Tailor Resume</>
              )}
            </button>
            {tailorError && (
              <div style={{ color: "#dc2626", fontSize: 12, fontWeight: 500 }}>
                ⚠  {tailorError}
              </div>
            )}
          </SpotlightCard>
        )}

        {/* Visual Diff Panel */}
        {showDiff && tailoredResult && (
          <SpotlightCard
            style={{
              background: "var(--paper-card)",
              border: "1.5px solid var(--accent-border)",
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid var(--border)",
                paddingBottom: 12,
                marginBottom: 16,
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", margin: 0 }}>
                  Compare Tailored Resume Changes
                </h4>
                <p style={{ fontSize: 12, color: "var(--ink-muted)", margin: "4px 0 0 0" }}>
                  Review the keyword-optimized changes before applying them to your resume editor.
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={applyTailoredResume}
                  style={{
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "Instrument Sans, sans-serif",
                    boxShadow: "0 2px 6px rgba(16, 185, 129, 0.2)",
                  }}
                >
                  ✓ Apply changes
                </button>
                <button
                  onClick={() => setShowDiff(false)}
                  style={{
                    background: "transparent",
                    color: "var(--ink-muted)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "Instrument Sans, sans-serif",
                  }}
                >
                  Discard
                </button>
              </div>
            </div>

            {/* Diffs Content */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              
              {/* Summary Diff */}
              {tailoredResult.tailoredResume.summary && (
                <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
                  <h5 style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-muted)", marginBottom: 8, fontFamily: "DM Mono, monospace", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    ✍ Professional Summary
                  </h5>
                  <div style={{ padding: "10px 14px", background: "var(--paper-warm)", borderRadius: 8, border: "1px solid var(--border)" }}>
                    <DiffText 
                      original={parseResume(resumeText).summary || ""} 
                      tailored={tailoredResult.tailoredResume.summary} 
                    />
                  </div>
                </div>
              )}

              {/* Experience Diff */}
              {tailoredResult.tailoredResume.experience.length > 0 && (
                <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
                  <h5 style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-muted)", marginBottom: 12, fontFamily: "DM Mono, monospace", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    💼 Work Experience Bullets
                  </h5>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {tailoredResult.tailoredResume.experience.map((exp: any, expIdx: number) => {
                      const origResume = parseResume(resumeText);
                      let origExp: any = origResume.experience[expIdx];
                      if (!origExp && exp.company) {
                        origExp = origResume.experience.find(e => e.company.toLowerCase() === exp.company.toLowerCase());
                      }
                      return (
                        <div key={expIdx} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
                            {exp.title} <span style={{ fontWeight: 400, color: "var(--ink-muted)" }}>at</span> {exp.company}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 12 }}>
                            {exp.bullets.map((bullet: string, bulletIdx: number) => {
                              const origBullet = origExp?.bullets[bulletIdx] || "";
                              return (
                                <div key={bulletIdx} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                                  <span style={{ color: "var(--ink-faint)", userSelect: "none" }}>•</span>
                                  <div style={{ flex: 1 }}>
                                    <DiffText original={origBullet} tailored={bullet} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Skills Diff */}
              {tailoredResult.tailoredResume.skills.length > 0 && (
                <div>
                  <h5 style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-muted)", marginBottom: 10, fontFamily: "DM Mono, monospace", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    🛠 Skills & Keywords
                  </h5>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {(() => {
                      const origSkills = new Set((parseResume(resumeText).skills || []).map(s => s.toLowerCase().trim()));
                      return tailoredResult.tailoredResume.skills.map((skill: string, idx: number) => {
                        const isNew = !origSkills.has(skill.toLowerCase().trim());
                        return (
                          <span
                            key={idx}
                            style={{
                              fontSize: 11,
                              padding: "4px 10px",
                              borderRadius: 6,
                              background: isNew ? "#e6ffec" : "var(--paper-warm)",
                              color: isNew ? "#1a7f37" : "var(--ink)",
                              border: `1px solid ${isNew ? "rgba(26, 127, 55, 0.3)" : "var(--border)"}`,
                              fontWeight: 700,
                              fontFamily: "DM Mono, monospace",
                            }}
                          >
                            {isNew ? "+ " : ""}{skill}
                          </span>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

            </div>
          </SpotlightCard>
        )}

        {/* Reset Button */}
        <div style={{ textAlign: "center" }}>

          <button
            onClick={handleReset}
            style={{
              background: "transparent",
              color: "var(--ink-muted)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "8px 18px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "Instrument Sans, sans-serif",
            }}
          >
            ↻ Match against a different job
          </button>
        </div>
      </div>
    );
  }

  // Input view
  return (
    <div>
      <p
        style={{
          fontSize: 14,
          color: "var(--ink-muted)",
          lineHeight: 1.6,
          marginBottom: 16,
        }}
      >
        Paste a job description below to get a precise match score, identify gaps, and receive
        tailored recommendations to increase your chances of landing the interview.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Job title (e.g. Senior Product Designer)"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          style={{
            background: "var(--paper-card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 13,
            fontFamily: "Instrument Sans, sans-serif",
            color: "var(--ink)",
            outline: "none",
          }}
        />
        <input
          type="text"
          placeholder="Company name (e.g. Google)"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          style={{
            background: "var(--paper-card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 13,
            fontFamily: "Instrument Sans, sans-serif",
            color: "var(--ink)",
            outline: "none",
          }}
        />
      </div>

      <textarea
        placeholder="Paste the full job description here. Include the full text from the job posting for the most accurate analysis."
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        style={{
          width: "100%",
          minHeight: 220,
          background: "var(--paper-card)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: 14,
          fontSize: 13,
          fontFamily: "Instrument Sans, sans-serif",
          color: "var(--ink)",
          outline: "none",
          resize: "vertical",
          lineHeight: 1.55,
          marginBottom: 16,
          boxSizing: "border-box",
        }}
      />

      <div style={{ textAlign: "center" }}>
        <button
          onClick={handleMatch}
          disabled={isMatching}
          style={{
            background: isMatching ? "var(--ink-faint)" : "var(--accent)",
            color: "white",
            border: "none",
            borderRadius: 8,
            padding: "12px 32px",
            fontSize: 14,
            fontWeight: 600,
            cursor: isMatching ? "not-allowed" : "pointer",
            fontFamily: "Instrument Sans, sans-serif",
            transition: "opacity 0.15s",
            minHeight: 44,
            width: "100%",
          }}
        >
          {isMatching ? "Analyzing match..." : "Match My Resume 🎯"}
        </button>
      </div>

      {error && (
        <p
          style={{
            color: "#7a2020",
            fontSize: 13,
            marginTop: 12,
            textAlign: "center",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}


