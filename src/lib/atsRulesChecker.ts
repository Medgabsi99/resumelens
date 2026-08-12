/**
 * Deterministic ATS Rules Checker
 * 20 specific pass/fail/warn checks — no AI, instant, reproducible.
 * Rivals Jobscan's per-criterion scoring with actionable fix guidance.
 */

export type AtsCheckStatus = "pass" | "fail" | "warn";
export type AtsCheckCategory = "contact" | "structure" | "content" | "keywords" | "formatting";

export interface AtsCheck {
  id: string;
  category: AtsCheckCategory;
  label: string;
  status: AtsCheckStatus;
  detail: string; // What was found
  fix?: string; // Actionable fix if warn/fail
  score: number; // 0–10 weight for this check
}

export interface AtsRulesResult {
  checks: AtsCheck[];
  passCount: number;
  warnCount: number;
  failCount: number;
  /** 0–100 deterministic sub-score based on weighted check results */
  deterministicScore: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STRONG_ACTION_VERBS = [
  "achieved",
  "architected",
  "automated",
  "built",
  "championed",
  "created",
  "delivered",
  "designed",
  "developed",
  "deployed",
  "drove",
  "eliminated",
  "engineered",
  "enhanced",
  "established",
  "executed",
  "generated",
  "grew",
  "implemented",
  "improved",
  "increased",
  "launched",
  "led",
  "managed",
  "mentored",
  "migrated",
  "modernized",
  "optimized",
  "owned",
  "reduced",
  "refactored",
  "scaled",
  "shipped",
  "spearheaded",
  "streamlined",
  "transformed",
];

const WEAK_VERBS = [
  "helped",
  "assisted",
  "responsible",
  "worked",
  "participated",
  "involved",
  "contributed",
  "supported",
  "handled",
  "used",
  "utilized",
  "made",
];

const STANDARD_SECTIONS = [
  /\b(experience|work history|employment|professional experience)\b/i,
  /\b(education|academic background|qualifications)\b/i,
  /\b(skills|technical skills|core competencies|expertise)\b/i,
];

const OPTIONAL_SECTIONS = [
  /\b(summary|profile|objective|about me)\b/i,
  /\b(certifications?|licenses?|credentials)\b/i,
  /\b(projects?|portfolio|notable projects)\b/i,
];

function countMatches(text: string, patterns: RegExp[]): number {
  return patterns.filter((p) => p.test(text)).length;
}

function extractBullets(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^[-•*▪►]\s/.test(l) || /^\d+\.\s/.test(l));
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ─── Main Checker ─────────────────────────────────────────────────────────────

export function runAtsChecks(resumeText: string, jobDescription?: string): AtsRulesResult {
  const text = resumeText || "";
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const bullets = extractBullets(text);
  const wc = wordCount(text);
  const checks: AtsCheck[] = [];

  // ── CONTACT CATEGORY ────────────────────────────────────────────────────────

  // 1. Email present
  const hasEmail = /[\w.+-]+@[\w.-]+\.\w{2,}/i.test(text);
  checks.push({
    id: "contact_email",
    category: "contact",
    label: "Email Address",
    status: hasEmail ? "pass" : "fail",
    detail: hasEmail ? "Email found in resume" : "No email address detected",
    fix: hasEmail
      ? undefined
      : "Add a professional email address (e.g. john.doe@gmail.com) to your contact section.",
    score: 8,
  });

  // 2. Phone number present
  const hasPhone = /[\+]?[\d][\d\s\-().]{6,}[\d]/.test(text);
  checks.push({
    id: "contact_phone",
    category: "contact",
    label: "Phone Number",
    status: hasPhone ? "pass" : "fail",
    detail: hasPhone ? "Phone number found" : "No phone number detected",
    fix: hasPhone ? undefined : "Add a phone number in your contact header (e.g. +1 555 123 4567).",
    score: 7,
  });

  // 3. LinkedIn URL present
  const hasLinkedIn = /linkedin\.com\/in\//i.test(text);
  checks.push({
    id: "contact_linkedin",
    category: "contact",
    label: "LinkedIn Profile URL",
    status: hasLinkedIn ? "pass" : "warn",
    detail: hasLinkedIn ? "LinkedIn URL found" : "No LinkedIn URL found",
    fix: hasLinkedIn
      ? undefined
      : "Add your LinkedIn profile URL (linkedin.com/in/yourname). Recruiters check this for 87% of candidates.",
    score: 5,
  });

  // 4. Location present (city/country)
  const hasLocation = /\b([A-Z][a-z]+[\s,]+[A-Z]{2}\b|[A-Z][a-z]+[\s,]+[A-Z][a-z]+)/m.test(text);
  checks.push({
    id: "contact_location",
    category: "contact",
    label: "Location",
    status: hasLocation ? "pass" : "warn",
    detail: hasLocation ? "Location found in contact section" : "No location found",
    fix: hasLocation
      ? undefined
      : "Add your city and country/state (e.g. 'New York, NY' or 'London, UK').",
    score: 4,
  });

  // ── STRUCTURE CATEGORY ───────────────────────────────────────────────────────

  // 5. Standard sections present
  const standardSectionCount = countMatches(text, STANDARD_SECTIONS);
  checks.push({
    id: "structure_standard_sections",
    category: "structure",
    label: "Required Section Headers",
    status: standardSectionCount >= 3 ? "pass" : standardSectionCount === 2 ? "warn" : "fail",
    detail: `${standardSectionCount}/3 standard sections found (Experience, Education, Skills)`,
    fix:
      standardSectionCount < 3
        ? "Ensure your resume has clearly labeled 'Experience', 'Education', and 'Skills' sections. ATS systems identify candidates by these headers."
        : undefined,
    score: 9,
  });

  // 6. Summary / Profile section
  const hasSummary = countMatches(text, [OPTIONAL_SECTIONS[0]]) > 0;
  checks.push({
    id: "structure_summary",
    category: "structure",
    label: "Professional Summary",
    status: hasSummary ? "pass" : "warn",
    detail: hasSummary ? "Summary/Profile section detected" : "No Summary or Profile section found",
    fix: hasSummary
      ? undefined
      : "Add a 2–3 sentence Professional Summary at the top. It's the first thing recruiters read and the best place to pack role-specific keywords.",
    score: 6,
  });

  // 7. Certifications section
  const hasCerts = countMatches(text, [OPTIONAL_SECTIONS[1]]) > 0;
  checks.push({
    id: "structure_certs",
    category: "structure",
    label: "Certifications Section",
    status: hasCerts ? "pass" : "warn",
    detail: hasCerts ? "Certifications section found" : "No certifications section detected",
    fix: hasCerts
      ? undefined
      : "If you have any certifications (AWS, Google Cloud, PMP, etc.), add a 'Certifications' section — they are heavily filtered by ATS.",
    score: 4,
  });

  // 8. Resume length (word count)
  let lengthStatus: AtsCheckStatus = "pass";
  let lengthDetail = `${wc} words`;
  let lengthFix: string | undefined;
  if (wc < 200) {
    lengthStatus = "fail";
    lengthDetail = `Too short — only ${wc} words`;
    lengthFix =
      "Your resume appears too short. Aim for 400–700 words for most roles. Add more experience bullets, skills, and context.";
  } else if (wc > 900) {
    lengthStatus = "warn";
    lengthDetail = `Potentially long — ${wc} words`;
    lengthFix =
      "Your resume may be too long. Recruiters spend 6–7 seconds on initial scans. Trim to the most impactful bullets and keep to 1–2 pages.";
  }
  checks.push({
    id: "structure_length",
    category: "structure",
    label: "Resume Length",
    status: lengthStatus,
    detail: lengthDetail,
    fix: lengthFix,
    score: 5,
  });

  // 9. Bullet points present
  const bulletCount = bullets.length;
  checks.push({
    id: "structure_bullets",
    category: "structure",
    label: "Bullet Points in Experience",
    status: bulletCount >= 5 ? "pass" : bulletCount >= 2 ? "warn" : "fail",
    detail: `${bulletCount} bullet point${bulletCount !== 1 ? "s" : ""} detected`,
    fix:
      bulletCount < 5
        ? "Use bullet points (–, •) for each experience entry. 3–6 bullets per role is optimal. Paragraphs are harder for ATS to parse."
        : undefined,
    score: 7,
  });

  // ── CONTENT CATEGORY ─────────────────────────────────────────────────────────

  // 10. Quantified achievements (numbers/metrics in bullets)
  const bulletText = bullets.join(" ");
  const quantifiedBullets = bullets.filter((b) =>
    /\d+\s*(%|percent|k\b|\$|million|billion|x\b|times|users|customers|ms|seconds|hours|days|weeks)/i.test(
      b
    )
  );
  const quantRate = bullets.length > 0 ? quantifiedBullets.length / bullets.length : 0;
  checks.push({
    id: "content_quantified",
    category: "content",
    label: "Quantified Achievements",
    status: quantRate >= 0.4 ? "pass" : quantRate >= 0.15 ? "warn" : "fail",
    detail: `${quantifiedBullets.length}/${bullets.length} bullets contain metrics (${Math.round(quantRate * 100)}%)`,
    fix:
      quantRate < 0.4
        ? "Add numbers to at least 40% of bullets. Example: 'Reduced load time by 40%' or 'Grew user base to 10K+'. Recruiters filter for impact."
        : undefined,
    score: 9,
  });

  // 11. Strong action verbs
  const strongVerbBullets = bullets.filter((b) => {
    const firstWord =
      b
        .replace(/^[-•*▪►\d.]\s*/, "")
        .split(/\s/)[0]
        ?.toLowerCase() ?? "";
    return STRONG_ACTION_VERBS.includes(firstWord);
  });
  const strongVerbRate = bullets.length > 0 ? strongVerbBullets.length / bullets.length : 0;
  checks.push({
    id: "content_action_verbs",
    category: "content",
    label: "Strong Action Verbs",
    status: strongVerbRate >= 0.5 ? "pass" : strongVerbRate >= 0.25 ? "warn" : "fail",
    detail: `${strongVerbBullets.length}/${bullets.length} bullets start with a strong action verb`,
    fix:
      strongVerbRate < 0.5
        ? `Replace weak starts ('Responsible for', 'Helped', 'Worked') with impact verbs: Engineered, Architected, Spearheaded, Delivered, Reduced, Scaled.`
        : undefined,
    score: 8,
  });

  // 12. Weak passive verbs
  const weakVerbMatches = WEAK_VERBS.filter((v) => new RegExp(`\\b${v}\\b`, "i").test(text));
  checks.push({
    id: "content_weak_verbs",
    category: "content",
    label: "No Passive / Weak Language",
    status: weakVerbMatches.length === 0 ? "pass" : weakVerbMatches.length <= 2 ? "warn" : "fail",
    detail:
      weakVerbMatches.length > 0
        ? `Weak language detected: ${weakVerbMatches.slice(0, 4).join(", ")}`
        : "No weak passive language found",
    fix:
      weakVerbMatches.length > 0
        ? `Remove or replace: "${weakVerbMatches.join('", "')}"`
        : undefined,
    score: 6,
  });

  // 13. Personal pronouns (I, me, my — ATS and recruiter red flag)
  const pronounMatches = (text.match(/\b(I|me|my|myself|we|our)\b/g) || []).length;
  checks.push({
    id: "content_pronouns",
    category: "content",
    label: "No Personal Pronouns",
    status: pronounMatches === 0 ? "pass" : pronounMatches <= 3 ? "warn" : "fail",
    detail:
      pronounMatches > 0
        ? `${pronounMatches} personal pronoun(s) found (I, me, my, we)`
        : "No personal pronouns found",
    fix:
      pronounMatches > 0
        ? "Remove personal pronouns. Resumes use implied first-person (e.g. 'Led team of 5' not 'I led team of 5')."
        : undefined,
    score: 5,
  });

  // 14. Date consistency (look for years in experience)
  const dateMatches = text.match(/\b(19|20)\d{2}\b/g) || [];
  const hasDates = dateMatches.length >= 2;
  checks.push({
    id: "content_dates",
    category: "content",
    label: "Employment Date Ranges",
    status: hasDates ? "pass" : "warn",
    detail: hasDates
      ? `${dateMatches.length} year references found`
      : "No clear employment dates detected",
    fix: hasDates
      ? undefined
      : "Add start and end dates to each experience entry (e.g. 'Jan 2022 – Mar 2024'). ATS systems use dates to verify employment gaps.",
    score: 7,
  });

  // ── KEYWORDS CATEGORY ────────────────────────────────────────────────────────

  // 15. Job description keyword match (if JD provided)
  if (jobDescription) {
    const jdWords = (jobDescription.toLowerCase().match(/\b[a-z]{4,}\b/g) || []).filter(
      (w) =>
        ![
          "that",
          "with",
          "this",
          "from",
          "have",
          "will",
          "your",
          "their",
          "they",
          "been",
          "were",
          "also",
          "into",
          "when",
        ].includes(w)
    );
    const uniqueJdKeywords = [...new Set(jdWords)].slice(0, 50);
    const matchedInResume = uniqueJdKeywords.filter((kw) =>
      new RegExp(`\\b${kw}\\b`, "i").test(text)
    );
    const matchRate =
      uniqueJdKeywords.length > 0 ? matchedInResume.length / uniqueJdKeywords.length : 0;
    checks.push({
      id: "keywords_jd_match",
      category: "keywords",
      label: "Job Description Keyword Match",
      status: matchRate >= 0.5 ? "pass" : matchRate >= 0.3 ? "warn" : "fail",
      detail: `${matchedInResume.length}/${uniqueJdKeywords.length} JD keywords found in resume (${Math.round(matchRate * 100)}% match)`,
      fix:
        matchRate < 0.5
          ? "Your resume is missing key terms from the job description. Use the 'Job Match' tab to see exactly which keywords to add."
          : undefined,
      score: 10,
    });

    // 16. Keyword stuffing warning
    const topKeyword = uniqueJdKeywords[0];
    const stuffingCount = topKeyword
      ? (text.toLowerCase().match(new RegExp(`\\b${topKeyword}\\b`, "g")) || []).length
      : 0;
    checks.push({
      id: "keywords_stuffing",
      category: "keywords",
      label: "No Keyword Stuffing",
      status: stuffingCount <= 6 ? "pass" : stuffingCount <= 10 ? "warn" : "fail",
      detail:
        stuffingCount > 6
          ? `"${topKeyword}" appears ${stuffingCount} times — may trigger spam filters`
          : "Keyword density looks natural",
      fix:
        stuffingCount > 6
          ? `Reduce repetition of "${topKeyword}". Use synonyms and variations. Modern ATS detect over-stuffing and penalise it.`
          : undefined,
      score: 4,
    });
  }

  // 17. Skills section has actual skills (not just one word)
  const skillsMatch = text.match(/skills?\s*[\n:]([\s\S]{0,300})/i);
  const skillsText = skillsMatch?.[1] ?? "";
  const skillCount = skillsText
    .split(/[,|\n•\-]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1).length;
  checks.push({
    id: "keywords_skills_density",
    category: "keywords",
    label: "Skills Section Completeness",
    status: skillCount >= 8 ? "pass" : skillCount >= 4 ? "warn" : "fail",
    detail: skillCount > 0 ? `~${skillCount} skills listed` : "No skills section content detected",
    fix:
      skillCount < 8
        ? "List at least 8–15 specific skills (technologies, tools, frameworks). Generic skills like 'Communication' add no ATS value — use specific terms like 'TypeScript', 'PostgreSQL', 'Docker'."
        : undefined,
    score: 8,
  });

  // ── FORMATTING CATEGORY ──────────────────────────────────────────────────────

  // 18. No special characters / emoji in section headers
  const emojiInHeaders = lines
    .slice(0, 30)
    .some((l) => /[\u{1F000}-\u{1FFFF}]|[\u2600-\u27FF]/u.test(l));
  checks.push({
    id: "formatting_no_emoji_headers",
    category: "formatting",
    label: "No Emoji in Section Headers",
    status: emojiInHeaders ? "warn" : "pass",
    detail: emojiInHeaders
      ? "Emoji detected in headers — may cause ATS parsing errors"
      : "No problematic emoji in headers",
    fix: emojiInHeaders
      ? "Remove emoji from section headers. ATS systems often fail to parse sections with emoji, misclassifying them as body content."
      : undefined,
    score: 5,
  });

  // 19. File appears to have meaningful content (not too many special chars suggesting bad parse)
  const specialCharRatio =
    (text.match(/[^a-zA-Z0-9\s.,;:()\-\[\]@+%$#!?'"\/\\]/g) || []).length /
    Math.max(text.length, 1);
  checks.push({
    id: "formatting_text_quality",
    category: "formatting",
    label: "Clean Text Extraction",
    status: specialCharRatio < 0.02 ? "pass" : specialCharRatio < 0.06 ? "warn" : "fail",
    detail:
      specialCharRatio >= 0.02
        ? `Unusual character ratio detected (${(specialCharRatio * 100).toFixed(1)}%) — may indicate parsing issues`
        : "Resume text appears cleanly extracted",
    fix:
      specialCharRatio >= 0.06
        ? "Your PDF may not be parsing correctly (common with multi-column or image-heavy layouts). Try uploading a plain Word document (.docx) for best ATS compatibility."
        : undefined,
    score: 6,
  });

  // 20. Job title consistency (at least one recognizable job title near the top)
  const topText = lines.slice(0, 20).join(" ");
  const hasJobTitle =
    /\b(engineer|developer|manager|analyst|designer|director|specialist|consultant|architect|lead|senior|junior|intern|coordinator|officer|executive|scientist|researcher|administrator)\b/i.test(
      topText
    );
  checks.push({
    id: "formatting_job_title",
    category: "formatting",
    label: "Job Title in Header",
    status: hasJobTitle ? "pass" : "warn",
    detail: hasJobTitle
      ? "Professional title found near top of resume"
      : "No clear job title detected near top of resume",
    fix: hasJobTitle
      ? undefined
      : "Add your current or target job title below your name (e.g. 'Senior Software Engineer'). This is the first thing ATS and recruiters look for.",
    score: 6,
  });

  // ── Scoring ──────────────────────────────────────────────────────────────────
  const totalWeight = checks.reduce((sum, c) => sum + c.score, 0);
  const earnedWeight = checks.reduce((sum, c) => {
    if (c.status === "pass") return sum + c.score;
    if (c.status === "warn") return sum + c.score * 0.5;
    return sum;
  }, 0);
  const deterministicScore = Math.round((earnedWeight / totalWeight) * 100);

  return {
    checks,
    passCount: checks.filter((c) => c.status === "pass").length,
    warnCount: checks.filter((c) => c.status === "warn").length,
    failCount: checks.filter((c) => c.status === "fail").length,
    deterministicScore,
  };
}
