"use client";

import { useMemo } from "react";

interface ScorePoint {
  score: number;
  label: string;
  date: Date;
}

interface Props {
  data: ScorePoint[];
}

export default function ScoreChart({ data }: Props) {
  const chartData = useMemo(() => {
    if (!data || data.length < 2) return null;

    // Sort chronologically
    const sorted = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());

    const scores = sorted.map((d) => d.score);
    const minScore = Math.max(0, Math.min(...scores) - 10);
    const maxScore = Math.min(100, Math.max(...scores) + 10);
    const range = maxScore - minScore || 50;

    const points = sorted.map((d, i) => ({
      x: i,
      y: d.score,
      label: d.label,
      fullDate: d.date,
    }));

    // Build SVG path
    const svgWidth = sorted.length * 80;
    const svgHeight = 200;
    const padding = { top: 20, right: 20, bottom: 40, left: 40 };
    const plotW = svgWidth - padding.left - padding.right;
    const plotH = svgHeight - padding.top - padding.bottom;

    const xScale = (i: number) => padding.left + (i / Math.max(sorted.length - 1, 1)) * plotW;
    const yScale = (v: number) => padding.top + plotH - ((v - minScore) / range) * plotH;

    const linePath = points
      .map((p, i) => `${i === 0 ? "M" : "L"}${xScale(p.x).toFixed(1)},${yScale(p.y).toFixed(1)}`)
      .join(" ");

    const areaPath = `${linePath} L${xScale(sorted.length - 1)},${padding.top + plotH} L${xScale(0)},${padding.top + plotH} Z`;

    const gridLines = [20, 40, 60, 80, 100].filter((v) => v >= minScore && v <= maxScore);

    return {
      sorted,
      points,
      svgWidth: Math.max(svgWidth, 320),
      svgHeight,
      yScale,
      xScale,
      linePath,
      areaPath,
      gridLines,
      minScore,
      maxScore,
    };
  }, [data]);

  if (!chartData) {
    return (
      <div
        style={{
          background: "var(--paper-card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "24px 20px",
          textAlign: "center",
          color: "var(--ink-muted)",
          fontSize: 13,
        }}
      >
        {data.length === 1
          ? "Run more analyses to see your score trend over time."
          : "Score history chart will appear here once you have multiple analyses."}
      </div>
    );
  }

  const lastScore = chartData.sorted[chartData.sorted.length - 1].score;
  const firstScore = chartData.sorted[0].score;
  const trend = lastScore - firstScore;
  const trendLabel = trend > 0 ? "↑" : trend < 0 ? "↓" : "—";
  const trendColor = trend > 0 ? "#2d6a4f" : trend < 0 ? "#7a2020" : "var(--ink-muted)";

  return (
    <div
      style={{
        background: "var(--paper-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "20px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontFamily: "DM Mono, monospace",
              color: "var(--ink-faint)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: 4,
            }}
          >
            Score Trend
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>
            {chartData.sorted.length} analyses over time
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontFamily: "DM Serif Display, serif",
              fontSize: 28,
              lineHeight: 1,
              color: "var(--ink)",
            }}
          >
            {lastScore}
          </div>
          <div
            style={{
              fontSize: 13,
              color: trendColor,
              fontWeight: 600,
              marginTop: 2,
            }}
          >
            {trendLabel} {Math.abs(trend).toFixed(0)} pts
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <svg
        viewBox={`0 0 ${chartData.svgWidth} ${chartData.svgHeight}`}
        style={{ width: "100%", height: "auto", maxHeight: 220 }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {chartData.gridLines.map((v) => {
          const y = chartData.yScale(v);
          return (
            <g key={v}>
              <line
                x1={chartData.xScale(0)}
                y1={y}
                x2={chartData.xScale(chartData.sorted.length - 1)}
                y2={y}
                stroke="var(--border)"
                strokeWidth={1}
              />
              <text
                x={chartData.xScale(0) - 6}
                y={y + 3}
                textAnchor="end"
                fill="var(--ink-faint)"
                fontSize={10}
                fontFamily="DM Mono, monospace"
              >
                {v}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path
          d={chartData.areaPath}
          fill="var(--accent)"
          opacity={0.08}
        />

        {/* Line */}
        <path
          d={chartData.linePath}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {chartData.points.map((p, i) => {
          const cx = chartData.xScale(p.x);
          const cy = chartData.yScale(p.y);
          const isLast = i === chartData.points.length - 1;
          return (
            <g key={i}>
              <circle
                cx={cx}
                cy={cy}
                r={isLast ? 6 : 4}
                fill={isLast ? "var(--accent)" : "var(--paper-card)"}
                stroke="var(--accent)"
                strokeWidth={2}
              />
              {isLast && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={10}
                  fill="var(--accent)"
                  opacity={0.15}
                />
              )}
            </g>
          );
        })}

        {/* X-axis labels (show first, last, and middle) */}
        {[0, Math.floor(chartData.sorted.length / 2), chartData.sorted.length - 1]
          .filter((i, idx, arr) => arr.indexOf(i) === idx)
          .map((i) => (
            <text
              key={i}
              x={chartData.xScale(i)}
              y={chartData.svgHeight - 8}
              textAnchor="middle"
              fill="var(--ink-faint)"
              fontSize={10}
              fontFamily="DM Mono, monospace"
            >
              {chartData.sorted[i].label}
            </text>
          ))}
      </svg>
    </div>
  );
}