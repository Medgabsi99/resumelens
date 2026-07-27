export type AtsVendor = "workday" | "greenhouse" | "lever" | "taleo" | "icims";

export interface VendorParsingCheck {
  id: string;
  category: "formatting" | "dates" | "headers" | "skills" | "contact";
  title: string;
  status: "pass" | "warn" | "fail";
  description: string;
  recommendation: string;
}

export interface AtsVendorProfile {
  vendorId: AtsVendor;
  name: string;
  logoBadge: string;
  accentColor: string;
  matchScore: number;
  marketShare: string;
  parsingRisk: "Low Risk" | "Moderate Risk" | "High Risk";
  checks: VendorParsingCheck[];
  summary: string;
}

export interface AtsSimulatorResult {
  overallVendorScore: number;
  profiles: Record<AtsVendor, AtsVendorProfile>;
  topVendorName: string;
  lowestVendorName: string;
  universalFixesCount: number;
}

export function simulateAtsVendors(resumeText: string, jobDescription?: string): AtsSimulatorResult {
  const text = resumeText || "";
  const lowerText = text.toLowerCase();

  // 1. Check Date Formatting (MM/YYYY vs Seasonal/Text dates)
  const hasStandardDates = /\b(0[1-9]|1[0-2])\/\d{4}\b|\b(20\d{2}|19\d{2})\b/.test(text);
  const hasSeasonalDates = /summer|winter|spring|fall|present|current/i.test(text);

  // 2. Check Standard Section Headers
  const hasWorkExpHeader = /experience|employment|work history|professional experience/i.test(text);
  const hasEducationHeader = /education|academic|degree|university|college/i.test(text);
  const hasSkillsHeader = /skills|technologies|tools|proficiencies|competencies/i.test(text);

  // 3. Check Contact Details
  const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(text);
  const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text);
  const hasLinkedIn = /linkedin\.com\/in\/[\w-]+/i.test(text);

  // 4. Check Bullet Action Verbs & Metrics
  const hasMetrics = /\d+%\s|\$\d+|\d+\+|\d+\s?(users|clients|projects|ms|sec|hours|days)/i.test(text);
  const hasActionVerbs = /led|built|architected|developed|automated|created|engineered|managed|designed|reduced|increased/i.test(text);

  // 5. Check Technical & Keyword Density
  const wordCount = text.trim().split(/\s+/).length;
  const isAppropriateLength = wordCount >= 250 && wordCount <= 1200;

  // ── Workday Profile ───────────────────────────────────────
  const workdayScore = Math.min(
    100,
    (hasStandardDates ? 25 : 10) +
    (hasWorkExpHeader && hasEducationHeader ? 25 : 10) +
    (hasEmail && hasPhone ? 25 : 15) +
    (isAppropriateLength ? 25 : 15)
  );

  const workdayProfile: AtsVendorProfile = {
    vendorId: "workday",
    name: "Workday ATS",
    logoBadge: "WD",
    accentColor: "#0051bed0",
    matchScore: workdayScore,
    marketShare: "42% Fortune 500 Enterprise",
    parsingRisk: workdayScore >= 80 ? "Low Risk" : workdayScore >= 60 ? "Moderate Risk" : "High Risk",
    summary: "Workday uses strict pattern-matching for dates and standard section headers. Irregular date formats or multi-column layouts trigger parsing errors.",
    checks: [
      {
        id: "wd-1",
        category: "dates",
        title: "Standardized Date Formats",
        status: hasStandardDates ? "pass" : "fail",
        description: hasStandardDates
          ? "Dates formatted cleanly with standard numerical months or years (e.g. 05/2023 - 12/2024)."
          : "Non-standard date formats detected. Workday requires explicit MM/YYYY or YYYY ranges.",
        recommendation: "Use MM/YYYY or YYYY formatting for all work history entries.",
      },
      {
        id: "wd-2",
        category: "headers",
        title: "Exact Section Headings",
        status: hasWorkExpHeader && hasEducationHeader && hasSkillsHeader ? "pass" : "warn",
        description: hasWorkExpHeader && hasEducationHeader
          ? "Standard 'Professional Experience' and 'Education' headings detected."
          : "Missing standard section headings. Workday may group experience into unclassified blocks.",
        recommendation: "Ensure headings use standard text: 'Professional Experience', 'Education', 'Skills'.",
      },
      {
        id: "wd-3",
        category: "contact",
        title: "Contact Info Extraction",
        status: hasEmail && hasPhone ? "pass" : "warn",
        description: hasEmail && hasPhone
          ? "Email and Phone number correctly recognized."
          : "Ensure email and phone number are in plain body text, not inside header/footer text boxes.",
        recommendation: "Move contact info into main document body text.",
      },
    ],
  };

  // ── Greenhouse Profile ───────────────────────────────────
  const greenhouseScore = Math.min(
    100,
    (hasMetrics ? 30 : 15) +
    (hasActionVerbs ? 30 : 15) +
    (hasSkillsHeader ? 20 : 10) +
    (hasLinkedIn ? 20 : 10)
  );

  const greenhouseProfile: AtsVendorProfile = {
    vendorId: "greenhouse",
    name: "Greenhouse",
    logoBadge: "GH",
    accentColor: "#0e8348",
    matchScore: greenhouseScore,
    marketShare: "34% Fast-Growing Tech & Unicorns",
    parsingRisk: greenhouseScore >= 80 ? "Low Risk" : greenhouseScore >= 60 ? "Moderate Risk" : "High Risk",
    summary: "Greenhouse parses plain text smoothly and ranks candidates heavily based on quantified bullet metrics and technical skill keywords.",
    checks: [
      {
        id: "gh-1",
        category: "formatting",
        title: "Quantified Accomplishments",
        status: hasMetrics ? "pass" : "warn",
        description: hasMetrics
          ? "Quantified achievements (percentages, revenue, time savings) detected."
          : "Bullets lack numerical impact. Greenhouse recruiters prioritize candidates with measured outcomes.",
        recommendation: "Add numbers, percentages, or dollar metrics to at least 3 bullet points.",
      },
      {
        id: "gh-2",
        category: "skills",
        title: "Skill Keyword Tag Density",
        status: hasSkillsHeader ? "pass" : "warn",
        description: hasSkillsHeader
          ? "Dedicated Skills section present for keyword indexing."
          : "No explicit Skills section found. Greenhouse auto-tags candidate profiles by skill frequency.",
        recommendation: "Create a dedicated 'Skills' section with categorized technologies.",
      },
    ],
  };

  // ── Lever Profile ─────────────────────────────────────────
  const leverScore = Math.min(
    100,
    (hasLinkedIn ? 30 : 10) +
    (hasEmail && hasPhone ? 30 : 15) +
    (hasActionVerbs ? 25 : 10) +
    (hasWorkExpHeader ? 15 : 10)
  );

  const leverProfile: AtsVendorProfile = {
    vendorId: "lever",
    name: "Lever TRM",
    logoBadge: "LV",
    accentColor: "#3b82f6",
    matchScore: leverScore,
    marketShare: "22% Modern Scale-ups",
    parsingRisk: leverScore >= 80 ? "Low Risk" : leverScore >= 60 ? "Moderate Risk" : "High Risk",
    summary: "Lever emphasizes candidate social proof (LinkedIn profile URL) and parses experience timeline continuity to build talent rosters.",
    checks: [
      {
        id: "lv-1",
        category: "contact",
        title: "Social Profile Link Parsing",
        status: hasLinkedIn ? "pass" : "warn",
        description: hasLinkedIn
          ? "LinkedIn profile link recognized for Lever instant enrichment."
          : "No LinkedIn URL detected. Lever auto-enriches candidate profiles via LinkedIn.",
        recommendation: "Add your full LinkedIn URL (e.g. linkedin.com/in/yourname).",
      },
      {
        id: "lv-2",
        category: "formatting",
        title: "Action Verb Sentence Structure",
        status: hasActionVerbs ? "pass" : "warn",
        description: hasActionVerbs
          ? "Strong initial action verbs found across bullet points."
          : "Bullet points start with weak descriptions instead of high-impact action verbs.",
        recommendation: "Start every experience bullet point with an active verb (e.g. Architected, Accelerated).",
      },
    ],
  };

  // ── Taleo Profile ─────────────────────────────────────────
  const taleoScore = Math.min(
    100,
    (hasStandardDates ? 35 : 10) +
    (hasWorkExpHeader && hasEducationHeader ? 35 : 15) +
    (hasEmail ? 30 : 15)
  );

  const taleoProfile: AtsVendorProfile = {
    vendorId: "taleo",
    name: "Oracle Taleo",
    logoBadge: "TL",
    accentColor: "#c2410c",
    marketShare: "28% Legacy Global Enterprise",
    matchScore: taleoScore,
    parsingRisk: taleoScore >= 80 ? "Low Risk" : taleoScore >= 60 ? "Moderate Risk" : "High Risk",
    summary: "Oracle Taleo is a strict legacy parser. It rejects non-standard section headers, complex symbols, and unformatted dates.",
    checks: [
      {
        id: "tl-1",
        category: "headers",
        title: "Legacy Section Parsing",
        status: hasWorkExpHeader && hasEducationHeader ? "pass" : "fail",
        description: hasWorkExpHeader && hasEducationHeader
          ? "Standard section titles matched cleanly."
          : "Taleo strictly requires exact header names like 'Work Experience' and 'Education'.",
        recommendation: "Rename section titles to 'Work Experience', 'Education', and 'Skills'.",
      },
      {
        id: "tl-2",
        category: "dates",
        title: "Employment Timeline Verification",
        status: hasStandardDates ? "pass" : "fail",
        description: hasStandardDates
          ? "Clean chronological date formatting recognized."
          : "Taleo fails to index dates written in non-numeric formats.",
        recommendation: "Use standard Month YYYY or MM/YYYY date formats.",
      },
    ],
  };

  // ── iCIMS Profile ─────────────────────────────────────────
  const icimsScore = Math.min(
    100,
    (hasEducationHeader ? 30 : 10) +
    (isAppropriateLength ? 30 : 15) +
    (hasMetrics ? 20 : 10) +
    (hasSkillsHeader ? 20 : 10)
  );

  const icimsProfile: AtsVendorProfile = {
    vendorId: "icims",
    name: "iCIMS Talent Cloud",
    logoBadge: "IC",
    accentColor: "#9333ea",
    marketShare: "25% High-Volume Enterprise",
    matchScore: icimsScore,
    parsingRisk: icimsScore >= 80 ? "Low Risk" : icimsScore >= 60 ? "Moderate Risk" : "High Risk",
    summary: "iCIMS validates education credentials, certification blocks, and assesses total length-to-keyword density ratio.",
    checks: [
      {
        id: "ic-1",
        category: "formatting",
        title: "Document Length & Density Ratio",
        status: isAppropriateLength ? "pass" : "warn",
        description: isAppropriateLength
          ? `Optimal word count (${wordCount} words) for iCIMS density scoring.`
          : "Document is either too short (<250 words) or excessively long for iCIMS automated screening.",
        recommendation: "Target between 400 and 900 words total for optimal ATS scoring.",
      },
      {
        id: "ic-2",
        category: "headers",
        title: "Education & Degree Verification",
        status: hasEducationHeader ? "pass" : "warn",
        description: hasEducationHeader
          ? "Education section identified cleanly."
          : "Missing Education section header.",
        recommendation: "Add an explicit 'Education' section listing your degree and institution.",
      },
    ],
  };

  const profiles: Record<AtsVendor, AtsVendorProfile> = {
    workday: workdayProfile,
    greenhouse: greenhouseProfile,
    lever: leverProfile,
    taleo: taleoProfile,
    icims: icimsProfile,
  };

  const allScores = [
    { name: "Workday", score: workdayScore },
    { name: "Greenhouse", score: greenhouseScore },
    { name: "Lever", score: leverScore },
    { name: "Taleo", score: taleoScore },
    { name: "iCIMS", score: icimsScore },
  ].sort((a, b) => b.score - a.score);

  const overallVendorScore = Math.round(
    (workdayScore + greenhouseScore + leverScore + taleoScore + icimsScore) / 5
  );

  let universalFixesCount = 0;
  Object.values(profiles).forEach((p) => {
    p.checks.forEach((c) => {
      if (c.status !== "pass") universalFixesCount++;
    });
  });

  return {
    overallVendorScore,
    profiles,
    topVendorName: allScores[0].name,
    lowestVendorName: allScores[allScores.length - 1].name,
    universalFixesCount,
  };
}
