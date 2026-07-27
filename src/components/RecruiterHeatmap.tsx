"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Eye,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Activity,
  Layers,
  ArrowRight,
} from "lucide-react";
import { calculateHeatmapData, FixationPoint } from "@/lib/heatmapEngine";

interface Props {
  resumeText: string;
}

export default function RecruiterHeatmap({ resumeText }: Props) {
  const [viewMode, setViewMode] = useState<"heatmap" | "gaze-path" | "split">("heatmap");
  const [isPlayingGaze, setIsPlayingGaze] = useState(false);
  const [activeGazeStep, setActiveGazeStep] = useState<number>(0);
  const [heatRadius, setHeatRadius] = useState<number>(55);
  const [showLegend, setShowLegend] = useState(true);

  // Compute heatmap metrics
  const heatmapData = useMemo(() => {
    return calculateHeatmapData(resumeText);
  }, [resumeText]);

  // Gaze Animation Player
  useEffect(() => {
    if (!isPlayingGaze) return;

    if (activeGazeStep >= heatmapData.fixations.length) {
      setIsPlayingGaze(false);
      return;
    }

    const currentFixation = heatmapData.fixations[activeGazeStep];
    const timer = setTimeout(() => {
      setActiveGazeStep((prev) => prev + 1);
    }, currentFixation?.durationMs || 500);

    return () => clearTimeout(timer);
  }, [isPlayingGaze, activeGazeStep, heatmapData.fixations]);

  const handleStartGazeReplay = () => {
    setViewMode("gaze-path");
    setActiveGazeStep(0);
    setIsPlayingGaze(true);
  };

  const lines = useMemo(() => {
    return resumeText
      ? resumeText
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0)
      : [];
  }, [resumeText]);

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
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ef4444",
            }}
          >
            <Eye size={18} />
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
              Recruiter Eye-Tracking Heatmap Simulator
              <span
                style={{
                  fontSize: "10px",
                  fontFamily: "DM Mono, monospace",
                  background: "rgba(239, 68, 68, 0.15)",
                  color: "#ef4444",
                  padding: "2px 8px",
                  borderRadius: "99px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                6-sec scan
              </span>
            </h3>
            <p style={{ margin: "2px 0 0 0", fontSize: "11.5px", color: "var(--ink-muted)" }}>
              Simulates natural recruiter visual fixation hotspots and F-pattern reading flow.
            </p>
          </div>
        </div>

        {/* View mode toggle controls */}
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <button
            onClick={() => setViewMode("heatmap")}
            style={{
              background: viewMode === "heatmap" ? "var(--accent)" : "transparent",
              color: viewMode === "heatmap" ? "white" : "var(--ink-muted)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "6px 12px",
              fontSize: "11.5px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Flame size={13} /> Heatmap Layer
          </button>
          <button
            onClick={() => setViewMode("gaze-path")}
            style={{
              background: viewMode === "gaze-path" ? "var(--accent)" : "transparent",
              color: viewMode === "gaze-path" ? "white" : "var(--ink-muted)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "6px 12px",
              fontSize: "11.5px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Activity size={13} /> Gaze Sequence Path
          </button>
          <button
            onClick={handleStartGazeReplay}
            style={{
              background: "linear-gradient(135deg, #ef4444, #f59e0b)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "6px 14px",
              fontSize: "11.5px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 8px rgba(239, 68, 68, 0.25)",
            }}
          >
            {isPlayingGaze ? (
              <>
                <RotateCcw size={13} className="animate-spin" /> Replaying ({activeGazeStep + 1}/{heatmapData.fixations.length})
              </>
            ) : (
              <>
                <Play size={13} fill="currentColor" /> Play 6-Sec Scan Replay
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Main Grid ─────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "330px 1fr",
          background: "var(--paper)",
          minHeight: "560px",
        }}
      >
        {/* Left Side: Scannability Metrics & Blindspots */}
        <div
          style={{
            borderRight: "1px solid var(--border)",
            padding: "20px 18px",
            background: "var(--paper-card)",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            overflowY: "auto",
            maxHeight: "720px",
          }}
        >
          {/* Score Card Gauge */}
          <div
            style={{
              background: "var(--paper-warm)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "16px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                fontFamily: "DM Mono, monospace",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--ink-faint)",
                marginBottom: "6px",
              }}
            >
              6-Second Scannability Score
            </div>
            <div
              style={{
                fontSize: "36px",
                fontWeight: 800,
                color:
                  heatmapData.scannabilityScore >= 80
                    ? "#10b981"
                    : heatmapData.scannabilityScore >= 60
                    ? "#f59e0b"
                    : "#ef4444",
                fontFamily: "DM Mono, monospace",
                lineHeight: 1,
              }}
            >
              {heatmapData.scannabilityScore}
              <span style={{ fontSize: "16px", fontWeight: 600 }}>/100</span>
            </div>
            <p style={{ margin: "8px 0 0 0", fontSize: "11px", color: "var(--ink-muted)", lineHeight: 1.5 }}>
              {heatmapData.summary}
            </p>
          </div>

          {/* Sub-metrics breakdown */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px" }}>
              <span style={{ color: "var(--ink-muted)" }}>F-Pattern Readability</span>
              <span style={{ fontWeight: 700, fontFamily: "DM Mono, monospace", color: "var(--ink)" }}>
                {heatmapData.fPatternScore}%
              </span>
            </div>
            <div style={{ height: "6px", width: "100%", background: "var(--paper)", borderRadius: "99px", overflow: "hidden", border: "1px solid var(--border)" }}>
              <div
                style={{
                  height: "100%",
                  width: `${heatmapData.fPatternScore}%`,
                  background: "linear-gradient(90deg, #8b5cf6, #10b981)",
                  borderRadius: "99px",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", marginTop: "4px" }}>
              <span style={{ color: "var(--ink-muted)" }}>Quantified Metric Prominence</span>
              <span style={{ fontWeight: 700, fontFamily: "DM Mono, monospace", color: "var(--ink)" }}>
                {heatmapData.metricVisibilityScore}%
              </span>
            </div>
            <div style={{ height: "6px", width: "100%", background: "var(--paper)", borderRadius: "99px", overflow: "hidden", border: "1px solid var(--border)" }}>
              <div
                style={{
                  height: "100%",
                  width: `${heatmapData.metricVisibilityScore}%`,
                  background: "linear-gradient(90deg, #f59e0b, #ef4444)",
                  borderRadius: "99px",
                }}
              />
            </div>
          </div>

          <hr style={{ margin: "2px 0", border: "none", borderTop: "1px solid var(--border)" }} />

          {/* Top Attractors (Hotspots) */}
          <div>
            <div
              style={{
                fontSize: "10px",
                fontFamily: "DM Mono, monospace",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#10b981",
                fontWeight: 700,
                marginBottom: "8px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <CheckCircle2 size={12} /> Primary Eye Attractors
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {heatmapData.topAttractors.map((item, i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(16, 185, 129, 0.06)",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                    borderRadius: "8px",
                    padding: "8px 10px",
                  }}
                >
                  <div style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink)" }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: "10.5px", color: "var(--ink-muted)", marginTop: "2px", lineHeight: 1.4 }}>
                    {item.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Blind Spots & Fixation Risks */}
          {heatmapData.blindSpots.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: "10px",
                  fontFamily: "DM Mono, monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#ef4444",
                  fontWeight: 700,
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <AlertTriangle size={12} /> Low-Attention Blind Spots
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {heatmapData.blindSpots.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      background: "rgba(239, 68, 68, 0.06)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      borderRadius: "8px",
                      padding: "8px 10px",
                    }}
                  >
                    <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#ef4444" }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: "10.5px", color: "var(--ink-muted)", marginTop: "3px", lineHeight: 1.4 }}>
                      {item.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sensitivity Slider */}
          <div style={{ marginTop: "auto", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px", color: "var(--ink-muted)", marginBottom: "4px" }}>
              <span>Heatmap Radius</span>
              <span>{heatRadius}px</span>
            </div>
            <input
              type="range"
              min="30"
              max="90"
              value={heatRadius}
              onChange={(e) => setHeatRadius(Number(e.target.value))}
              style={{ width: "100%", cursor: "pointer" }}
            />
          </div>
        </div>

        {/* Right Side: Visual Canvas Resume Simulator */}
        <div
          style={{
            padding: "20px",
            background: "var(--paper-warm)",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Paper Sheet Preview Container */}
          <div
            style={{
              width: "100%",
              maxWidth: "680px",
              minHeight: "680px",
              background: "#ffffff",
              borderRadius: "12px",
              border: "1px solid var(--border)",
              boxShadow: "0 12px 36px rgba(0,0,0,0.06)",
              padding: "28px 32px",
              position: "relative",
              fontFamily: "DM Mono, monospace",
              fontSize: "11.5px",
              lineHeight: 1.8,
              color: "#1e293b",
              userSelect: "none",
              overflow: "hidden",
            }}
          >
            {/* Render Raw Resume Lines */}
            {lines.map((line, idx) => {
              const isHeader = idx === 0;
              const isSection = /^(EXPERIENCE|WORK EXPERIENCE|EDUCATION|PROJECTS|SKILLS|SUMMARY)/i.test(line);
              return (
                <div
                  key={idx}
                  style={{
                    fontWeight: isHeader ? 800 : isSection ? 700 : 400,
                    fontSize: isHeader ? "15px" : isSection ? "12.5px" : "11px",
                    color: isSection ? "var(--accent)" : "#1e293b",
                    marginTop: isSection ? "12px" : "2px",
                    borderBottom: isSection ? "1px solid var(--border)" : "none",
                    paddingBottom: isSection ? "2px" : "0",
                    letterSpacing: isHeader ? "-0.02em" : "normal",
                  }}
                >
                  {line}
                </div>
              );
            })}

            {/* ── HEATMAP RADIAL OVERLAY LAYER ──────────────────── */}
            {viewMode === "heatmap" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  zIndex: 20,
                  mixBlendMode: "multiply",
                }}
              >
                {heatmapData.fixations.map((fix) => {
                  const r = heatRadius * fix.intensity;
                  return (
                    <div
                      key={fix.id}
                      style={{
                        position: "absolute",
                        left: `${fix.xPercent}%`,
                        top: `${fix.yPercent}%`,
                        width: `${r * 2}px`,
                        height: `${r * 2}px`,
                        transform: "translate(-50%, -50%)",
                        borderRadius: "50%",
                        background: `radial-gradient(circle, rgba(239, 68, 68, ${fix.intensity * 0.75}) 0%, rgba(245, 158, 11, ${fix.intensity * 0.5}) 40%, rgba(16, 185, 129, 0.15) 70%, transparent 100%)`,
                        filter: "blur(8px)",
                        transition: "all 0.3s ease",
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* ── GAZE SEQUENCE PATH SVG OVERLAY ────────────────── */}
            {viewMode === "gaze-path" && (
              <svg
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                  zIndex: 25,
                }}
              >
                {/* SVG Connecting Polyline */}
                {heatmapData.fixations.length > 1 && (
                  <polyline
                    points={heatmapData.fixations
                      .slice(0, isPlayingGaze ? activeGazeStep + 1 : heatmapData.fixations.length)
                      .map((f) => `${(f.xPercent / 100) * 650 + 20},${(f.yPercent / 100) * 650 + 20}`)
                      .join(" ")}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    strokeDasharray="5,5"
                    style={{ transition: "all 0.3s ease" }}
                  />
                )}

                {/* Fixation Numbered Badges */}
                {heatmapData.fixations.map((fix, idx) => {
                  const isVisible = !isPlayingGaze || idx <= activeGazeStep;
                  if (!isVisible) return null;

                  const x = (fix.xPercent / 100) * 620 + 25;
                  const y = (fix.yPercent / 100) * 620 + 25;
                  const isActive = isPlayingGaze && idx === activeGazeStep;

                  return (
                    <g key={fix.id} transform={`translate(${x}, ${y})`}>
                      {/* Pulse Circle */}
                      <circle
                        r={isActive ? "18" : "13"}
                        fill={isActive ? "#ef4444" : "#f59e0b"}
                        fillOpacity={isActive ? "0.9" : "0.75"}
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                      {/* Step Number */}
                      <text
                        x="0"
                        y="4"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="800"
                        fontFamily="DM Mono, monospace"
                      >
                        {fix.sequenceOrder}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}

            {/* Heatmap Legend Bar */}
            {showLegend && (
              <div
                style={{
                  position: "absolute",
                  bottom: "14px",
                  right: "16px",
                  background: "rgba(15, 23, 42, 0.85)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  color: "#ffffff",
                  fontSize: "10.5px",
                  fontFamily: "DM Mono, monospace",
                  zIndex: 30,
                }}
              >
                <span style={{ color: "#cbd5e1" }}>Scan Attention:</span>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} /> High (Hotspot)
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b" }} /> Medium
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }} /> Moderate
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
