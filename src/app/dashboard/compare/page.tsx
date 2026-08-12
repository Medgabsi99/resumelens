"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import DashboardLayout from "@/components/DashboardLayout";
import { analyzeResumeMetrics } from "@/components/ResumeMetricsDashboard";
import {
  Upload,
  FileText,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ResumeSlot {
  label: string;
  text: string;
  fileName: string | null;
}

type CompareKey = keyof ReturnType<typeof analyzeResumeMetrics>;

function ScoreBadge({ value, suffix = "" }: { value: number; suffix?: string }) {
  const color = value >= 75 ? "#10b981" : value >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <span style={{ fontWeight: 800, fontSize: 15, color }}>
      {value}
      {suffix}
    </span>
  );
}

function DeltaBadge({
  a,
  b,
  higher = "better",
}: {
  a: number;
  b: number;
  higher?: "better" | "worse";
}) {
  const delta = b - a;
  if (delta === 0) return <span style={{ color: "#6b7280", fontSize: 11 }}>—</span>;
  const positive = higher === "better" ? delta > 0 : delta < 0;
  return (
    <span
      style={{
        color: positive ? "#10b981" : "#ef4444",
        fontSize: 11,
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      {delta > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {Math.abs(delta)} {positive ? "better" : "worse"}
    </span>
  );
}

function MiniBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  return (
    <div
      style={{
        height: 5,
        background: "var(--border)",
        borderRadius: 3,
        overflow: "hidden",
        width: "100%",
        minWidth: 60,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${(value / max) * 100}%`,
          background: color,
          borderRadius: 3,
          transition: "width 0.5s",
        }}
      />
    </div>
  );
}

function ResumeInput({
  slot,
  onText,
  index,
}: {
  slot: ResumeSlot;
  onText: (text: string, name: string | null) => void;
  index: number;
}) {
  const [mode, setMode] = useState<"paste" | "upload">("paste");

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const file = accepted[0];
      if (!file) return;
      const form = new FormData();
      form.append("file", file);
      try {
        const res = await fetch("/api/analyze/extract", { method: "POST", body: form });
        if (res.ok) {
          const data = await res.json();
          onText(data.text || "", file.name);
        } else {
          // Fallback: read as plain text
          const t = await file.text();
          onText(t, file.name);
        }
      } catch {
        const t = await file.text();
        onText(t, file.name);
      }
    },
    [onText]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
  });

  const colors = ["var(--accent)", "#8b5cf6"];

  return (
    <div
      style={{
        flex: 1,
        background: "var(--paper-card)",
        border: `2px solid ${slot.text ? colors[index] + "40" : "var(--border)"}`,
        borderRadius: 16,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: colors[index] }}>{slot.label}</div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["paste", "upload"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: 6,
                border: `1px solid ${mode === m ? colors[index] : "var(--border)"}`,
                background: mode === m ? colors[index] + "15" : "var(--paper-warm)",
                color: mode === m ? colors[index] : "var(--ink-muted)",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {mode === "paste" ? (
        <textarea
          value={slot.text}
          onChange={(e) => onText(e.target.value, null)}
          placeholder={`Paste Resume ${index + 1} text here…`}
          style={{
            flex: 1,
            minHeight: 200,
            background: "var(--paper-warm)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "12px 14px",
            fontSize: 11,
            fontFamily: "DM Mono, monospace",
            lineHeight: 1.6,
            color: "var(--ink)",
            resize: "vertical",
            outline: "none",
          }}
        />
      ) : (
        <div
          {...getRootProps()}
          style={{
            flex: 1,
            minHeight: 200,
            border: `2px dashed ${isDragActive ? colors[index] : "var(--border)"}`,
            borderRadius: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            background: isDragActive ? colors[index] + "08" : "var(--paper-warm)",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          <input {...getInputProps()} />
          <Upload size={24} style={{ color: colors[index], opacity: 0.7 }} />
          <div style={{ fontSize: 12, color: "var(--ink-muted)", textAlign: "center" }}>
            {slot.fileName ? (
              <span style={{ color: colors[index], fontWeight: 600 }}>✓ {slot.fileName}</span>
            ) : (
              "Drop PDF or DOCX, or click to browse"
            )}
          </div>
        </div>
      )}

      {slot.text && (
        <div
          style={{ fontSize: 10.5, color: "var(--ink-faint)", fontFamily: "DM Mono, monospace" }}
        >
          {slot.text.split(/\s+/).filter(Boolean).length} words ·{" "}
          {slot.text.length.toLocaleString()} chars
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────── */

export default function ResumeComparePage() {
  const [resumeA, setResumeA] = useState<ResumeSlot>({
    label: "Resume A (Current)",
    text: "",
    fileName: null,
  });
  const [resumeB, setResumeB] = useState<ResumeSlot>({
    label: "Resume B (Revised)",
    text: "",
    fileName: null,
  });

  const metricsA = useMemo(
    () => (resumeA.text.length > 50 ? analyzeResumeMetrics(resumeA.text) : null),
    [resumeA.text]
  );
  const metricsB = useMemo(
    () => (resumeB.text.length > 50 ? analyzeResumeMetrics(resumeB.text) : null),
    [resumeB.text]
  );

  const canCompare = metricsA && metricsB;

  const rows: {
    label: string;
    key: string;
    unit?: string;
    higherBetter?: boolean;
    format?: (v: unknown) => string;
  }[] = [
    { label: "Word Count", key: "wordCount", unit: " words" },
    {
      label: "Est. Pages",
      key: "estimatedPages",
      format: (v) => `${(v as number).toFixed(1)} pages`,
    },
    { label: "Bullet Points", key: "bulletCount", unit: " bullets" },
    { label: "Quantified Bullets", key: "quantificationRate", unit: "%", higherBetter: true },
    { label: "Avg Words/Bullet", key: "avgWordsPerBullet", unit: " words", higherBetter: false },
    { label: "Hard Skills", key: "hardSkills", format: (v) => `${(v as string[]).length} skills` },
    { label: "Soft Skills", key: "softSkills", format: (v) => `${(v as string[]).length}` },
    {
      label: "Grammar Issues",
      key: "grammarIssues",
      format: (v) => `${(v as string[]).length}`,
      higherBetter: false,
    },
    {
      label: "Repeated Verbs",
      key: "repeatedVerbs",
      format: (v) => `${(v as unknown[]).length}`,
      higherBetter: false,
    },
    {
      label: "Employment Gaps",
      key: "employmentGaps",
      format: (v) => `${(v as unknown[]).length}`,
      higherBetter: false,
    },
  ];

  function getNumericVal(metrics: ReturnType<typeof analyzeResumeMetrics>, key: string): number {
    const val = (metrics as unknown as Record<string, unknown>)[key];
    if (typeof val === "number") return val;
    if (Array.isArray(val)) return val.length;
    return 0;
  }

  const sectionNames = metricsA?.sectionScores.map((s) => s.name) || [];

  return (
    <DashboardLayout>
      <div className="workspace-canvas">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: "var(--ink)",
                margin: "0 0 6px 0",
                letterSpacing: "-0.02em",
              }}
            >
              Resume Comparison
            </h1>
            <p style={{ fontSize: 13, color: "var(--ink-muted)", margin: 0 }}>
              Side-by-side analysis of two resume versions — find which one performs better.
            </p>
          </div>

          {/* Two input panels */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <ResumeInput
              slot={resumeA}
              index={0}
              onText={(text, fileName) =>
                setResumeA((p) => ({ ...p, text, fileName: fileName || p.fileName }))
              }
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 4px",
              }}
            >
              <ArrowRight size={20} style={{ color: "var(--ink-faint)" }} />
            </div>
            <ResumeInput
              slot={resumeB}
              index={1}
              onText={(text, fileName) =>
                setResumeB((p) => ({ ...p, text, fileName: fileName || p.fileName }))
              }
            />
          </div>

          {/* Comparison Results */}
          {canCompare ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Metrics table */}
              <div
                style={{
                  background: "var(--paper-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 16,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "14px 20px",
                    borderBottom: "1px solid var(--border)",
                    background: "var(--paper-warm)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "var(--ink-muted)",
                    }}
                  >
                    Metric Comparison
                  </div>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "var(--paper-warm)" }}>
                        <th
                          style={{
                            padding: "10px 20px",
                            textAlign: "left",
                            fontWeight: 700,
                            color: "var(--ink-muted)",
                            fontSize: 11,
                          }}
                        >
                          Metric
                        </th>
                        <th
                          style={{
                            padding: "10px 20px",
                            textAlign: "center",
                            fontWeight: 700,
                            color: "var(--accent)",
                            fontSize: 11,
                          }}
                        >
                          Resume A
                        </th>
                        <th
                          style={{
                            padding: "10px 20px",
                            textAlign: "center",
                            fontWeight: 700,
                            color: "#8b5cf6",
                            fontSize: 11,
                          }}
                        >
                          Resume B
                        </th>
                        <th
                          style={{
                            padding: "10px 20px",
                            textAlign: "center",
                            fontWeight: 700,
                            color: "var(--ink-muted)",
                            fontSize: 11,
                          }}
                        >
                          Delta
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => {
                        const valA = getNumericVal(metricsA, row.key);
                        const valB = getNumericVal(metricsB, row.key);
                        const rawA = (metricsA as unknown as Record<string, unknown>)[row.key];
                        const rawB = (metricsB as unknown as Record<string, unknown>)[row.key];
                        const displayA = row.format ? row.format(rawA) : `${valA}${row.unit || ""}`;
                        const displayB = row.format ? row.format(rawB) : `${valB}${row.unit || ""}`;
                        const winnerB = row.higherBetter !== false ? valB > valA : valB < valA;
                        const winnerA = row.higherBetter !== false ? valA > valB : valA < valB;
                        return (
                          <tr
                            key={row.key}
                            style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}
                          >
                            <td
                              style={{ padding: "10px 20px", color: "var(--ink)", fontWeight: 600 }}
                            >
                              {row.label}
                            </td>
                            <td
                              style={{
                                padding: "10px 20px",
                                textAlign: "center",
                                fontWeight: 700,
                                color: winnerA ? "#10b981" : "var(--ink)",
                                background: winnerA ? "#10b98110" : undefined,
                              }}
                            >
                              {displayA} {winnerA && "✓"}
                            </td>
                            <td
                              style={{
                                padding: "10px 20px",
                                textAlign: "center",
                                fontWeight: 700,
                                color: winnerB ? "#10b981" : "var(--ink)",
                                background: winnerB ? "#10b98110" : undefined,
                              }}
                            >
                              {displayB} {winnerB && "✓"}
                            </td>
                            <td style={{ padding: "10px 20px", textAlign: "center" }}>
                              <DeltaBadge
                                a={valA}
                                b={valB}
                                higher={row.higherBetter === false ? "worse" : "better"}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section scores side-by-side */}
              <div
                style={{
                  background: "var(--paper-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 16,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "14px 20px",
                    borderBottom: "1px solid var(--border)",
                    background: "var(--paper-warm)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "var(--ink-muted)",
                    }}
                  >
                    Section-by-Section Scores
                  </div>
                </div>
                <div
                  style={{
                    padding: "16px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                  }}
                >
                  {sectionNames.map((name, i) => {
                    const sA = metricsA.sectionScores[i]?.score || 0;
                    const sB = metricsB.sectionScores[i]?.score || 0;
                    const winner = sB > sA ? "B" : sA > sB ? "A" : "tie";
                    return (
                      <div key={name}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 6,
                          }}
                        >
                          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>
                            {metricsA.sectionScores[i]?.icon} {name}
                          </span>
                          <span style={{ fontSize: 11, color: "var(--ink-muted)" }}>
                            {winner === "A" && (
                              <span style={{ color: "var(--accent)", fontWeight: 700 }}>
                                A wins
                              </span>
                            )}
                            {winner === "B" && (
                              <span style={{ color: "#8b5cf6", fontWeight: 700 }}>B wins</span>
                            )}
                            {winner === "tie" && <span style={{ color: "#6b7280" }}>Tied</span>}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 40px 1fr",
                            gap: 8,
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: 3,
                              }}
                            >
                              <span
                                style={{ fontSize: 10, color: "var(--accent)", fontWeight: 700 }}
                              >
                                A
                              </span>
                              <span
                                style={{ fontSize: 10, color: "var(--accent)", fontWeight: 800 }}
                              >
                                {sA}
                              </span>
                            </div>
                            <MiniBar value={sA} color="var(--accent)" />
                          </div>
                          <div
                            style={{ textAlign: "center", fontSize: 9, color: "var(--ink-faint)" }}
                          >
                            vs
                          </div>
                          <div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: 3,
                              }}
                            >
                              <span style={{ fontSize: 10, color: "#8b5cf6", fontWeight: 700 }}>
                                B
                              </span>
                              <span style={{ fontSize: 10, color: "#8b5cf6", fontWeight: 800 }}>
                                {sB}
                              </span>
                            </div>
                            <MiniBar value={sB} color="#8b5cf6" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Winner card */}
              {(() => {
                const scoreA =
                  metricsA.sectionScores.reduce((s, c) => s + c.score, 0) /
                  metricsA.sectionScores.length;
                const scoreB =
                  metricsB.sectionScores.reduce((s, c) => s + c.score, 0) /
                  metricsB.sectionScores.length;
                const quantA = metricsA.quantificationRate;
                const quantB = metricsB.quantificationRate;
                const totalA = Math.round((scoreA + quantA) / 2);
                const totalB = Math.round((scoreB + quantB) / 2);
                const winner = totalB > totalA + 2 ? "B" : totalA > totalB + 2 ? "A" : "tie";
                const winColor =
                  winner === "A" ? "var(--accent)" : winner === "B" ? "#8b5cf6" : "#f59e0b";
                return (
                  <div
                    style={{
                      background: winColor + "12",
                      border: `2px solid ${winColor}40`,
                      borderRadius: 16,
                      padding: "18px 24px",
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <div style={{ fontSize: 32 }}>{winner === "tie" ? "🤝" : "🏆"}</div>
                    <div>
                      <div
                        style={{ fontSize: 16, fontWeight: 900, color: winColor, marginBottom: 4 }}
                      >
                        {winner === "tie" ? "It's a Tie" : `Resume ${winner} is Stronger`}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ink-muted)", lineHeight: 1.5 }}>
                        {winner === "tie"
                          ? "Both resumes are closely matched. Consider which one is better targeted to the specific job description."
                          : winner === "B"
                            ? `Resume B scores ${totalB - totalA} points higher overall. Use this version for your next application.`
                            : `Resume A scores ${totalA - totalB} points higher overall. Resume B needs more improvements.`}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div
              style={{
                background: "var(--paper-card)",
                border: "2px dashed var(--border)",
                borderRadius: 16,
                padding: "40px 20px",
                textAlign: "center",
                color: "var(--ink-muted)",
              }}
            >
              <FileText
                size={32}
                style={{ opacity: 0.3, marginBottom: 12, display: "block", margin: "0 auto 12px" }}
              />
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                Paste or upload both resumes to compare
              </div>
              <div style={{ fontSize: 12 }}>
                You'll get a detailed side-by-side breakdown across 10+ metrics
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
