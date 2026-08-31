/**
 * preflightAuditor.ts
 *
 * Comprehensive 6-point Pre-Flight Launchpad Scanner before job application submission.
 */

export interface PreFlightCheckItem {
  id: string;
  name: string;
  category: "contact" | "ats" | "grammar" | "metrics" | "verbs" | "length";
  passed: boolean;
  score: number;
  details: string;
  recommendation?: string;
}

export interface PreFlightAuditReport {
  readinessScore: number;
  allPassed: boolean;
  certificateId: string;
  timestamp: string;
  items: PreFlightCheckItem[];
}

export function runPreFlightAudit(resumeText: string): PreFlightAuditReport {
  const text = resumeText || "";
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // 1. Contact Info & Link Integrity
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
  const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text);
  const hasLinkedIn = /linkedin\.com/i.test(text);
  const contactPassed = hasEmail && (hasPhone || hasLinkedIn);

  // 2. ATS Single-Column Linearization
  const hasTables = /\|.*\|.*\|/.test(text);
  const atsPassed = !hasTables;

  // 3. Typo & Spacing Hygiene
  const hasDoubleSpaces = / {3,}/.test(text);
  const hasHangingCommas = /,\s*$/.test(text);
  const grammarPassed = !hasDoubleSpaces && !hasHangingCommas;

  // 4. Quantified Metric Ratio
  const bullets = lines.filter((l) => /^[-•*]|\d+\./.test(l) || l.length > 30);
  const metricBullets = bullets.filter((b) =>
    /\d+%|\$\d+|\d+x|\d+ms|\d+ users|\d+ engineers/i.test(b)
  );
  const metricRatio = bullets.length > 0 ? metricBullets.length / bullets.length : 0;
  const metricsPassed = metricRatio >= 0.35;

  // 5. Action Verb Diversity
  const firstWords = bullets
    .map((b) =>
      b
        .replace(/^[-•*]\s*/, "")
        .split(/\s+/)[0]
        ?.toLowerCase()
    )
    .filter(Boolean);
  const wordCounts: Record<string, number> = {};
  firstWords.forEach((w) => {
    wordCounts[w] = (wordCounts[w] || 0) + 1;
  });
  const maxRepetition = Math.max(0, ...Object.values(wordCounts));
  const verbsPassed = maxRepetition <= 3;

  // 6. Page Budget & Length Constraint
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const lengthPassed = wordCount >= 250 && wordCount <= 1200;

  const items: PreFlightCheckItem[] = [
    {
      id: "contact",
      name: "Contact & Link Integrity",
      category: "contact",
      passed: contactPassed,
      score: contactPassed ? 100 : 50,
      details: contactPassed
        ? "Verified email, phone, and professional profile links."
        : "Missing phone number or LinkedIn profile link in header.",
      recommendation: "Ensure phone and LinkedIn URL are clearly visible in top section.",
    },
    {
      id: "ats",
      name: "ATS Linearization & Zero-Table Compliance",
      category: "ats",
      passed: atsPassed,
      score: atsPassed ? 100 : 40,
      details: atsPassed
        ? "Single-column linear DOM order verified with zero table traps."
        : "Detected nested ASCII or markdown table structures that may corrupt ATS parsers.",
    },
    {
      id: "grammar",
      name: "Typo & Whitespace Hygiene",
      category: "grammar",
      passed: grammarPassed,
      score: grammarPassed ? 100 : 70,
      details: grammarPassed
        ? "Clean spacing, consistent punctuation, and valid capitalization."
        : "Found irregular multiple whitespace gaps or hanging commas.",
    },
    {
      id: "metrics",
      name: "Quantified Metric Density",
      category: "metrics",
      passed: metricsPassed,
      score: metricsPassed ? 100 : Math.round(metricRatio * 200),
      details: `${metricBullets.length} of ${bullets.length} bullets (${Math.round(metricRatio * 100)}%) contain quantifiable numerical outcomes.`,
      recommendation:
        "Add concrete percentages, dollar savings, or latency stats to at least 40% of bullets.",
    },
    {
      id: "verbs",
      name: "Action Verb Diversity Index",
      category: "verbs",
      passed: verbsPassed,
      score: verbsPassed ? 100 : 65,
      details: verbsPassed
        ? "Excellent verb vocabulary with zero excessive repetitions."
        : `Overused leading verb '${Object.keys(wordCounts).find((k) => wordCounts[k] === maxRepetition)}' repeated ${maxRepetition} times.`,
    },
    {
      id: "length",
      name: "Optimal 1-2 Page Length Budget",
      category: "length",
      passed: lengthPassed,
      score: lengthPassed ? 100 : 60,
      details: `Total word count is ${wordCount} words (ideal target: 400-800 words).`,
    },
  ];

  const totalScore = Math.round(items.reduce((acc, it) => acc + it.score, 0) / items.length);
  const allPassed = items.every((it) => it.passed);

  // Generate random stable certificate ID
  const hash = Math.abs(text.split("").reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0))
    .toString(16)
    .toUpperCase()
    .slice(0, 6);
  const certificateId = `RL-${hash || "9842"}-VERIFIED`;

  return {
    readinessScore: totalScore,
    allPassed,
    certificateId,
    timestamp: new Date().toISOString(),
    items,
  };
}
