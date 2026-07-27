"use client";

import { useState, useMemo } from "react";
import {
  Compass,
  Sparkles,
  TrendingUp,
  Award,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import {
  calculateSkillRadarData,
  SeniorityLevel,
  SENIORITY_LABELS,
  RadarAxis,
} from "@/lib/skillRadarEngine";

interface Props {
  resumeText: string;
}

export default function SkillRadarChart({ resumeText }: Props) {
  const [selectedLevel, setSelectedLevel] = useState<SeniorityLevel>("senior");
  const [hoveredAxis, setHoveredAxis] = useState<RadarAxis | null>(null);

  const radarData = useMemo(() => {
    return calculateSkillRadarData(resumeText, selectedLevel);
  }, [resumeText, selectedLevel]);

  // SVG Geometry Settings
  const size = 420;
  const center = size / 2;
  const radius = 140;
  const numAxes = 6;
  const angleStep = (2 * Math.PI) / numAxes;

  // Convert (axisIndex, scorePercent) to SVG (x, y) coordinates
  const getCoordinates = (index: number, score: number) => {
    const angle = index * angleStep - Math.PI / 2; // Start from top 12 o'clock
    const r = (score / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Build SVG polygon points strings
  const candidatePoints = useMemo(() => {
    return radarData.axes
      .map((axis, i) => {
        const { x, y } = getCoordinates(i, axis.score);
        return `${x},${y}`;
      })
      .join(" ");
  }, [radarData.axes]);

  const targetPoints = useMemo(() => {
    return radarData.axes
      .map((axis, i) => {
        const { x, y } = getCoordinates(i, axis.targetScore);
        return `${x},${y}`;
      })
      .join(" ");
  }, [radarData.axes]);

  return (
    <div
      style={{
        background: "var(--paper-card)",
        border: "1.5px solid var(--border)",
        borderRadius: "16px",
        overflow: "hidden",
        marginTop: "16px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
      }}
    >
      {/* ── Top Header ────────────────────────────────────────── */}
      <div
        style={{
          padding: "16px 22px",
          borderBottom: "1px solid var(--border)",
          background: "var(--accent-bg)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "rgba(139, 92, 246, 0.12)",
              border: "1px solid rgba(139, 92, 246, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#8b5cf6",
            }}
          >
            <Compass size={18} />
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--ink)",
                fontFamily: "Instrument Sans, sans-serif",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              Interactive 360° Skill Radar & Seniority Benchmark
              <span
                style={{
                  fontSize: "10px",
                  fontFamily: "DM Mono, monospace",
                  background: "rgba(139, 92, 246, 0.15)",
                  color: "#8b5cf6",
                  padding: "2px 8px",
                  borderRadius: "99px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                360° View
              </span>
            </h3>
            <p style={{ margin: "2px 0 0 0", fontSize: "11.5px", color: "var(--ink-muted)" }}>
              Maps your 6 career competency dimensions against target role seniority benchmarks.
            </p>
          </div>
        </div>

        {/* Seniority Fit Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", color: "var(--ink-muted)", fontWeight: 600 }}>Seniority Fit:</span>
          <div
            style={{
              background:
                radarData.overallFitScore >= 80
                  ? "rgba(16, 185, 129, 0.15)"
                  : radarData.overallFitScore >= 60
                  ? "rgba(245, 158, 11, 0.15)"
                  : "rgba(239, 68, 68, 0.15)",
              border: `1px solid ${
                radarData.overallFitScore >= 80 ? "#10b981" : radarData.overallFitScore >= 60 ? "#f59e0b" : "#ef4444"
              }`,
              color:
                radarData.overallFitScore >= 80 ? "#10b981" : radarData.overallFitScore >= 60 ? "#f59e0b" : "#ef4444",
              borderRadius: "99px",
              padding: "4px 12px",
              fontSize: "12.5px",
              fontWeight: 800,
              fontFamily: "DM Mono, monospace",
            }}
          >
            {radarData.overallFitScore}% Match
          </div>
        </div>
      </div>

      {/* ── Seniority Level Dial Selector ─────────────────────── */}
      <div
        style={{
          padding: "12px 22px",
          background: "var(--paper-warm)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink)", fontFamily: "DM Mono, monospace" }}>
          Target Seniority Target:
        </span>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {(["junior", "mid", "senior", "staff"] as SeniorityLevel[]).map((level) => {
            const active = selectedLevel === level;
            return (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                style={{
                  background: active ? "var(--accent)" : "var(--paper)",
                  color: active ? "white" : "var(--ink-muted)",
                  border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: "8px",
                  padding: "6px 14px",
                  fontSize: "11.5px",
                  fontWeight: active ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: active ? "0 2px 8px var(--brand-glow)" : "none",
                }}
              >
                {SENIORITY_LABELS[level].name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Workspace: Chart & Insights ─────────────────── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          background: "var(--paper)",
          minHeight: "460px",
        }}
      >
        {/* Left Side: SVG 360° Radar Canvas */}
        <div
          style={{
            flex: "1 1 380px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px 16px",
            position: "relative",
            minWidth: "300px",
          }}
        >
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: "100%", height: "auto" }}>
            {/* Concentric Grid Rings (20%, 40%, 60%, 80%, 100%) */}
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((level, ringIdx) => {
              const ringPoints = radarData.axes
                .map((_, i) => {
                  const { x, y } = getCoordinates(i, level * 100);
                  return `${x},${y}`;
                })
                .join(" ");

              return (
                <polygon
                  key={ringIdx}
                  points={ringPoints}
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="1"
                  strokeDasharray={level === 1.0 ? "none" : "3,3"}
                />
              );
            })}

            {/* 6 Axis Spoke Lines */}
            {radarData.axes.map((_, i) => {
              const { x, y } = getCoordinates(i, 100);
              return (
                <line
                  key={i}
                  x1={center}
                  y1={center}
                  x2={x}
                  y2={y}
                  stroke="var(--border)"
                  strokeWidth="1.2"
                />
              );
            })}

            {/* Target Level Benchmark Polygon (Dashed Amber) */}
            <polygon
              points={targetPoints}
              fill="rgba(245, 158, 11, 0.08)"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="5,5"
              style={{ transition: "all 0.4s ease" }}
            />

            {/* Candidate Score Polygon (Solid Neon Purple/Emerald) */}
            <polygon
              points={candidatePoints}
              fill="rgba(139, 92, 246, 0.22)"
              stroke="#8b5cf6"
              strokeWidth="2.5"
              style={{ transition: "all 0.4s ease" }}
            />

            {/* Axis Interactive Nodes & Vertices */}
            {radarData.axes.map((axis, i) => {
              const candCoord = getCoordinates(i, axis.score);
              const targetCoord = getCoordinates(i, axis.targetScore);
              const labelCoord = getCoordinates(i, 118);
              const isHovered = hoveredAxis?.key === axis.key;

              return (
                <g key={axis.key}>
                  {/* Candidate Vertex Dot */}
                  <circle
                    cx={candCoord.x}
                    cy={candCoord.y}
                    r={isHovered ? "7" : "5"}
                    fill="#8b5cf6"
                    stroke="#ffffff"
                    strokeWidth="2"
                    style={{ cursor: "pointer", transition: "all 0.2s ease" }}
                    onMouseEnter={() => setHoveredAxis(axis)}
                    onMouseLeave={() => setHoveredAxis(null)}
                  />

                  {/* Target Benchmark Vertex Dot */}
                  <circle
                    cx={targetCoord.x}
                    cy={targetCoord.y}
                    r="3.5"
                    fill="#f59e0b"
                  />

                  {/* Outer Axis Labels */}
                  <text
                    x={labelCoord.x}
                    y={labelCoord.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isHovered ? "var(--accent)" : "var(--ink)"}
                    fontSize="11"
                    fontWeight={isHovered ? "700" : "600"}
                    fontFamily="Instrument Sans, sans-serif"
                    style={{ cursor: "pointer" }}
                    onMouseEnter={() => setHoveredAxis(axis)}
                    onMouseLeave={() => setHoveredAxis(null)}
                  >
                    {axis.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Chart Legend */}
          <div
            style={{
              display: "flex",
              gap: "20px",
              marginTop: "12px",
              fontSize: "11px",
              color: "var(--ink-muted)",
              fontFamily: "DM Mono, monospace",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "rgba(139, 92, 246, 0.5)", border: "1px solid #8b5cf6" }} />
              Candidate Profile
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "14px", height: "0px", borderBottom: "2px dashed #f59e0b" }} />
              {SENIORITY_LABELS[selectedLevel].name} Benchmark
            </div>
          </div>
        </div>

        {/* Right Side: Competency Details & Advancement Advice */}
        <div
          style={{
            flex: "1 1 340px",
            borderLeft: "1px solid var(--border)",
            padding: "24px 20px",
            background: "var(--paper-card)",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            overflowY: "auto",
            boxSizing: "border-box",
            minWidth: "300px",
          }}
        >
          {/* Hovered / Active Axis Highlight */}
          {hoveredAxis ? (
            <div
              style={{
                background: "var(--accent-bg)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "14px",
                boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)", marginBottom: "6px" }}>
                {hoveredAxis.label}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", color: "var(--ink-muted)", marginBottom: "8px" }}>
                <span>Score: <strong style={{ color: "#8b5cf6" }}>{hoveredAxis.score}/100</strong></span>
                <span>Target: <strong style={{ color: "#f59e0b" }}>{hoveredAxis.targetScore}/100</strong></span>
              </div>
              <p style={{ fontSize: "11px", color: "var(--ink-muted)", margin: 0, lineHeight: 1.5 }}>
                {hoveredAxis.advice}
              </p>
            </div>
          ) : (
            <div
              style={{
                background: "var(--paper-warm)",
                border: "1px dashed var(--border)",
                borderRadius: "12px",
                padding: "12px 14px",
                fontSize: "11.5px",
                color: "var(--ink-muted)",
                lineHeight: 1.5,
              }}
            >
              💡 Hover over any dimension on the radar chart to view candidate score vs target benchmark details.
            </div>
          )}

          {/* Core Strengths */}
          <div>
            <div
              style={{
                fontSize: "11px",
                fontFamily: "DM Mono, monospace",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "#10b981",
                fontWeight: 700,
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <CheckCircle2 size={13} /> Key Benchmark Strengths
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {radarData.strengths.map((str, idx) => (
                <div
                  key={idx}
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--ink)",
                    background: "rgba(16, 185, 129, 0.06)",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Sparkles size={12} style={{ color: "#10b981", flexShrink: 0 }} />
                  <span>{str}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Level Advancement Tips */}
          <div>
            <div
              style={{
                fontSize: "11px",
                fontFamily: "DM Mono, monospace",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "#f59e0b",
                fontWeight: 700,
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <TrendingUp size={13} /> Level Advancement Recommendations
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {radarData.levelAdvancementTips.map((tip, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "rgba(245, 158, 11, 0.06)",
                    border: "1px solid rgba(245, 158, 11, 0.2)",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    fontSize: "11.5px",
                    color: "var(--ink-muted)",
                    lineHeight: 1.5,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontWeight: 800, color: "#f59e0b", flexShrink: 0 }}>•</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
