"use client";

import React, { useMemo } from "react";
import { FileText, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";

interface Props {
  resumeText: string;
  yearsOfExperience?: number;
}

interface PageMetrics {
  wordCount: number;
  estimatedPages: number;
  bulletCount: number;
  sentenceCount: number;
  avgWordsPerBullet: number;
  quantifiedBullets: number;
  quantificationRate: number;
  repeatedVerbs: { verb: string; count: number }[];
  employmentGaps: { start: string; end: string; months: number }[];
  sectionScores: { name: string; score: number; reason: string; icon: string }[];
  hardSkills: string[];
  softSkills: string[];
  pageStatus: "too-short" | "ideal" | "too-long" | "way-too-long";
  readabilityScore: number;
  grammarIssues: string[];
}

const SOFT_SKILL_KEYWORDS = new Set([
  "communication",
  "leadership",
  "teamwork",
  "collaboration",
  "problem-solving",
  "problem solving",
  "adaptability",
  "creativity",
  "critical thinking",
  "time management",
  "organization",
  "flexibility",
  "interpersonal",
  "detail-oriented",
  "self-motivated",
  "multitasking",
  "empathy",
  "conflict resolution",
  "decision making",
  "work ethic",
  "attention to detail",
  "analytical",
  "presentation",
  "negotiation",
  "mentoring",
  "coaching",
  "strategic thinking",
  "initiative",
  "proactive",
  "motivated",
]);

const STRONG_ACTION_VERBS = new Set([
  "achieved",
  "built",
  "created",
  "delivered",
  "designed",
  "developed",
  "drove",
  "engineered",
  "executed",
  "founded",
  "generated",
  "grew",
  "implemented",
  "improved",
  "increased",
  "launched",
  "led",
  "managed",
  "optimized",
  "produced",
  "reduced",
  "saved",
  "scaled",
  "shipped",
  "solved",
  "spearheaded",
  "streamlined",
  "transformed",
  "accelerated",
  "architected",
  "automated",
  "championed",
  "collaborated",
  "coordinated",
  "deployed",
  "established",
  "facilitated",
  "hired",
  "identified",
  "integrated",
  "mentored",
  "migrated",
  "negotiated",
  "overhauled",
  "pioneered",
  "redesigned",
  "refactored",
  "restructured",
  "standardized",
  "trained",
  "upgraded",
]);

const WEAK_VERBS = new Set([
  "worked",
  "helped",
  "assisted",
  "did",
  "made",
  "got",
  "used",
  "handled",
  "responsible",
  "responsible for",
  "tasked with",
  "involved in",
]);

function parseEmploymentGaps(text: string): { start: string; end: string; months: number }[] {
  const gaps: { start: string; end: string; months: number }[] = [];
  const monthNames = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];

  // Match date ranges like "Jan 2021 – Mar 2022", "2020 - 2022", "January 2021 - Present"
  const dateRangeRegex =
    /(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)?[\s,]*(\d{4})\s*[-–—to]+\s*(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)?[\s,]*(\d{4}|present|current|now)/gi;

  const matches: Array<{ start: Date; end: Date }> = [];
  let match;

  while ((match = dateRangeRegex.exec(text)) !== null) {
    const startYear = parseInt(match[1]);
    const endStr = match[2].toLowerCase();
    const endYear =
      endStr === "present" || endStr === "current" || endStr === "now"
        ? new Date().getFullYear()
        : parseInt(endStr);

    if (startYear > 1990 && startYear < 2030 && endYear >= startYear) {
      matches.push({
        start: new Date(startYear, 0),
        end: new Date(endYear, 11),
      });
    }
  }

  // Sort by start date
  matches.sort((a, b) => a.start.getTime() - b.start.getTime());

  // Find gaps between consecutive jobs
  for (let i = 1; i < matches.length; i++) {
    const prevEnd = matches[i - 1].end;
    const currStart = matches[i].start;
    const gapMonths = Math.round(
      (currStart.getTime() - prevEnd.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    if (gapMonths >= 4) {
      const prevYear = prevEnd.getFullYear();
      const currYear = currStart.getFullYear();
      gaps.push({
        start: `${prevYear}`,
        end: `${currYear}`,
        months: gapMonths,
      });
    }
  }

  return gaps.slice(0, 3); // Cap at 3 gaps shown
}

function detectSectionScores(
  text: string
): { name: string; score: number; reason: string; icon: string }[] {
  const lower = text.toLowerCase();
  const scores = [];

  // Contact info
  const hasEmail = /\b[\w.-]+@[\w.-]+\.\w{2,}\b/.test(text);
  const hasPhone = /(\+?[\d\s\-().]{10,}|\(\d{3}\)\s*\d{3}-\d{4})/.test(text);
  const hasLinkedIn = /linkedin\.com\/in\//i.test(text);
  const hasLocation = /\b(?:new york|san francisco|london|remote|[a-z]+,\s*[a-z]{2})\b/i.test(text);
  const contactScore = Math.round(
    (hasEmail ? 30 : 0) + (hasPhone ? 25 : 0) + (hasLinkedIn ? 25 : 0) + (hasLocation ? 20 : 0)
  );
  scores.push({
    name: "Contact",
    score: contactScore,
    reason: !hasLinkedIn ? "Add LinkedIn URL" : !hasPhone ? "Add phone number" : "Complete",
    icon: "📇",
  });

  // Summary / objective
  const hasSummary = /\b(summary|objective|profile|about)\b/i.test(text);
  const summaryMatch = text.match(/(?:summary|objective|profile)[:\s]*([^\n]{80,300})/i);
  const summaryLen = summaryMatch ? summaryMatch[1].length : 0;
  const summaryScore = !hasSummary ? 20 : summaryLen < 80 ? 45 : summaryLen > 300 ? 60 : 85;
  scores.push({
    name: "Summary",
    score: summaryScore,
    reason: !hasSummary
      ? "No summary section found"
      : summaryLen < 80
        ? "Too short — expand to 2-3 sentences"
        : summaryLen > 300
          ? "Too long — trim to 2-3 sentences"
          : "Good length",
    icon: "📝",
  });

  // Experience
  const bulletCount = (text.match(/^[\s]*[•\-\*◦▪→]\s+.+/gm) || []).length;
  const numbersInBullets = (text.match(/[•\-\*◦▪→][^•\-\*◦\n]*\d+[%$kK+x]/g) || []).length;
  const quantRate = bulletCount > 0 ? numbersInBullets / bulletCount : 0;
  const expScore = Math.round(
    (bulletCount >= 5 ? 40 : bulletCount * 8) +
      (quantRate > 0.5 ? 40 : quantRate * 80) +
      (/\b(experience|work history)\b/i.test(text) ? 20 : 0)
  );
  scores.push({
    name: "Experience",
    score: Math.min(expScore, 100),
    reason:
      quantRate < 0.3
        ? "Add metrics to bullets (%, $, #)"
        : bulletCount < 5
          ? "Add more bullet points"
          : "Strong experience section",
    icon: "💼",
  });

  // Skills
  const hasSkillsSection = /\b(skills|technologies|tools|expertise|competencies)\b/i.test(text);
  const skillLines = (text.match(/(?:skills?|technologies)[^\n]*\n([^\n]+\n?){1,5}/i) || [""])[0];
  const skillCount = (skillLines.match(/[,|•\n]/g) || []).length + 1;
  const skillScore = !hasSkillsSection ? 25 : skillCount < 5 ? 50 : skillCount > 20 ? 80 : 90;
  scores.push({
    name: "Skills",
    score: skillScore,
    reason: !hasSkillsSection
      ? "No skills section found"
      : skillCount < 5
        ? "List more skills"
        : "Good skills coverage",
    icon: "⚡",
  });

  // Education
  const hasEdu =
    /\b(education|university|college|degree|bachelor|master|phd|b\.?s\.?|m\.?s\.?)\b/i.test(text);
  const hasGPA = /\b(?:gpa|grade)\s*[:.]?\s*[34]\.\d/i.test(text);
  const eduScore = !hasEdu ? 20 : hasGPA ? 90 : 75;
  scores.push({
    name: "Education",
    score: eduScore,
    reason: !hasEdu
      ? "No education section found"
      : hasGPA
        ? "Education complete with GPA"
        : "Consider adding GPA if 3.5+",
    icon: "🎓",
  });

  return scores;
}

function classifySkills(text: string): { hard: string[]; soft: string[] } {
  const lower = text.toLowerCase();
  const hard: string[] = [];
  const soft: string[] = [];

  // Extract from skills section
  const skillsSection =
    lower.match(
      /(?:skills?|technologies?|tools?|expertise)[^\n]*\n([\s\S]{0,600}?)(?:\n\n|\n[A-Z])/i
    )?.[1] || "";

  // Common hard skill patterns: tech, frameworks, languages, tools
  const hardPatterns = [
    /\b(python|javascript|typescript|java|c\+\+|c#|ruby|go|rust|swift|kotlin|php|scala|r\b|matlab)\b/gi,
    /\b(react|angular|vue|next\.?js|node\.?js|express|django|flask|spring|rails|laravel)\b/gi,
    /\b(aws|azure|gcp|kubernetes|docker|terraform|ci\/cd|jenkins|git|linux)\b/gi,
    /\b(sql|mysql|postgresql|mongodb|redis|elasticsearch|dynamodb|cassandra)\b/gi,
    /\b(machine learning|deep learning|nlp|computer vision|data science|tableau|power bi)\b/gi,
    /\b(figma|sketch|adobe|photoshop|illustrator|after effects)\b/gi,
    /\b(excel|word|powerpoint|salesforce|jira|confluence|notion)\b/gi,
  ];

  const seenHard = new Set<string>();
  for (const pattern of hardPatterns) {
    let m;
    while ((m = pattern.exec(text)) !== null) {
      const skill = m[0].toLowerCase().trim();
      if (!seenHard.has(skill)) {
        seenHard.add(skill);
        hard.push(m[0]);
      }
    }
  }

  // Soft skills from predefined list
  const seenSoft = new Set<string>();
  for (const softSkill of SOFT_SKILL_KEYWORDS) {
    if (lower.includes(softSkill) && !seenSoft.has(softSkill)) {
      seenSoft.add(softSkill);
      soft.push(softSkill.charAt(0).toUpperCase() + softSkill.slice(1));
    }
  }

  return { hard: hard.slice(0, 20), soft: soft.slice(0, 10) };
}

export function analyzeResumeMetrics(text: string): PageMetrics {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  // ~450 words per page is standard for a resume (1-inch margins, 11pt font)
  const estimatedPages = Math.max(1, Math.round((wordCount / 450) * 10) / 10);

  const bullets = text.match(/^[\s]*[•\-\*◦▪→]\s+.+/gm) || [];
  const bulletCount = bullets.length;

  const sentenceCount = (text.match(/[.!?]+/g) || []).length;
  const avgWordsPerBullet =
    bulletCount > 0
      ? Math.round(bullets.reduce((sum, b) => sum + b.trim().split(/\s+/).length, 0) / bulletCount)
      : 0;

  // Quantification: bullets with numbers, %, $, k/K, x (multiplier)
  const quantifiedBullets = bullets.filter((b) =>
    /\d+[%$]?|\$[\d,]+|[\d.]+[kKxX]|\d{1,3}(?:,\d{3})+/.test(b)
  ).length;
  const quantificationRate =
    bulletCount > 0 ? Math.round((quantifiedBullets / bulletCount) * 100) : 0;

  // Repeated verbs
  const verbCounts: Record<string, number> = {};
  bullets.forEach((bullet) => {
    const firstWord = bullet
      .trim()
      .replace(/^[•\-\*◦▪→\s]+/, "")
      .split(/\s+/)[0]
      ?.toLowerCase();
    if (firstWord && firstWord.length > 3) {
      verbCounts[firstWord] = (verbCounts[firstWord] || 0) + 1;
    }
  });
  const repeatedVerbs = Object.entries(verbCounts)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([verb, count]) => ({ verb, count }));

  // Employment gaps
  const employmentGaps = parseEmploymentGaps(text);

  // Section scores
  const sectionScores = detectSectionScores(text);

  // Hard/soft skills
  const { hard: hardSkills, soft: softSkills } = classifySkills(text);

  // Page status
  let pageStatus: PageMetrics["pageStatus"];
  if (estimatedPages < 0.6) pageStatus = "too-short";
  else if (estimatedPages <= 1.2) pageStatus = "ideal";
  else if (estimatedPages <= 2.2) pageStatus = "too-long";
  else pageStatus = "way-too-long";

  // Simple readability (Flesch-Kincaid proxy)
  const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : wordCount;
  const longWords = words.filter((w) => w.length > 7).length;
  const readabilityScore = Math.min(
    100,
    Math.max(0, 100 - Math.round(avgSentenceLength * 0.8 + (longWords / wordCount) * 50))
  );

  // Basic grammar issues detection
  const grammarIssues: string[] = [];
  if (/\bi\b/.test(text)) grammarIssues.push('Avoid first-person pronouns ("I")');
  if (repeatedVerbs.length > 2)
    grammarIssues.push(
      `Repeated action verbs: ${repeatedVerbs
        .slice(0, 2)
        .map((v) => v.verb)
        .join(", ")}`
    );
  if (bulletCount > 0 && bullets.some((b) => b.trim().endsWith(".")))
    grammarIssues.push("Remove periods at the end of bullet points");
  const weakVerbMatches = bullets.filter((b) => {
    const first = b
      .trim()
      .replace(/^[•\-\*◦▪→\s]+/, "")
      .split(/\s+/)[0]
      ?.toLowerCase();
    return first && WEAK_VERBS.has(first);
  });
  if (weakVerbMatches.length > 0)
    grammarIssues.push(
      `${weakVerbMatches.length} weak verbs detected (e.g., "helped", "worked on")`
    );

  return {
    wordCount,
    estimatedPages,
    bulletCount,
    sentenceCount,
    avgWordsPerBullet,
    quantifiedBullets,
    quantificationRate,
    repeatedVerbs,
    employmentGaps,
    sectionScores,
    hardSkills,
    softSkills,
    pageStatus,
    readabilityScore,
    grammarIssues,
  };
}

/* ─── UI Component ──────────────────────────────────────────────────── */

interface CardProps {
  title: string;
  children: React.ReactNode;
}
function Card({ title, children }: CardProps) {
  return (
    <div
      style={{
        background: "var(--paper-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--ink-muted)",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function ScoreBar({
  label,
  score,
  reason,
  icon,
}: {
  label: string;
  score: number;
  reason: string;
  icon: string;
}) {
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--ink)",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <span>{icon}</span>
          {label}
        </span>
        <span style={{ fontSize: 12, fontWeight: 800, color }}>{score}/100</span>
      </div>
      <div style={{ height: 5, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${score}%`,
            background: color,
            borderRadius: 3,
            transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </div>
      <div style={{ fontSize: 10.5, color: "var(--ink-muted)", marginTop: 3 }}>{reason}</div>
    </div>
  );
}

export default function ResumeMetricsDashboard({ resumeText }: Props) {
  const metrics = useMemo(() => analyzeResumeMetrics(resumeText), [resumeText]);

  if (!resumeText || resumeText.length < 50) return null;

  const pageStatusConfig = {
    "too-short": {
      color: "#ef4444",
      label: "Too Short",
      icon: <AlertTriangle size={13} />,
      tip: "Aim for at least 400 words. Add more experience details and bullet points.",
    },
    ideal: {
      color: "#10b981",
      label: "Ideal Length",
      icon: <CheckCircle size={13} />,
      tip: "Perfect. Recruiters prefer 1-page resumes for < 10 years experience.",
    },
    "too-long": {
      color: "#f59e0b",
      label: "Slightly Long",
      icon: <AlertTriangle size={13} />,
      tip: "Consider trimming older roles. Recruiters spend 7 seconds on initial scan.",
    },
    "way-too-long": {
      color: "#ef4444",
      label: "Too Long",
      icon: <AlertTriangle size={13} />,
      tip: "Cut down to 1-2 pages. Remove roles older than 10 years and redundant bullets.",
    },
  };
  const ps = pageStatusConfig[metrics.pageStatus];

  const overallSectionScore = Math.round(
    metrics.sectionScores.reduce((s, c) => s + c.score, 0) / metrics.sectionScores.length
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Top metrics row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: 12,
        }}
      >
        {/* Word count / page length */}
        <div
          style={{
            background: "var(--paper-card)",
            border: `2px solid ${ps.color}20`,
            borderRadius: 12,
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: ps.color }}>
            {ps.icon}
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {ps.label}
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "var(--ink)", lineHeight: 1 }}>
            {metrics.estimatedPages.toFixed(1)}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>
            pages · {metrics.wordCount.toLocaleString()} words
          </div>
          <div style={{ fontSize: 10, color: ps.color, lineHeight: 1.4, marginTop: 2 }}>
            {ps.tip}
          </div>
        </div>

        {/* Quantification rate */}
        <div
          style={{
            background: "var(--paper-card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--ink-muted)",
            }}
          >
            Quantified
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              color:
                metrics.quantificationRate >= 50
                  ? "#10b981"
                  : metrics.quantificationRate >= 30
                    ? "#f59e0b"
                    : "#ef4444",
              lineHeight: 1,
            }}
          >
            {metrics.quantificationRate}%
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>
            {metrics.quantifiedBullets}/{metrics.bulletCount} bullets have numbers
          </div>
          <div
            style={{
              height: 4,
              background: "var(--border)",
              borderRadius: 2,
              marginTop: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${metrics.quantificationRate}%`,
                background:
                  metrics.quantificationRate >= 50
                    ? "#10b981"
                    : metrics.quantificationRate >= 30
                      ? "#f59e0b"
                      : "#ef4444",
                transition: "width 0.6s",
              }}
            />
          </div>
          <div style={{ fontSize: 10, color: "var(--ink-muted)" }}>Target: &gt;50%</div>
        </div>

        {/* Section health */}
        <div
          style={{
            background: "var(--paper-card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--ink-muted)",
            }}
          >
            Section Health
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              color:
                overallSectionScore >= 75
                  ? "#10b981"
                  : overallSectionScore >= 55
                    ? "#f59e0b"
                    : "#ef4444",
              lineHeight: 1,
            }}
          >
            {overallSectionScore}/100
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>avg across all sections</div>
          <div
            style={{
              height: 4,
              background: "var(--border)",
              borderRadius: 2,
              marginTop: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${overallSectionScore}%`,
                background:
                  overallSectionScore >= 75
                    ? "#10b981"
                    : overallSectionScore >= 55
                      ? "#f59e0b"
                      : "#ef4444",
                transition: "width 0.6s",
              }}
            />
          </div>
        </div>

        {/* Benchmarking */}
        <div
          style={{
            background: "var(--paper-card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--ink-muted)",
            }}
          >
            Bullets
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "var(--ink)", lineHeight: 1 }}>
            {metrics.bulletCount}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>
            {metrics.avgWordsPerBullet} avg words each
          </div>
          <div
            style={{
              fontSize: 10,
              color: metrics.avgWordsPerBullet > 20 ? "#f59e0b" : "#10b981",
              marginTop: 2,
            }}
          >
            {metrics.avgWordsPerBullet > 20 ? "Trim bullets to ~15 words" : "Good bullet length ✓"}
          </div>
        </div>
      </div>

      {/* Section-by-Section Scoring */}
      <Card title="Section-by-Section Scoring">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {metrics.sectionScores.map((s) => (
            <ScoreBar key={s.name} label={s.name} score={s.score} reason={s.reason} icon={s.icon} />
          ))}
        </div>
      </Card>

      {/* Two-column: Skills + Issues */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Skills Classification */}
        <Card title="Skills Classified">
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#6366f1", marginBottom: 5 }}>
              ⚡ Hard Skills ({metrics.hardSkills.length})
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
              {metrics.hardSkills.length > 0 ? (
                metrics.hardSkills.map((s, i) => (
                  <span
                    key={i}
                    style={{
                      background: "#ede9fe",
                      color: "#4c1d95",
                      border: "1px solid #ddd6fe",
                      borderRadius: 5,
                      padding: "2px 7px",
                      fontSize: 9.5,
                      fontWeight: 600,
                    }}
                  >
                    {s}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: 11, color: "var(--ink-muted)" }}>None detected</span>
              )}
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#059669", marginBottom: 5 }}>
              🤝 Soft Skills ({metrics.softSkills.length})
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {metrics.softSkills.length > 0 ? (
                metrics.softSkills.map((s, i) => (
                  <span
                    key={i}
                    style={{
                      background: "#d1fae5",
                      color: "#065f46",
                      border: "1px solid #a7f3d0",
                      borderRadius: 5,
                      padding: "2px 7px",
                      fontSize: 9.5,
                      fontWeight: 600,
                    }}
                  >
                    {s}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: 11, color: "var(--ink-muted)" }}>None detected</span>
              )}
            </div>
          </div>
        </Card>

        {/* Issues found */}
        <Card title="Quality Issues">
          {metrics.grammarIssues.length === 0 &&
          metrics.repeatedVerbs.length === 0 &&
          metrics.employmentGaps.length === 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                color: "#10b981",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <CheckCircle size={15} /> No major issues found!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {metrics.grammarIssues.map((issue, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 6,
                    fontSize: 11,
                    color: "var(--ink)",
                  }}
                >
                  <span style={{ color: "#f59e0b", marginTop: 1 }}>⚠️</span>
                  <span>{issue}</span>
                </div>
              ))}
              {metrics.repeatedVerbs.length > 1 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 6,
                    fontSize: 11,
                    color: "var(--ink)",
                  }}
                >
                  <span style={{ color: "#f59e0b", marginTop: 1 }}>⚠️</span>
                  <span>
                    Repeated verbs:{" "}
                    {metrics.repeatedVerbs.map((v) => `"${v.verb}" (${v.count}x)`).join(", ")}
                  </span>
                </div>
              )}
              {metrics.employmentGaps.map((gap, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 6,
                    fontSize: 11,
                    color: "var(--ink)",
                  }}
                >
                  <span style={{ color: "#ef4444", marginTop: 1 }}>🔴</span>
                  <span>
                    Employment gap detected: {gap.start}–{gap.end} (~{gap.months} months). Prepare
                    an explanation.
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
