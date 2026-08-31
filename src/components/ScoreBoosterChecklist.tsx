"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowRight,
  Zap,
  Target,
  FileText,
  Award,
} from "lucide-react";
import type { AnalysisResult } from "@/types";

interface ActionItem {
  id: string;
  category: "keywords" | "verbs" | "metrics" | "structure";
  title: string;
  description: string;
  points: number;
  actionLabel: string;
  targetElementId?: string;
}

interface Props {
  displayResult: AnalysisResult;
  resumeText?: string;
  jobDescription?: string;
  targetRole?: string;
  onOpenAutoFix?: () => void;
}

export default function ScoreBoosterChecklist({
  displayResult,
  resumeText = "",
  jobDescription = "",
  targetRole = "",
  onOpenAutoFix,
}: Props) {
  const currentScore = displayResult.score || 70;

  // Generate dynamic checklist items based on actual resume deficiencies
  const items: ActionItem[] = useMemo(() => {
    const list: ActionItem[] = [];

    // 1. Missing Keywords Boost
    const missingKws = displayResult.keywords_missing || [];
    if (missingKws.length > 0) {
      const topKws = missingKws.slice(0, 3).join(", ");
      list.push({
        id: "keywords",
        category: "keywords",
        title: `Integrate ${missingKws.length} Missing Keywords`,
        description: `Add target terms (${topKws}) to skills and experience bullets to pass ATS filters.`,
        points: Math.min(10, Math.max(5, missingKws.length * 2)),
        actionLabel: "View Keyword Matrix",
        targetElementId: "chat-section",
      });
    }

    // 2. Weak Action Verbs Boost
    const hasWeakVerbs = /helped|worked|worked on|responsible for|assisted|handled/i.test(
      resumeText
    );
    if (hasWeakVerbs || currentScore < 85) {
      list.push({
        id: "verbs",
        category: "verbs",
        title: "Replace Weak Verbs with Power Action Verbs",
        description:
          "Swap passive verbs with high-impact verbs like 'Spearheaded', 'Architected', and 'Delivered'.",
        points: 6,
        actionLabel: "Audit Action Verbs",
        targetElementId: "active-verb-section",
      });
    }

    // 3. Quantified Impact Metrics Boost
    const hasNumbers = /\d+%|\$\d+|\d+x|\d+ users|\d+ms/i.test(resumeText);
    if (!hasNumbers || currentScore < 80) {
      list.push({
        id: "metrics",
        category: "metrics",
        title: "Quantify Experience Bullets with Metrics",
        description:
          "Add specific percentages, dollar values, or time reductions to demonstrate tangible ROI.",
        points: 7,
        actionLabel: "View Bullet Rewrites",
        targetElementId: "suggestions-section",
      });
    }

    // 4. ATS Formatting & Section Hierarchy
    list.push({
      id: "structure",
      category: "structure",
      title: "Optimize Section Order & Typographic Hierarchy",
      description:
        "Ensure skills section is prominent and single-column layout passes Workday/Taleo parsers.",
      points: 4,
      actionLabel: "Format Check",
      targetElementId: "ats-breakdown-section",
    });

    return list;
  }, [displayResult, resumeText, currentScore]);

  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const totalPossibleBoost = items.reduce((acc, it) => acc + it.points, 0);
  const earnedBoost = items
    .filter((it) => completedIds.has(it.id))
    .reduce((acc, it) => acc + it.points, 0);

  const potentialScore = Math.min(99, currentScore + totalPossibleBoost);
  const dynamicActiveScore = Math.min(99, currentScore + earnedBoost);

  const handleActionClick = (targetId?: string) => {
    if (targetId) {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }
    if (onOpenAutoFix) {
      onOpenAutoFix();
    }
  };

  return (
    <div
      style={{
        background: "var(--paper-card)",
        borderRadius: 18,
        border: "1.5px solid var(--border)",
        padding: "22px 24px",
        marginBottom: 24,
        boxShadow: "0 4px 20px -4px rgba(0,0,0,0.06), 0 0 0 1px rgba(249,115,22,0.08)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background ambient accent tint */}
      <div
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(249,115,22,0.12), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Header Row: Title & Score Projection */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 9px",
                borderRadius: 20,
                background: "rgba(249,115,22,0.12)",
                color: "#f97316",
                fontSize: 10.5,
                fontWeight: 800,
                fontFamily: "DM Mono, monospace",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              <Zap size={12} className="text-orange-500 fill-orange-500" />
              <span>Score Booster Plan</span>
            </span>
            <span className="text-[11px] text-ink-faint font-mono font-medium">
              {completedIds.size} of {items.length} tasks completed
            </span>
          </div>
          <h2
            style={{
              fontFamily: "DM Serif Display, serif",
              fontSize: "clamp(18px, 2.2vw, 22px)",
              fontWeight: 700,
              color: "var(--ink)",
              margin: 0,
              letterSpacing: "-0.4px",
            }}
          >
            Path to 95+ (Grade A+ Match)
          </h2>
        </div>

        {/* Projected Score Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "var(--paper-warm)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "8px 14px",
          }}
        >
          <div className="text-center">
            <div className="text-[9px] font-mono text-ink-faint uppercase tracking-wider font-bold">
              Current
            </div>
            <div className="text-base font-black font-mono text-ink">{currentScore}</div>
          </div>

          <ArrowRight size={14} className="text-orange-500 shrink-0" />

          <div className="text-center">
            <div className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-bold">
              Target
            </div>
            <div className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
              {dynamicActiveScore}
              <span className="text-xs font-bold text-emerald-500 ml-1">
                (+{earnedBoost > 0 ? earnedBoost : totalPossibleBoost} pts)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Animated Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center text-[11px] font-mono mb-1.5">
          <span className="text-ink-muted font-medium">Optimization Progress</span>
          <span className="font-bold text-orange-500">
            {Math.round((completedIds.size / items.length) * 100)}%
          </span>
        </div>
        <div
          style={{
            height: 7,
            borderRadius: 6,
            background: "rgba(0,0,0,0.06)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(completedIds.size / items.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            style={{
              height: "100%",
              borderRadius: 6,
              background: "linear-gradient(90deg, #f97316 0%, #10b981 100%)",
            }}
          />
        </div>
      </div>

      {/* Action Checklist Items */}
      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const isDone = completedIds.has(item.id);
          return (
            <motion.div
              key={item.id}
              layout
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "12px 14px",
                borderRadius: 12,
                border: `1px solid ${isDone ? "rgba(16,185,129,0.3)" : "var(--border)"}`,
                background: isDone ? "rgba(16,185,129,0.05)" : "var(--paper-card)",
                transition: "all 0.2s ease",
              }}
              className="group hover:border-accent/40"
            >
              {/* Checkbox & Title */}
              <div
                className="flex items-start gap-3 cursor-pointer select-none flex-1"
                onClick={() => toggleItem(item.id)}
              >
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <CheckCircle2 size={18} className="text-emerald-500 fill-emerald-500/20" />
                  ) : (
                    <Circle
                      size={18}
                      className="text-ink-faint group-hover:text-orange-500 transition-colors"
                    />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      style={{
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: isDone ? "var(--ink-muted)" : "var(--ink)",
                        textDecoration: isDone ? "line-through" : "none",
                        fontFamily: "Instrument Sans, sans-serif",
                      }}
                    >
                      {item.title}
                    </span>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        fontFamily: "DM Mono, monospace",
                        padding: "1px 6px",
                        borderRadius: 6,
                        background: isDone ? "rgba(16,185,129,0.15)" : "rgba(249,115,22,0.12)",
                        color: isDone ? "#059669" : "#ea580c",
                      }}
                    >
                      +{item.points} pts
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--ink-muted)",
                      margin: "3px 0 0",
                      lineHeight: 1.4,
                    }}
                  >
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Quick Action Button */}
              <button
                type="button"
                onClick={() => handleActionClick(item.targetElementId)}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: "Instrument Sans, sans-serif",
                  color: "var(--accent)",
                  background: "var(--accent-bg)",
                  border: "1px solid var(--accent-border)",
                  borderRadius: 8,
                  padding: "5px 10px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  transition: "all 0.15s ease",
                }}
                className="hover:opacity-90 shrink-0"
              >
                <span>{item.actionLabel}</span>
                <ArrowRight size={11} />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
