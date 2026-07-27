export type SeniorityLevel = "junior" | "mid" | "senior" | "staff";

export interface RadarAxis {
  key: string;
  label: string;
  score: number;       // Candidate score 0-100
  targetScore: number; // Target level benchmark 0-100
  description: string;
  advice: string;
}

export interface SkillRadarAnalysis {
  axes: RadarAxis[];
  overallFitScore: number; // 0-100
  selectedLevel: SeniorityLevel;
  strengths: string[];
  keyGaps: string[];
  levelAdvancementTips: string[];
}

export const SENIORITY_LABELS: Record<SeniorityLevel, { name: string; subtitle: string }> = {
  junior: { name: "Junior / Entry", subtitle: "Focus: Tool fluency, task execution & syntax" },
  mid: { name: "Mid-Level", subtitle: "Focus: Independent feature delivery & code quality" },
  senior: { name: "Senior", subtitle: "Focus: System design, quantified metrics & mentoring" },
  staff: { name: "Lead / Staff", subtitle: "Focus: Multi-team strategy, architecture & business impact" },
};

// Target benchmarks by level across 6 axes:
// [Tech Depth, Leadership, Architecture, Business Impact, Execution, Domain Strategy]
const BENCHMARKS: Record<SeniorityLevel, number[]> = {
  junior: [65, 35, 35, 40, 60, 45],
  mid: [80, 55, 60, 65, 75, 65],
  senior: [90, 80, 85, 85, 88, 85],
  staff: [95, 95, 95, 95, 95, 95],
};

export function calculateSkillRadarData(
  resumeText: string,
  selectedLevel: SeniorityLevel = "senior"
): SkillRadarAnalysis {
  if (!resumeText || !resumeText.trim()) {
    const defaultTargets = BENCHMARKS[selectedLevel];
    return {
      axes: [
        { key: "tech", label: "Tech Stack Depth", score: 50, targetScore: defaultTargets[0], description: "Languages, tools & frameworks", advice: "Add specific frameworks and technical libraries used." },
        { key: "leadership", label: "Leadership & Mentorship", score: 40, targetScore: defaultTargets[1], description: "Initiative & guiding peers", advice: "Highlight mentorship, code reviews, or team lead roles." },
        { key: "arch", label: "Architecture & Scale", score: 45, targetScore: defaultTargets[2], description: "System design & infrastructure", advice: "Mention cloud services, database scaling, or API design." },
        { key: "impact", label: "Business & Metrics Impact", score: 45, targetScore: defaultTargets[3], description: "Quantified results ($, %, speed)", advice: "Add numbers (e.g., 'reduced latency by 40%')." },
        { key: "execution", label: "Agile & Delivery Speed", score: 55, targetScore: defaultTargets[4], description: "Testing, CI/CD & shipping code", advice: "Include deployment pipelines and testing frameworks." },
        { key: "strategy", label: "Domain Strategy", score: 45, targetScore: defaultTargets[5], description: "Product vision & alignment", advice: "Demonstrate cross-functional collaboration with PMs/Design." },
      ],
      overallFitScore: 45,
      selectedLevel,
      strengths: ["Core Technical Foundation"],
      keyGaps: ["Quantified Business Impact", "System Architecture"],
      levelAdvancementTips: ["Add metrics to bullet points", "Highlight system scale"],
    };
  }

  const text = resumeText.toLowerCase();

  // 1. Tech Stack Depth
  const techKeywords = ["react", "node", "typescript", "python", "java", "golang", "c++", "postgres", "mongodb", "graphql", "docker", "kubernetes", "aws", "gcp", "azure", "git", "redis", "kafka", "rest"];
  const techMatches = techKeywords.filter((kw) => text.includes(kw)).length;
  const techScore = Math.min(98, Math.max(40, Math.round(techMatches * 7.5 + 40)));

  // 2. Leadership & Mentorship
  const leadKeywords = ["led", "lead", "mentored", "managed", "directed", "spearheaded", "championed", "coached", "hired", "conducted interviews", "cross-functional", "ownership"];
  const leadMatches = leadKeywords.filter((kw) => text.includes(kw)).length;
  const leadScore = Math.min(98, Math.max(25, Math.round(leadMatches * 10 + 30)));

  // 3. Architecture & Systems Scale
  const archKeywords = ["microservices", "scalable", "architecture", "distributed", "high-availability", "latency", "throughput", "infrastructure", "ci/cd", "terraform", "serverless", "database optimization", "security"];
  const archMatches = archKeywords.filter((kw) => text.includes(kw)).length;
  const archScore = Math.min(98, Math.max(30, Math.round(archMatches * 9.5 + 32)));

  // 4. Business & Quantified Impact
  const metricMatches = (text.match(/(\$\d+|\d+%|\d+x|\b\d+\s*users|\b\d+\s*clients|increased|reduced|saved|improved|grew)/g) || []).length;
  const impactScore = Math.min(98, Math.max(25, Math.round(metricMatches * 7 + 28)));

  // 5. Agile Execution & Delivery
  const execKeywords = ["shipped", "deployed", "automated", "testing", "unit tests", "integration tests", "scrum", "sprints", "delivered", "maintained", "refactored", "optimized"];
  const execMatches = execKeywords.filter((kw) => text.includes(kw)).length;
  const execScore = Math.min(98, Math.max(45, Math.round(execMatches * 8 + 38)));

  // 6. Domain Strategy & Alignment
  const stratKeywords = ["roadmap", "strategy", "stakeholders", "product requirements", "compliance", "vision", "user feedback", "conversion", "retention", "sla", "kpi"];
  const stratMatches = stratKeywords.filter((kw) => text.includes(kw)).length;
  const stratScore = Math.min(98, Math.max(30, Math.round(stratMatches * 11 + 30)));

  const target = BENCHMARKS[selectedLevel];

  const candidateScores = [techScore, leadScore, archScore, impactScore, execScore, stratScore];

  const axes: RadarAxis[] = [
    {
      key: "tech",
      label: "Tech Stack Depth",
      score: techScore,
      targetScore: target[0],
      description: "Fluency across modern frameworks, languages & cloud tools",
      advice: techScore < target[0] ? "Add 2-3 specific backend/infrastructure frameworks to demonstrate full-stack depth." : "Strong tech stack representation!",
    },
    {
      key: "leadership",
      label: "Leadership & Mentorship",
      score: leadScore,
      targetScore: target[1],
      description: "Guiding team members, leading projects & driving decisions",
      advice: leadScore < target[1] ? "Include bullet points showing where you led features, mentored junior devs, or drove team initiatives." : "Great leadership presence!",
    },
    {
      key: "arch",
      label: "Architecture & Scale",
      score: archScore,
      targetScore: target[2],
      description: "System design, microservices, cloud infrastructure & reliability",
      advice: archScore < target[2] ? "Highlight system design terms like microservices, caching, CI/CD pipelines, or database optimization." : "Solid architectural representation!",
    },
    {
      key: "impact",
      label: "Business & Metrics Impact",
      score: impactScore,
      targetScore: target[3],
      description: "Quantified results (revenue, %, speedups, cost reduction)",
      advice: impactScore < target[3] ? "Add numbers to your bullets (e.g. 'boosted performance by 35%', 'reduced costs by $20k')." : "Exceptional metric density!",
    },
    {
      key: "execution",
      label: "Agile & Delivery Speed",
      score: execScore,
      targetScore: target[4],
      description: "Shipping features reliably, automated testing & CI/CD",
      advice: execScore < target[4] ? "Mention automated testing, release pipelines, and fast feature delivery cycles." : "High execution score!",
    },
    {
      key: "strategy",
      label: "Domain Strategy",
      score: stratScore,
      targetScore: target[5],
      description: "Product vision, stakeholder alignment & business goals",
      advice: stratScore < target[5] ? "Show how your technical work directly impacted product KPIs and user experience." : "Strong business strategy alignment!",
    },
  ];

  // Calculate Overall Fit Score
  let fitSum = 0;
  axes.forEach((axis) => {
    const ratio = Math.min(1.1, axis.score / Math.max(axis.targetScore, 1));
    fitSum += ratio;
  });
  const overallFitScore = Math.min(100, Math.round((fitSum / 6) * 90));

  // Identify Strengths & Key Gaps
  const strengths: string[] = [];
  const keyGaps: string[] = [];
  const levelAdvancementTips: string[] = [];

  axes.forEach((axis) => {
    if (axis.score >= axis.targetScore) {
      strengths.push(axis.label);
    } else {
      keyGaps.push(axis.label);
      levelAdvancementTips.push(axis.advice);
    }
  });

  return {
    axes,
    overallFitScore,
    selectedLevel,
    strengths: strengths.slice(0, 3),
    keyGaps: keyGaps.slice(0, 3),
    levelAdvancementTips: levelAdvancementTips.slice(0, 3),
  };
}
