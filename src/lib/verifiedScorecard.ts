/**
 * Verified Scorecard & Viral Share Engine Utilities
 */

export interface ScorecardVerificationData {
  id: string;
  score: number;
  targetRole: string;
  candidateName?: string;
  createdAt: string;
  percentile: number;
  tier: "Top 1%" | "Top 5%" | "Top 15%" | "Top 30%" | "Applicant";
}

/**
 * Calculates candidate percentile ranking based on ATS benchmark distribution.
 */
export function calculateScorePercentile(score: number): {
  percentile: number;
  tier: ScorecardVerificationData["tier"];
} {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));

  if (clamped >= 95) return { percentile: 99, tier: "Top 1%" };
  if (clamped >= 90) return { percentile: 95, tier: "Top 5%" };
  if (clamped >= 80) return { percentile: 85, tier: "Top 15%" };
  if (clamped >= 70) return { percentile: 70, tier: "Top 30%" };
  return { percentile: Math.max(10, clamped - 10), tier: "Applicant" };
}

/**
 * Generates an embeddable Markdown badge string for GitHub READMEs.
 */
export function generateBadgeMarkdown(score: number, verifyUrl: string): string {
  const color = score >= 85 ? "brightgreen" : score >= 70 ? "yellow" : "orange";
  return `[![ResumeLens ATS Score](https://img.shields.io/badge/ATS%20Score-${score}%2F100-${color}?style=for-the-badge&logo=googledocs&logoColor=white)](${verifyUrl})`;
}

/**
 * Generates an embeddable HTML badge for portfolio websites.
 */
export function generateBadgeHtml(score: number, verifyUrl: string): string {
  return `<a href="${verifyUrl}" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/badge/ResumeLens_Verified_ATS-${score}%2F100-10b981?style=flat-square" alt="Verified ATS Score" /></a>`;
}

/**
 * Formats viral LinkedIn share intent URL with pre-composed congratulatory copy.
 */
export function getLinkedInShareUrl(verifyUrl: string, score: number, role: string): string {
  const text = `Excited to share that my resume for ${role || "Software Engineer"} just scored ${score}/100 on @ResumeLens! Check out my verified scorecard:`;
  return `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(`${text}\n\n${verifyUrl}`)}`;
}

/**
 * Formats viral X / Twitter share intent URL.
 */
export function getTwitterShareUrl(verifyUrl: string, score: number, role: string): string {
  const text = `Just audited my resume for ${role || "Tech roles"} with ResumeLens and scored ${score}/100 ATS Match! 🚀 Check my verified scorecard:`;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(verifyUrl)}`;
}
