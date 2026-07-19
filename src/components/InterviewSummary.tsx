"use client";

import React from "react";
import { X } from "lucide-react";
import { type EvaluateResponse } from "@/lib/ai";

interface QuestionSession {
  question: string;
  answer: string;
  evaluation: EvaluateResponse | null;
}

interface InterviewSummaryProps {
  sessions: QuestionSession[];
  summary: {
    averageScore: number;
    starPercent: number;
    fillerCounts: Record<string, number>;
  } | null;
  onClose: () => void;
}

export default function InterviewSummary({ sessions, summary, onClose }: InterviewSummaryProps) {
  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, borderBottom: "1px solid #23232a", paddingBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", margin: 0 }}>
            Interview Performance Summary
          </h2>
          <p style={{ fontSize: 13, color: "#9ca3af", margin: "4px 0 0 0" }}>
            Great job completing the mock session! Review your stats and transcripts below.
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close interview summary"
          style={{
            background: "transparent",
            border: "none",
            color: "#9ca3af",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Scorecard row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
        }}
      >
        {/* Avg Score */}
        <div
          style={{
            background: "#181822",
            border: "1px solid #282836",
            borderRadius: 12,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <div style={{ fontSize: 12, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
            Overall Match Score
          </div>
          <div style={{ fontSize: 48, fontWeight: 800, color: "#a5b4fc", lineHeight: 1 }}>
            {summary?.averageScore}%
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>
            Hiring Bar Target: 80%+
          </div>
        </div>

        {/* STAR Utilization */}
        <div
          style={{
            background: "#181822",
            border: "1px solid #282836",
            borderRadius: 12,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <div style={{ fontSize: 12, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
            STAR Mastery
          </div>
          <div style={{ fontSize: 48, fontWeight: 800, color: "#34d399", lineHeight: 1 }}>
            {summary?.starPercent}%
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>
            Bullets incorporating STAR details
          </div>
        </div>

        {/* Filler Words */}
        <div
          style={{
            background: "#181822",
            border: "1px solid #282836",
            borderRadius: 12,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ fontSize: 12, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, textAlign: "center" }}>
            Filler Word Usage
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {summary && Object.entries(summary.fillerCounts).map(([word, count]) => (
              <div key={word} style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "#9ca3af" }}>&quot;{word}&quot;</span>
                <span style={{ fontWeight: 700, color: count > 2 ? "#f87171" : "#34d399" }}>
                  {count} {count === 1 ? "time" : "times"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Complete Q&A Transcript */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#ffffff", margin: "12px 0 0 0" }}>
          Complete Q&A Transcript
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 280, overflowY: "auto", paddingRight: 6 }}>
          {sessions.map((s, idx) => (
            <div
              key={idx}
              style={{
                background: "#15151b",
                border: "1px solid #23232c",
                borderRadius: 8,
                padding: 16,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: "#a5b4fc", marginBottom: 6 }}>
                Q{idx + 1}: {s.question}
              </div>
              <div style={{ fontSize: 12.5, color: "#d1d5db", background: "#1b1b24", padding: 10, borderRadius: 6, marginBottom: 8, border: "1px solid #23232d", whiteSpace: "pre-wrap" }}>
                <strong>Your Answer:</strong> &quot;{s.answer}&quot;
              </div>
              {s.evaluation && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "#9ca3af" }}>
                  <div>
                    <strong>Score:</strong> <span style={{ color: "#a5b4fc", fontWeight: 700 }}>{s.evaluation.score}/10</span> | <strong>Feedback:</strong> {s.evaluation.feedback}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid #23232a", paddingTop: 16 }}>
        <button
          onClick={onClose}
          style={{
            background: "var(--accent)",
            color: "white",
            border: "none",
            borderRadius: 8,
            padding: "12px 28px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>Close Simulator</span>
          <X size={14} />
        </button>
      </div>
    </>
  );
}
