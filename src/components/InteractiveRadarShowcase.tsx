"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Sparkles,
  TrendingUp,
  Award,
  Layers,
  CheckCircle2,
  AlertCircle,
  Zap,
  Flame,
} from "lucide-react";
import SpotlightCard from "./SpotlightCard";

export type Seniority = "junior" | "mid" | "senior" | "staff";

interface CompetencyData {
  name: string;
  key: string;
  icon: string;
  juniorScore: number;
  midScore: number;
  seniorScore: number;
  staffScore: number;
  targetBenchmark: number;
  keywords: string[];
  feedback: string;
}

const COMPETENCIES: CompetencyData[] = [
  {
    name: "System Architecture",
    key: "arch",
    icon: "🏛️",
    juniorScore: 45,
    midScore: 68,
    seniorScore: 92,
    staffScore: 98,
    targetBenchmark: 85,
    keywords: ["Microservices", "Kafka", "PostgreSQL", "Scalability", "p99 Latency"],
    feedback: "High-throughput distributed systems & event-driven design signals present.",
  },
  {
    name: "Technical Depth",
    key: "tech",
    icon: "⚡",
    juniorScore: 60,
    midScore: 78,
    seniorScore: 95,
    staffScore: 99,
    targetBenchmark: 90,
    keywords: ["TypeScript", "Next.js", "Python", "Docker", "pgvector"],
    feedback: "Exceptional language fluency and modern framework mastery.",
  },
  {
    name: "Execution & Speed",
    key: "exec",
    icon: "🚀",
    juniorScore: 55,
    midScore: 75,
    seniorScore: 90,
    staffScore: 96,
    targetBenchmark: 80,
    keywords: ["CI/CD", "Automated Testing", "GitHub Actions", "Zero-Downtime"],
    feedback: "Rapid delivery cadence backed by automated testing and CI/CD pipelines.",
  },
  {
    name: "Code Quality",
    key: "quality",
    icon: "🛡️",
    juniorScore: 50,
    midScore: 70,
    seniorScore: 88,
    staffScore: 94,
    targetBenchmark: 85,
    keywords: ["Unit Tests", "E2E", "Code Reviews", "Refactoring", "Clean Architecture"],
    feedback: "Robust test coverage, strict type-safety, and maintainable abstractions.",
  },
  {
    name: "Product Thinking",
    key: "product",
    icon: "🎯",
    juniorScore: 40,
    midScore: 65,
    seniorScore: 86,
    staffScore: 95,
    targetBenchmark: 75,
    keywords: ["A/B Testing", "Conversion Rate", "User Telemetry", "User Retention"],
    feedback: "Strong orientation toward business metrics, revenue, and UX outcomes.",
  },
  {
    name: "Leadership & Mentorship",
    key: "lead",
    icon: "👑",
    juniorScore: 30,
    midScore: 55,
    seniorScore: 85,
    staffScore: 97,
    targetBenchmark: 80,
    keywords: ["Team Mentorship", "Hiring", "RFC Documents", "Tech Strategy"],
    feedback:
      "Demonstrated track record of leveling up peers and establishing engineering culture.",
  },
];

const SENIORITY_META = {
  junior: { label: "Junior / Entry", targetScore: 50, badge: "Foundational" },
  mid: { label: "Mid-Level", targetScore: 70, badge: "Core Contributor" },
  senior: { label: "Senior Engineer", targetScore: 88, badge: "High Impact" },
  staff: { label: "Staff / Principal", targetScore: 96, badge: "Industry Leader" },
};

// SVG Settings
const SIZE = 360;
const CENTER = SIZE / 2;
const RADIUS = 120;
const NUM_AXES = 6;
const ANGLE_STEP = (2 * Math.PI) / NUM_AXES;

function getCoords(index: number, score: number) {
  const angle = index * ANGLE_STEP - Math.PI / 2;
  const r = (score / 100) * RADIUS;
  const x = CENTER + r * Math.cos(angle);
  const y = CENTER + r * Math.sin(angle);
  return { x, y };
}

export default function InteractiveRadarShowcase() {
  const [level, setLevel] = useState<Seniority>("senior");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(0);

  const activeMeta = SENIORITY_META[level];

  // Calculate coordinates for Candidate polygon and Target polygon
  const candidateScores = useMemo(() => {
    return COMPETENCIES.map((c) => {
      switch (level) {
        case "junior":
          return c.juniorScore;
        case "mid":
          return c.midScore;
        case "senior":
          return c.seniorScore;
        case "staff":
          return c.staffScore;
      }
    });
  }, [level]);

  const candidatePoints = useMemo(() => {
    return candidateScores
      .map((score, i) => {
        const { x, y } = getCoords(i, score);
        return `${x},${y}`;
      })
      .join(" ");
  }, [candidateScores]);

  const benchmarkPoints = useMemo(() => {
    return COMPETENCIES.map((c, i) => {
      const { x, y } = getCoords(i, c.targetBenchmark);
      return `${x},${y}`;
    }).join(" ");
  }, []);

  const overallScore = Math.round(
    candidateScores.reduce((a, b) => a + b, 0) / candidateScores.length
  );

  const activeComp = hoveredIndex !== null ? COMPETENCIES[hoveredIndex] : COMPETENCIES[0];
  const activeScore = candidateScores[hoveredIndex ?? 0];

  return (
    <div className="w-full my-12">
      <SpotlightCard
        className="specular-border p-6 sm:p-10 max-w-5xl mx-auto"
        specularBorder={true}
      >
        {/* Top Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-accent/10 text-accent border border-accent/20 mb-3">
            <Compass
              size={13}
              className="text-accent animate-spin"
              style={{ animationDuration: "12s" }}
            />
            <span>Interactive 6-Axis Competency Radar</span>
          </div>
          <h3 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            How Top Tech Companies Evaluate{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-indigo-500 italic">
              Your Experience
            </span>
          </h3>
          <p className="text-ink-muted text-xs sm:text-sm mt-1">
            Toggle seniority benchmarks to see how your skills map against FAANG & Tier-1 hiring
            bars.
          </p>

          {/* Level Switcher Buttons */}
          <div className="flex items-center justify-center gap-2 flex-wrap mt-5">
            {(Object.keys(SENIORITY_META) as Seniority[]).map((lvl) => {
              const isSelected = level === lvl;
              const meta = SENIORITY_META[lvl];
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 border ${
                    isSelected
                      ? "bg-accent text-white border-accent shadow-sm shadow-accent/20 scale-[1.02]"
                      : "bg-paper-warm text-ink-muted hover:text-ink border-border"
                  }`}
                >
                  <span>{meta.label}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                      isSelected ? "bg-white/20 text-white" : "bg-accent/10 text-accent"
                    }`}
                  >
                    {meta.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Grid: Left = SVG Radar, Right = Detailed Dimension Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* LEFT: SVG Radar Chart */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center relative">
            {/* Background Halo */}
            <div className="absolute inset-0 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative">
              <svg width={SIZE} height={SIZE} className="overflow-visible select-none">
                <defs>
                  {/* Radar Fill Gradient */}
                  <linearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.25" />
                  </linearGradient>
                </defs>

                {/* Concentric Grid Rings */}
                {[20, 40, 60, 80, 100].map((ringScore) => {
                  const points = COMPETENCIES.map((_, i) => {
                    const { x, y } = getCoords(i, ringScore);
                    return `${x},${y}`;
                  }).join(" ");
                  return (
                    <polygon
                      key={ringScore}
                      points={points}
                      fill="none"
                      stroke="var(--border)"
                      strokeWidth={ringScore === 100 ? "1.5" : "1"}
                      strokeDasharray={ringScore === 100 ? "none" : "3,3"}
                      opacity={ringScore === 100 ? "0.8" : "0.5"}
                    />
                  );
                })}

                {/* Spoke Axis Lines */}
                {COMPETENCIES.map((_, i) => {
                  const { x, y } = getCoords(i, 100);
                  return (
                    <line
                      key={i}
                      x1={CENTER}
                      y1={CENTER}
                      x2={x}
                      y2={y}
                      stroke="var(--border-strong)"
                      strokeWidth="1"
                      opacity="0.4"
                    />
                  );
                })}

                {/* Target Benchmark Polygon */}
                <polygon
                  points={benchmarkPoints}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                  opacity="0.6"
                />

                {/* Candidate Filled Polygon (Animated) */}
                <polygon
                  points={candidatePoints}
                  fill="url(#radarFill)"
                  stroke="var(--accent)"
                  strokeWidth="2.5"
                  className="transition-all duration-500 ease-out"
                  style={{
                    filter: "drop-shadow(0 0 12px var(--brand-glow))",
                  }}
                />

                {/* Axis Vertices Points */}
                {COMPETENCIES.map((comp, i) => {
                  const score = candidateScores[i];
                  const { x, y } = getCoords(i, score);
                  const isHovered = hoveredIndex === i;

                  return (
                    <g
                      key={comp.key}
                      onClick={() => setHoveredIndex(i)}
                      onMouseEnter={() => setHoveredIndex(i)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={x}
                        cy={y}
                        r={isHovered ? 8 : 5}
                        fill={isHovered ? "#ffffff" : "var(--accent)"}
                        stroke="var(--accent)"
                        strokeWidth={isHovered ? 3 : 2}
                        className="transition-all duration-200"
                        style={{
                          filter: isHovered ? "drop-shadow(0 0 8px var(--accent))" : undefined,
                        }}
                      />
                    </g>
                  );
                })}

                {/* Axis Labels */}
                {COMPETENCIES.map((comp, i) => {
                  const { x, y } = getCoords(i, 122);
                  const isHovered = hoveredIndex === i;

                  return (
                    <text
                      key={comp.key}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      onClick={() => setHoveredIndex(i)}
                      className={`font-mono text-[10px] font-bold cursor-pointer transition-colors duration-200 ${
                        isHovered ? "fill-accent font-extrabold" : "fill-ink-muted hover:fill-ink"
                      }`}
                    >
                      {comp.icon} {comp.name}
                    </text>
                  );
                })}
              </svg>
            </div>

            {/* Legend Below Chart */}
            <div className="flex items-center gap-6 mt-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-accent inline-block shadow-sm" />
                <span className="text-ink font-semibold">Your Profile ({overallScore}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t border-dashed border-slate-400 inline-block" />
                <span className="text-ink-muted font-medium">
                  Hiring Benchmark ({activeMeta.targetScore}%)
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: Detailed Dimension Breakdown */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeComp.key + level}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-paper-warm/60 border border-border rounded-2xl p-6 flex flex-col justify-between h-full"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-3 mb-4 pb-4 border-b border-border">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{activeComp.icon}</span>
                      <div>
                        <div className="text-xs font-mono font-bold uppercase text-accent tracking-wider">
                          Competency Axis
                        </div>
                        <h4 className="text-base font-bold text-ink">{activeComp.name}</h4>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-mono font-bold text-accent">
                        {activeScore}
                        <span className="text-xs text-ink-muted">/100</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-500 font-semibold">
                        {activeScore >= activeComp.targetBenchmark
                          ? "✓ Target Met"
                          : "⚠️ Needs Boost"}
                      </span>
                    </div>
                  </div>

                  {/* Feedback Narrative */}
                  <p className="text-xs sm:text-sm text-ink-muted leading-relaxed mb-5">
                    {activeComp.feedback}
                  </p>

                  {/* Key Signals Detected */}
                  <div className="mb-5">
                    <div className="text-[11px] font-mono font-bold text-ink-muted uppercase mb-2">
                      High-Yield Keywords Detected:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeComp.keywords.map((kw) => (
                        <span
                          key={kw}
                          className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-paper-card text-ink font-semibold border border-border shadow-xs"
                        >
                          ✓ {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Score vs Target Progress Bar */}
                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between text-xs font-mono mb-1.5">
                    <span className="text-ink-muted">Target Benchmark:</span>
                    <span className="font-bold text-ink">{activeComp.targetBenchmark}%</span>
                  </div>
                  <div className="w-full h-2 bg-paper-card rounded-full overflow-hidden border border-border">
                    <div
                      className="h-full bg-gradient-to-r from-accent to-emerald-500 transition-all duration-500 rounded-full"
                      style={{ width: `${activeScore}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </SpotlightCard>
    </div>
  );
}
