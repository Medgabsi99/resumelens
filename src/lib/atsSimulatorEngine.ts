/**
 * ATS Vendor Simulator & Reverse-Engineering Engine
 *
 * Simulates parsing pipelines, failure penalties, and raw text extraction
 * across 8 major ATS vendors: Workday, Greenhouse, Lever, Ashby,
 * Oracle Taleo, SmartRecruiters, iCIMS, and BambooHR.
 */

export type AtsVendor =
  "workday" | "greenhouse" | "lever" | "ashby" | "taleo" | "smartrecruiters" | "icims" | "bamboohr";

export interface VendorParsingCheck {
  id: string;
  category: "formatting" | "dates" | "headers" | "skills" | "contact" | "metrics";
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

export interface VendorXRayResult {
  vendorId: AtsVendor;
  vendorName: string;
  parsedStream: string;
  extractedSections: {
    name: string;
    status: "Clean Extraction" | "Fragmented" | "Dropped / Missing";
    lines: string[];
  }[];
  extractedKeywords: string[];
  detectedAnomalies: {
    line: string;
    warning: string;
    severity: "high" | "medium" | "low";
  }[];
}

// ─── Main Simulation Function ─────────────────────────────────────────────────

export function simulateAtsVendors(
  resumeText: string,
  jobDescription?: string
): AtsSimulatorResult {
  const text = resumeText || "";

  // 1. Date Checks
  const hasStandardDates = /\b(0[1-9]|1[0-2])\/\d{4}\b|\b(20\d{2}|19\d{2})\b/.test(text);

  // 2. Section Headers
  const hasWorkExpHeader = /experience|employment|work history|professional experience/i.test(text);
  const hasEducationHeader = /education|academic|degree|university|college/i.test(text);
  const hasSkillsHeader = /skills|technologies|tools|proficiencies|competencies/i.test(text);

  // 3. Contact Details
  const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(text);
  const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text);
  const hasLinkedIn = /linkedin\.com\/in\/[\w-]+/i.test(text);
  const hasGitHub = /github\.com\/[\w-]+/i.test(text);

  // 4. Metrics & Action Verbs
  const hasMetrics =
    /\d+%\s|\$\d+|\d+\+|\d+\s?(users|clients|projects|ms|sec|hours|days|dau|mau|arr)/i.test(text);
  const hasActionVerbs =
    /led|built|architected|developed|automated|created|engineered|managed|designed|reduced|increased|delivered|spearheaded/i.test(
      text
    );

  // 5. Length & Formatting
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const isAppropriateLength = wordCount >= 250 && wordCount <= 1200;
  const hasNonAscii = /[^\x00-\x7F]/.test(text);

  // ── 1. Workday ────────────────────────────────────────────────
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
    accentColor: "#0051be",
    matchScore: workdayScore,
    marketShare: "42% Fortune 500 Enterprise",
    parsingRisk:
      workdayScore >= 80 ? "Low Risk" : workdayScore >= 60 ? "Moderate Risk" : "High Risk",
    summary:
      "Workday uses strict pattern-matching for dates and section headers. Multi-column tables and non-standard date formats trigger severe parsing fragmentation.",
    checks: [
      {
        id: "wd-1",
        category: "dates",
        title: "Standardized Date Ranges",
        status: hasStandardDates ? "pass" : "fail",
        description: hasStandardDates
          ? "Dates formatted cleanly with standard numerical months or years (e.g. 05/2021 – 08/2024)."
          : "Non-standard date formats detected. Workday requires explicit MM/YYYY or YYYY ranges.",
        recommendation: "Use MM/YYYY or YYYY formatting for all work history entries.",
      },
      {
        id: "wd-2",
        category: "headers",
        title: "Exact Section Headings",
        status: hasWorkExpHeader && hasEducationHeader && hasSkillsHeader ? "pass" : "warn",
        description:
          hasWorkExpHeader && hasEducationHeader
            ? "Standard 'Professional Experience' and 'Education' headings detected."
            : "Missing standard section headings. Workday may group experience into unclassified blocks.",
        recommendation:
          "Ensure headings use standard text: 'Professional Experience', 'Education', 'Skills'.",
      },
      {
        id: "wd-3",
        category: "contact",
        title: "Body-Level Contact Ingestion",
        status: hasEmail && hasPhone ? "pass" : "warn",
        description:
          hasEmail && hasPhone
            ? "Email and Phone number correctly recognized in document flow."
            : "Ensure email and phone number are in plain body text, not inside Word header/footer zones.",
        recommendation: "Place contact details in the first 5 lines of document body text.",
      },
    ],
  };

  // ── 2. Greenhouse ─────────────────────────────────────────────
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
    accentColor: "#10b981",
    matchScore: greenhouseScore,
    marketShare: "34% High-Growth Tech & Scale-ups",
    parsingRisk:
      greenhouseScore >= 80 ? "Low Risk" : greenhouseScore >= 60 ? "Moderate Risk" : "High Risk",
    summary:
      "Greenhouse parses plain text cleanly and scores candidates based on exact keyword overlap and quantified bullet impact.",
    checks: [
      {
        id: "gh-1",
        category: "formatting",
        title: "Quantified Accomplishments",
        status: hasMetrics ? "pass" : "warn",
        description: hasMetrics
          ? "Quantified achievements (percentages, scale, latency) detected."
          : "Bullets lack numerical impact. Greenhouse hiring managers prioritize candidates with measured results.",
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

  // ── 3. Lever ──────────────────────────────────────────────────
  const leverScore = Math.min(
    100,
    (hasLinkedIn ? 30 : 10) +
      (hasGitHub ? 20 : 10) +
      (hasEmail && hasPhone ? 25 : 15) +
      (hasActionVerbs ? 25 : 10)
  );

  const leverProfile: AtsVendorProfile = {
    vendorId: "lever",
    name: "Lever TRM",
    logoBadge: "LEV",
    accentColor: "#6366f1",
    matchScore: leverScore,
    marketShare: "22% Modern Scale-ups",
    parsingRisk: leverScore >= 80 ? "Low Risk" : leverScore >= 60 ? "Moderate Risk" : "High Risk",
    summary:
      "Lever auto-enriches candidate records with LinkedIn/GitHub URLs and applies heavy recency weighting to skills in the latest 2 years.",
    checks: [
      {
        id: "lv-1",
        category: "contact",
        title: "Social & Repository Links",
        status: hasLinkedIn || hasGitHub ? "pass" : "warn",
        description:
          hasLinkedIn || hasGitHub
            ? "LinkedIn/GitHub profile link detected for Lever instant enrichment."
            : "No social/code links detected. Lever auto-enriches profiles using external profile URLs.",
        recommendation: "Add your LinkedIn or GitHub profile link in the contact header.",
      },
      {
        id: "lv-2",
        category: "formatting",
        title: "Action Verb Velocity",
        status: hasActionVerbs ? "pass" : "warn",
        description: hasActionVerbs
          ? "Strong initial action verbs found across bullet points."
          : "Bullets start with weak descriptions instead of high-impact action verbs.",
        recommendation:
          "Start every experience bullet with an active verb (e.g. Architected, Accelerated).",
      },
    ],
  };

  // ── 4. Ashby ──────────────────────────────────────────────────
  const ashbyScore = Math.min(
    100,
    (hasMetrics ? 35 : 15) +
      (hasActionVerbs ? 25 : 10) +
      (isAppropriateLength ? 20 : 10) +
      (hasSkillsHeader ? 20 : 10)
  );

  const ashbyProfile: AtsVendorProfile = {
    vendorId: "ashby",
    name: "Ashby Next-Gen",
    logoBadge: "ASH",
    accentColor: "#f59e0b",
    matchScore: ashbyScore,
    marketShare: "High-Growth Modern Tech (Figma, Notion)",
    parsingRisk: ashbyScore >= 80 ? "Low Risk" : ashbyScore >= 60 ? "Moderate Risk" : "High Risk",
    summary:
      "Ashby uses modern AI multimodal parsing. It tolerates clean layouts well but penalizes unquantified fluffy bullet points.",
    checks: [
      {
        id: "ash-1",
        category: "metrics",
        title: "XYZ Business Impact Density",
        status: hasMetrics ? "pass" : "warn",
        description: hasMetrics
          ? "Measurable business metrics detected (percentages, scale, dollar values)."
          : "Ashby AI models evaluate commercial impact; unquantified bullets receive lower priority rankings.",
        recommendation: "Apply the XYZ formula: Accomplished [X] measured by [Y], by doing [Z].",
      },
      {
        id: "ash-2",
        category: "skills",
        title: "Technical Hierarchy Clarity",
        status: hasSkillsHeader && hasWorkExpHeader ? "pass" : "warn",
        description:
          hasSkillsHeader && hasWorkExpHeader
            ? "Clean separation between skills and work chronology."
            : "Ensure skills are contextualized in role bullets as well as the skills section.",
        recommendation: "Mention primary technologies within your bullet points.",
      },
    ],
  };

  // ── 5. Oracle Taleo ───────────────────────────────────────────
  const taleoScore = Math.min(
    100,
    (hasStandardDates ? 35 : 10) +
      (hasWorkExpHeader && hasEducationHeader ? 35 : 15) +
      (!hasNonAscii ? 30 : 10)
  );

  const taleoProfile: AtsVendorProfile = {
    vendorId: "taleo",
    name: "Oracle Taleo",
    logoBadge: "TAL",
    accentColor: "#dc2626",
    matchScore: taleoScore,
    marketShare: "28% Legacy Enterprise & Banking",
    parsingRisk: taleoScore >= 80 ? "Low Risk" : taleoScore >= 60 ? "Moderate Risk" : "High Risk",
    summary:
      "Oracle Taleo is a strict legacy parser. It rejects non-standard section headers, complex symbols, and unformatted dates.",
    checks: [
      {
        id: "tl-1",
        category: "headers",
        title: "Legacy Section Keyword Match",
        status: hasWorkExpHeader && hasEducationHeader ? "pass" : "fail",
        description:
          hasWorkExpHeader && hasEducationHeader
            ? "Standard section titles matched cleanly."
            : "Taleo strictly requires exact header names like 'Work Experience' and 'Education'.",
        recommendation: "Rename section titles to 'Work Experience', 'Education', and 'Skills'.",
      },
      {
        id: "tl-2",
        category: "formatting",
        title: "ASCII Character Compatibility",
        status: !hasNonAscii ? "pass" : "warn",
        description: !hasNonAscii
          ? "Clean standard ASCII characters detected."
          : "Non-standard unicode symbols or decorative icons detected that may render as '?' in Taleo OCR.",
        recommendation: "Use standard round bullets (•) and plain ASCII characters.",
      },
    ],
  };

  // ── 6. SmartRecruiters ────────────────────────────────────────
  const smartRecruitersScore = Math.min(
    100,
    (hasSkillsHeader ? 30 : 15) +
      (hasWorkExpHeader ? 25 : 10) +
      (hasEducationHeader ? 25 : 10) +
      (isAppropriateLength ? 20 : 10)
  );

  const smartRecruitersProfile: AtsVendorProfile = {
    vendorId: "smartrecruiters",
    name: "SmartRecruiters",
    logoBadge: "SR",
    accentColor: "#0284c7",
    matchScore: smartRecruitersScore,
    marketShare: "18% Global Multinationals & Retail",
    parsingRisk:
      smartRecruitersScore >= 80
        ? "Low Risk"
        : smartRecruitersScore >= 60
          ? "Moderate Risk"
          : "High Risk",
    summary:
      "SmartRecruiters matches candidate experience against standardized skill ontology models and credentials.",
    checks: [
      {
        id: "sr-1",
        category: "skills",
        title: "Standard Skill Taxonomy Categorization",
        status: hasSkillsHeader ? "pass" : "warn",
        description: hasSkillsHeader
          ? "Dedicated skills block recognized for ontology mapping."
          : "Missing dedicated skills section for automated ontology extraction.",
        recommendation: "Group skills into Languages, Frameworks, and Tools.",
      },
    ],
  };

  // ── 7. iCIMS ──────────────────────────────────────────────────
  const icimsScore = Math.min(
    100,
    (hasEducationHeader ? 30 : 10) +
      (isAppropriateLength ? 30 : 15) +
      (hasMetrics ? 20 : 10) +
      (hasSkillsHeader ? 20 : 10)
  );

  const icimsProfile: AtsVendorProfile = {
    vendorId: "icims",
    name: "iCIMS Cloud",
    logoBadge: "IC",
    accentColor: "#4f46e5",
    matchScore: icimsScore,
    marketShare: "25% High-Volume Enterprise",
    parsingRisk: icimsScore >= 80 ? "Low Risk" : icimsScore >= 60 ? "Moderate Risk" : "High Risk",
    summary:
      "iCIMS validates education credentials and assesses total document length-to-keyword density ratio.",
    checks: [
      {
        id: "ic-1",
        category: "formatting",
        title: "Document Length & Density Ratio",
        status: isAppropriateLength ? "pass" : "warn",
        description: isAppropriateLength
          ? `Optimal word count (${wordCount} words) for iCIMS density scoring.`
          : "Document is outside the optimal length (250–1200 words) for iCIMS automated screening.",
        recommendation: "Target between 400 and 900 words total for optimal ATS scoring.",
      },
    ],
  };

  // ── 8. BambooHR ───────────────────────────────────────────────
  const bambooScore = Math.min(
    100,
    (hasEmail && hasPhone ? 35 : 15) + (hasWorkExpHeader ? 35 : 15) + (hasSkillsHeader ? 30 : 10)
  );

  const bambooProfile: AtsVendorProfile = {
    vendorId: "bamboohr",
    name: "BambooHR",
    logoBadge: "BHR",
    accentColor: "#16a34a",
    matchScore: bambooScore,
    marketShare: "15% SMB & Emerging Startups",
    parsingRisk: bambooScore >= 80 ? "Low Risk" : bambooScore >= 60 ? "Moderate Risk" : "High Risk",
    summary:
      "BambooHR focuses on clean human recruiter presentation with automated keyword indexing.",
    checks: [
      {
        id: "bhr-1",
        category: "contact",
        title: "Contact Clarity & Header Flow",
        status: hasEmail && hasPhone ? "pass" : "warn",
        description:
          hasEmail && hasPhone
            ? "Clean contact block parsed at document start."
            : "Ensure contact info is prominently placed at the top.",
        recommendation: "Keep name, email, phone, and city in the first 4 lines.",
      },
    ],
  };

  const profiles: Record<AtsVendor, AtsVendorProfile> = {
    workday: workdayProfile,
    greenhouse: greenhouseProfile,
    lever: leverProfile,
    ashby: ashbyProfile,
    taleo: taleoProfile,
    smartrecruiters: smartRecruitersProfile,
    icims: icimsProfile,
    bamboohr: bambooProfile,
  };

  const allScores = Object.values(profiles).sort((a, b) => b.matchScore - a.matchScore);

  const overallVendorScore = Math.round(
    Object.values(profiles).reduce((acc, p) => acc + p.matchScore, 0) / Object.keys(profiles).length
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

// ─── ATS X-Ray Tokenizer Simulator ────────────────────────────────────────────

/**
 * Simulates the raw extracted text stream as parsed by a specific ATS vendor engine.
 */
export function simulateVendorXRay(resumeText: string, vendor: AtsVendor): VendorXRayResult {
  const lines = (resumeText || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const detectedAnomalies: {
    line: string;
    warning: string;
    severity: "high" | "medium" | "low";
  }[] = [];
  const extractedSections: {
    name: string;
    status: "Clean Extraction" | "Fragmented" | "Dropped / Missing";
    lines: string[];
  }[] = [];
  const extractedKeywords: string[] = [];

  let currentSectionName = "Contact & Header";
  let currentSectionLines: string[] = [];

  for (const line of lines) {
    // Detect section headers
    if (/^(experience|employment|work history|professional experience)/i.test(line)) {
      if (currentSectionLines.length > 0) {
        extractedSections.push({
          name: currentSectionName,
          status: "Clean Extraction",
          lines: currentSectionLines,
        });
      }
      currentSectionName = "Professional Experience";
      currentSectionLines = [];
      continue;
    }

    if (/^(education|academic background|degrees)/i.test(line)) {
      if (currentSectionLines.length > 0) {
        extractedSections.push({
          name: currentSectionName,
          status: "Clean Extraction",
          lines: currentSectionLines,
        });
      }
      currentSectionName = "Education";
      currentSectionLines = [];
      continue;
    }

    if (/^(skills|technical skills|technologies|proficiencies)/i.test(line)) {
      if (currentSectionLines.length > 0) {
        extractedSections.push({
          name: currentSectionName,
          status: "Clean Extraction",
          lines: currentSectionLines,
        });
      }
      currentSectionName = "Technical Skills";
      currentSectionLines = [];
      continue;
    }

    // Extract keyword tokens
    const words = line.split(/[\s,•|/]+/).filter((w) => w.length > 3);
    for (const word of words) {
      if (/^[A-Z][a-zA-Z0-9+#.]+$/.test(word) && !extractedKeywords.includes(word)) {
        extractedKeywords.push(word);
      }
    }

    // Vendor-specific parsing simulation
    let processedLine = line;

    if (vendor === "workday") {
      // Workday drops decorative bullets and flags missing date tokens
      if (/summer|winter|spring|fall/i.test(line)) {
        detectedAnomalies.push({
          line,
          warning: "Workday may drop non-standard seasonal dates (requires MM/YYYY).",
          severity: "high",
        });
      }
      processedLine = processedLine.replace(/[•★✓►]/g, "- ");
    } else if (vendor === "taleo") {
      // Taleo flags non-ASCII characters
      if (/[^\x00-\x7F]/.test(line)) {
        detectedAnomalies.push({
          line,
          warning: "Taleo OCR character encoding warning: non-ASCII unicode character detected.",
          severity: "high",
        });
        processedLine = processedLine.replace(/[^\x00-\x7F]/g, "[?]");
      }
    } else if (vendor === "ashby") {
      // Ashby flags bullets without quantified metrics
      if (
        currentSectionName === "Professional Experience" &&
        !/\d+/.test(line) &&
        line.length > 30
      ) {
        detectedAnomalies.push({
          line,
          warning: "Ashby AI Flag: Unquantified responsibility bullet without measurable metrics.",
          severity: "medium",
        });
      }
    } else if (vendor === "lever") {
      // Lever flags lack of direct social links in header
      if (currentSectionName === "Contact & Header" && !/linkedin|github/i.test(line)) {
        detectedAnomalies.push({
          line,
          warning: "Lever Candidate Enrichment: Missing LinkedIn/GitHub profile URL.",
          severity: "low",
        });
      }
    }

    currentSectionLines.push(processedLine);
  }

  if (currentSectionLines.length > 0) {
    extractedSections.push({
      name: currentSectionName,
      status: "Clean Extraction",
      lines: currentSectionLines,
    });
  }

  // Compile full parsed text stream
  const parsedStream = extractedSections
    .map(
      (sec) =>
        `[${vendor.toUpperCase()} INGEST: ${sec.name.toUpperCase()}]\n` +
        sec.lines.map((l) => `  ${l}`).join("\n")
    )
    .join("\n\n");

  const vendorName =
    vendor === "workday"
      ? "Workday ATS"
      : vendor === "greenhouse"
        ? "Greenhouse"
        : vendor === "lever"
          ? "Lever TRM"
          : vendor === "ashby"
            ? "Ashby Next-Gen"
            : vendor === "taleo"
              ? "Oracle Taleo"
              : vendor === "smartrecruiters"
                ? "SmartRecruiters"
                : vendor === "icims"
                  ? "iCIMS Cloud"
                  : "BambooHR";

  return {
    vendorId: vendor,
    vendorName,
    parsedStream,
    extractedSections,
    extractedKeywords: extractedKeywords.slice(0, 25),
    detectedAnomalies,
  };
}
