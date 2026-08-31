"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, AlertCircle, Sparkles, HelpCircle } from "lucide-react";

interface Props {
  resumeText: string;
  keywordsMatched?: string[];
  keywordsMissing?: string[];
  onOpenAutoFix?: () => void;
}

const WEAK_VERB_MAP: Record<string, string[]> = {
  "responsible for": ["Spearheaded", "Architected", "Orchestrated", "Directed"],
  "worked on": ["Engineered", "Developed", "Deployed", "Delivered"],
  "assisted with": ["Co-engineered", "Facilitated", "Collaborated on", "Supported"],
  "helped with": ["Accelerated", "Championed", "Executed", "Optimized"],
  "participated in": ["Contributed to", "Co-designed", "Drove"],
  handled: ["Managed", "Streamlined", "Resolved", "Governed"],
  "duties included": ["Delivered", "Led", "Executed"],
};

export default function AtsXRayOverlay({
  resumeText,
  keywordsMatched = [],
  keywordsMissing = [],
  onOpenAutoFix,
}: Props) {
  const [showKeywords, setShowKeywords] = useState(true);
  const [showWeakVerbs, setShowWeakVerbs] = useState(true);
  const [showUnquantified, setShowUnquantified] = useState(true);
  const [hoveredItem, setHoveredItem] = useState<{
    type: "keyword" | "weak-verb" | "unquantified";
    text: string;
    suggestion?: string;
  } | null>(null);

  const matchedSet = useMemo(() => {
    return new Set((keywordsMatched || []).map((k) => k.toLowerCase().trim()));
  }, [keywordsMatched]);

  const lines = useMemo(() => {
    return (resumeText || "").split("\n");
  }, [resumeText]);

  // Counts for layer badges
  const stats = useMemo(() => {
    let weakCount = 0;
    let unquantifiedCount = 0;
    const lowerText = resumeText.toLowerCase();

    Object.keys(WEAK_VERB_MAP).forEach((phrase) => {
      const matches = lowerText.split(phrase).length - 1;
      weakCount += matches;
    });

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*")) {
        const hasMetric = /\d+[%kKmMbB$]?|\$\d+|\b\d+\b/.test(trimmed);
        if (!hasMetric && trimmed.length > 20) {
          unquantifiedCount++;
        }
      }
    });

    return {
      keywords: keywordsMatched.length,
      weakVerbs: weakCount,
      unquantified: unquantifiedCount,
    };
  }, [resumeText, keywordsMatched, lines]);

  // Line Renderer with Interactive Highlighting
  const renderLine = (line: string, lineIndex: number) => {
    const trimmed = line.trim();
    const isBullet = trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*");
    const hasMetric = /\d+[%kKmMbB$]?|\$\d+|\b\d+\b/.test(trimmed);
    const isUnquantifiedBullet = isBullet && !hasMetric && trimmed.length > 25 && showUnquantified;

    // Check for weak verbs
    const lowerLine = line.toLowerCase();
    let detectedWeakPhrase: string | null = null;
    if (showWeakVerbs) {
      for (const phrase of Object.keys(WEAK_VERB_MAP)) {
        if (lowerLine.includes(phrase)) {
          detectedWeakPhrase = phrase;
          break;
        }
      }
    }

    return (
      <div
        key={lineIndex}
        style={{
          position: "relative",
          lineHeight: "1.6",
          padding: "2px 6px",
          borderRadius: 4,
          background: isUnquantifiedBullet ? "rgba(245, 158, 11, 0.08)" : "transparent",
          borderLeft: isUnquantifiedBullet ? "3px solid #f59e0b" : "3px solid transparent",
          margin: "1px 0",
          fontSize: 13,
          color: "#1e293b",
          fontFamily: "'Calibri', 'Inter', sans-serif",
        }}
      >
        {isUnquantifiedBullet && (
          <span
            onMouseEnter={() =>
              setHoveredItem({
                type: "unquantified",
                text: trimmed,
                suggestion:
                  "Add measurable numbers, percentages, or dollar impact (e.g. +38%, $500K).",
              })
            }
            onMouseLeave={() => setHoveredItem(null)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              background: "#fef3c7",
              color: "#b45309",
              padding: "1px 5px",
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 700,
              marginRight: 6,
              cursor: "help",
            }}
          >
            <AlertCircle size={10} />
            <span>Unquantified</span>
          </span>
        )}

        {/* Tokenized line content */}
        {line.split(/(\s+)/).map((word, wIdx) => {
          const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, "");
          const isMatched = showKeywords && matchedSet.has(cleanWord);

          if (isMatched) {
            return (
              <span
                key={wIdx}
                onMouseEnter={() =>
                  setHoveredItem({
                    type: "keyword",
                    text: word,
                    suggestion:
                      "High-value keyword matched against target role description (+ATS score boost)",
                  })
                }
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  background: "rgba(16, 185, 129, 0.18)",
                  color: "#065f46",
                  borderBottom: "2px solid #10b981",
                  borderRadius: 3,
                  padding: "0 3px",
                  fontWeight: 600,
                  cursor: "help",
                }}
              >
                {word}
              </span>
            );
          }

          if (detectedWeakPhrase && word.toLowerCase().includes(detectedWeakPhrase.split(" ")[0])) {
            const suggestions = WEAK_VERB_MAP[detectedWeakPhrase] || ["Spearheaded", "Executed"];
            return (
              <span
                key={wIdx}
                onMouseEnter={() =>
                  setHoveredItem({
                    type: "weak-verb",
                    text: detectedWeakPhrase!,
                    suggestion: `Weak passive phrase. Try: ${suggestions.join(", ")}`,
                  })
                }
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  color: "#991b1b",
                  borderBottom: "2px dashed #ef4444",
                  borderRadius: 3,
                  padding: "0 3px",
                  fontWeight: 600,
                  cursor: "help",
                }}
              >
                {word}
              </span>
            );
          }

          return <span key={wIdx}>{word}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* ── Layer Filter Bar ──────────────────────────────────── */}
      <div
        style={{
          background: "var(--paper-card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "8px 12px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          fontSize: 11.5,
        }}
      >
        <span className="font-mono font-bold text-ink-muted uppercase tracking-wider text-[10.5px]">
          X-Ray Lenses
        </span>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Matched Keywords Lens */}
          <button
            onClick={() => setShowKeywords((v) => !v)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 9px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              border: `1px solid ${showKeywords ? "#10b981" : "var(--border)"}`,
              background: showKeywords ? "rgba(16, 185, 129, 0.12)" : "transparent",
              color: showKeywords ? "#059669" : "var(--ink-muted)",
              transition: "all 0.15s ease",
            }}
          >
            <CheckCircle2 size={12} />
            <span>Keywords ({stats.keywords})</span>
          </button>

          {/* Weak Verbs Lens */}
          <button
            onClick={() => setShowWeakVerbs((v) => !v)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 9px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              border: `1px solid ${showWeakVerbs ? "#ef4444" : "var(--border)"}`,
              background: showWeakVerbs ? "rgba(239, 68, 68, 0.12)" : "transparent",
              color: showWeakVerbs ? "#dc2626" : "var(--ink-muted)",
              transition: "all 0.15s ease",
            }}
          >
            <AlertTriangle size={12} />
            <span>Passive Verbs ({stats.weakVerbs})</span>
          </button>

          {/* Unquantified Lens */}
          <button
            onClick={() => setShowUnquantified((v) => !v)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 9px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              border: `1px solid ${showUnquantified ? "#f59e0b" : "var(--border)"}`,
              background: showUnquantified ? "rgba(245, 158, 11, 0.12)" : "transparent",
              color: showUnquantified ? "#d97706" : "var(--ink-muted)",
              transition: "all 0.15s ease",
            }}
          >
            <AlertCircle size={12} />
            <span>Unquantified ({stats.unquantified})</span>
          </button>
        </div>
      </div>

      {/* ── Active Hover Popover Insight ──────────────────────── */}
      <AnimatePresence>
        {hoveredItem && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            style={{
              background: "var(--paper-card)",
              border: `1.5px solid ${
                hoveredItem.type === "keyword"
                  ? "#10b981"
                  : hoveredItem.type === "weak-verb"
                    ? "#ef4444"
                    : "#f59e0b"
              }`,
              borderRadius: 10,
              padding: "8px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              fontSize: 12,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="font-bold text-ink font-mono">{hoveredItem.text}</span>
              <span className="text-ink-muted">— {hoveredItem.suggestion}</span>
            </div>

            {onOpenAutoFix && (
              <button
                onClick={onOpenAutoFix}
                style={{
                  background: "var(--accent)",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 8px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  whiteSpace: "nowrap",
                }}
              >
                <Sparkles size={11} /> Auto-Fix
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── X-Ray Highlighted Document Body ──────────────────── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "24px 20px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          fontFamily: "'Calibri', 'Inter', sans-serif",
          whiteSpace: "pre-wrap",
        }}
      >
        {lines.map((line, idx) => renderLine(line, idx))}
      </div>
    </div>
  );
}
