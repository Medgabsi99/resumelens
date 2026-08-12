"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Shield,
  HelpCircle,
} from "lucide-react";
import type { AtsCheck, AtsCheckCategory, AtsRulesResult } from "@/types";

interface Props {
  atsRules: AtsRulesResult;
}

const CATEGORY_LABELS: Record<AtsCheckCategory, string> = {
  contact: "📇 Contact Info",
  structure: "🏗️ Structure",
  content: "💡 Content Quality",
  keywords: "🔑 Keywords",
  formatting: "🖋️ Formatting",
};

const CATEGORY_ORDER: AtsCheckCategory[] = [
  "contact",
  "structure",
  "content",
  "keywords",
  "formatting",
];

function StatusIcon({ status }: { status: AtsCheck["status"] }) {
  if (status === "pass")
    return <CheckCircle2 size={15} style={{ color: "#16a34a", flexShrink: 0 }} />;
  if (status === "fail") return <XCircle size={15} style={{ color: "#dc2626", flexShrink: 0 }} />;
  return <AlertTriangle size={15} style={{ color: "#d97706", flexShrink: 0 }} />;
}

function StatusBadge({ status }: { status: AtsCheck["status"] }) {
  const styles = {
    pass: { background: "#dcfce7", color: "#15803d", border: "1px solid #86efac" },
    warn: { background: "#fef9c3", color: "#92400e", border: "1px solid #fde68a" },
    fail: { background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" },
  };
  const labels = { pass: "Pass", warn: "Warn", fail: "Fail" };
  return (
    <span
      style={{
        ...styles[status],
        fontSize: 10,
        fontWeight: 700,
        borderRadius: 20,
        padding: "1px 8px",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}
    >
      {labels[status]}
    </span>
  );
}

function CheckRow({ check }: { check: AtsCheck }) {
  const [expanded, setExpanded] = useState(false);
  const hasFix = !!check.fix;

  return (
    <div
      style={{
        borderRadius: 8,
        border: `1px solid ${check.status === "fail" ? "rgba(239,68,68,0.3)" : check.status === "warn" ? "rgba(245,158,11,0.3)" : "var(--border)"}`,
        background:
          check.status === "fail"
            ? "rgba(239,68,68,0.06)"
            : check.status === "warn"
              ? "rgba(245,158,11,0.06)"
              : "var(--paper)",
        overflow: "hidden",
        transition: "box-shadow 0.15s",
      }}
    >
      <button
        onClick={() => hasFix && setExpanded(!expanded)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "9px 12px",
          background: "transparent",
          border: "none",
          cursor: hasFix ? "pointer" : "default",
          textAlign: "left",
        }}
      >
        <StatusIcon status={check.status} />
        <span
          style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "var(--ink)", lineHeight: 1.3 }}
        >
          {check.label}
        </span>
        <StatusBadge status={check.status} />
        {hasFix && (
          <span style={{ color: "var(--ink-muted)", marginLeft: 4 }}>
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </span>
        )}
      </button>

      <AnimatePresence>
        {expanded && hasFix && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                padding: "0 12px 10px 37px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ fontSize: 11, color: "var(--ink-muted)", lineHeight: 1.5 }}>
                <strong style={{ color: "var(--ink)" }}>Found:</strong> {check.detail}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#818cf8",
                  background: "rgba(99,102,241,0.1)",
                  border: "1px solid rgba(99,102,241,0.25)",
                  borderRadius: 6,
                  padding: "6px 10px",
                  lineHeight: 1.5,
                }}
              >
                <strong>Fix:</strong> {check.fix}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!expanded && check.status !== "pass" && (
        <div style={{ padding: "0 12px 8px 37px", fontSize: 11, color: "var(--ink-muted)" }}>
          {check.detail}
        </div>
      )}
    </div>
  );
}

export default function AtsRulesPanel({ atsRules }: Props) {
  const [activeCategory, setActiveCategory] = useState<AtsCheckCategory | "all">("all");

  const byCategory = (cat: AtsCheckCategory) => atsRules.checks.filter((c) => c.category === cat);

  const displayChecks =
    activeCategory === "all"
      ? atsRules.checks
      : atsRules.checks.filter((c) => c.category === activeCategory);

  const scoreColor =
    atsRules.deterministicScore >= 80
      ? "#16a34a"
      : atsRules.deterministicScore >= 60
        ? "#d97706"
        : "#dc2626";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Shield size={16} style={{ color: "var(--accent)" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
            ATS Rules Check
          </span>
          <span style={{ fontSize: 11, color: "var(--ink-muted)" }}>
            ({atsRules.checks.length} criteria)
          </span>
        </div>

        {/* Score pill */}
        <div
          style={{
            marginLeft: "auto",
            background: scoreColor + "18",
            border: `1px solid ${scoreColor}40`,
            color: scoreColor,
            borderRadius: 20,
            padding: "3px 14px",
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          {atsRules.deterministicScore}/100
        </div>

        {/* Summary pills */}
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { label: `${atsRules.passCount} Pass`, bg: "#dcfce7", color: "#15803d" },
            { label: `${atsRules.warnCount} Warn`, bg: "#fef9c3", color: "#92400e" },
            { label: `${atsRules.failCount} Fail`, bg: "#fee2e2", color: "#991b1b" },
          ].map((s) => (
            <span
              key={s.label}
              style={{
                background: s.bg,
                color: s.color,
                borderRadius: 20,
                padding: "2px 10px",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Category filter tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {(["all", ...CATEGORY_ORDER] as const).map((cat) => {
          const isActive = activeCategory === cat;
          const catChecks = cat === "all" ? atsRules.checks : byCategory(cat);
          const failCount = catChecks.filter((c) => c.status === "fail").length;
          const warnCount = catChecks.filter((c) => c.status === "warn").length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "5px 12px",
                borderRadius: 8,
                border: `1px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
                background: isActive ? "var(--accent)" : "transparent",
                color: isActive ? "#fff" : "var(--ink-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
                transition: "all 0.15s",
              }}
            >
              {cat === "all" ? "All Checks" : CATEGORY_LABELS[cat]}
              {(failCount > 0 || warnCount > 0) && (
                <span
                  style={{
                    background:
                      failCount > 0
                        ? isActive
                          ? "rgba(255,255,255,0.3)"
                          : "#fee2e2"
                        : isActive
                          ? "rgba(255,255,255,0.3)"
                          : "#fef9c3",
                    color:
                      failCount > 0
                        ? isActive
                          ? "#fff"
                          : "#991b1b"
                        : isActive
                          ? "#fff"
                          : "#92400e",
                    borderRadius: 10,
                    padding: "0 5px",
                    fontSize: 10,
                  }}
                >
                  {failCount > 0 ? failCount : warnCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Check list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {displayChecks.map((check, i) => (
          <motion.div
            key={check.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, type: "spring", stiffness: 300, damping: 26 }}
          >
            <CheckRow check={check} />
          </motion.div>
        ))}
        {displayChecks.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "20px 0",
              color: "var(--ink-muted)",
              fontSize: 12,
            }}
          >
            No checks in this category
          </div>
        )}
      </div>

      <div style={{ fontSize: 11, color: "var(--ink-faint)", textAlign: "center", marginTop: 4 }}>
        Click any ⚠️ Warn or ❌ Fail row to see the specific fix
      </div>
    </div>
  );
}
