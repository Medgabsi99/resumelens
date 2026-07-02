"use client";

import { useState, useMemo } from "react";

interface AnalysisItem {
  id: string;
  score: number;
  target_role: string | null;
  created_at: string;
}

export function useScoreChart(analyses: AnalysisItem[], formatDate: (d: string) => string) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [chartPeriod, setChartPeriod] = useState<5 | 10 | 0>(0);

  const scoreChartData = useMemo(() => {
    const allSorted = [...analyses].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const sorted = chartPeriod === 0 ? allSorted : allSorted.slice(-chartPeriod);
    if (sorted.length < 1) return null;

    const scores = sorted.map((d) => d.score);
    const minScore = Math.max(0, Math.min(...scores) - 12);
    const maxScore = Math.min(100, Math.max(...scores) + 12);
    const scoreRange = maxScore - minScore || 20;

    const svgW = 560;
    const svgH = 210;
    const padding = { top: 24, right: 28, bottom: 38, left: 38 };
    const plotW = svgW - padding.left - padding.right;
    const plotH = svgH - padding.top - padding.bottom;

    const xOf = (i: number) => padding.left + (i / Math.max(sorted.length - 1, 1)) * plotW;
    const yOf = (v: number) => padding.top + plotH - ((v - minScore) / scoreRange) * plotH;

    const points = sorted.map((item, i) => ({
      x: xOf(i),
      y: yOf(item.score),
      score: item.score,
      role: item.target_role || "General Review",
      date: formatDate(item.created_at),
    }));

    // Smooth cubic bezier path
    const smoothPath = points.reduce((d, p, i, arr) => {
      if (i === 0) return `M${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      const prev = arr[i - 1];
      const cpx = (prev.x + p.x) / 2;
      return `${d} C${cpx.toFixed(1)},${prev.y.toFixed(1)} ${cpx.toFixed(1)},${p.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }, "");

    const areaPath = points.length > 0
      ? `${smoothPath} L${points[points.length - 1].x.toFixed(1)},${(padding.top + plotH).toFixed(1)} L${points[0].x.toFixed(1)},${(padding.top + plotH).toFixed(1)} Z`
      : "";

    const milestones = [
      { value: 60, label: "Fair",  color: "#f59e0b" },
      { value: 80, label: "Good",  color: "#6366f1" },
      { value: 90, label: "Elite", color: "#10b981" },
    ].filter((m) => m.value >= minScore && m.value <= maxScore);

    const yGridValues = [20, 40, 60, 80, 100].filter((v) => v >= minScore && v <= maxScore);

    const bestIdx    = scores.indexOf(Math.max(...scores));
    const firstScore = sorted[0].score;
    const lastScore  = sorted[sorted.length - 1].score;
    const bestScore  = Math.max(...scores);
    const delta      = lastScore - firstScore;

    return {
      points, smoothPath, areaPath, milestones,
      minScore, maxScore, scoreRange, yGridValues,
      svgW, svgH, padding, plotW, plotH,
      sorted, bestIdx, firstScore, lastScore, bestScore, delta,
      xOf, yOf,
    };
  }, [analyses, chartPeriod, formatDate]);

  return { chartPeriod, setChartPeriod, hoveredPoint, setHoveredPoint, scoreChartData };
}
