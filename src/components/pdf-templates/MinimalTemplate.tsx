"use client";

import React from "react";
import { AnalysisResult } from "@/types";
import styles from "./pdfTemplates.module.css";

interface Props {
  resumeText?: string;
  jobDescription?: string;
  targetRole?: string;
  result: AnalysisResult;
}

export default function MinimalTemplate({
  resumeText,
  jobDescription,
  targetRole,
  result,
}: Props) {
  return (
    <div className={styles.minimalContainer}>
      <div className={styles.minimalHeader}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>
          {targetRole || "Resume Review"}
        </div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: result.score >= 75 ? "#0f766e" : "#7a2020",
          }}
        >
          {result.score}
        </div>
      </div>

      <div className={styles.minimalSummary}>{result.summary}</div>

      <div className={styles.minimalColumns}>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: "0 0 8px 0" }}>Suggestions</h4>
          <ol style={{ marginTop: 6 }}>
            {result.suggestions.slice(0, 4).map((s, i) => (
              <li key={i} style={{ marginBottom: 8 }}>
                {s.after}
              </li>
            ))}
          </ol>
        </div>
        <div style={{ width: 220 }}>
          <h4 style={{ margin: "0 0 8px 0" }}>Highlights</h4>
          <ul>
            {result.strengths.map((s, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.small}>ResumeLens</div>
    </div>
  );
}
