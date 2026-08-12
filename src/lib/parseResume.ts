/**
 * Shared resume text parser used by all resume templates.
 *
 * Key improvements over the previous per-template parser:
 *   1. Bullet-aware entry splitting — lines starting with bullet chars
 *      (•, -, *, ◦, ✦, ▸, ►, ‣, ‐, –) are grouped with their parent entry
 *      instead of being treated as new entry boundaries.
 *   2. Smarter title / company / dates extraction using fallback heuristics.
 *   3. Location extraction from contact lines.
 *   4. Preserves blank-line boundaries in the original text to detect
 *      separate entries (double-newline = new entry).
 */

// ─── Types ──────────────────────────────────────────────────

export interface ParsedResume {
  contact: {
    name: string;
    email?: string;
    phone?: string;
    location?: string;
    links?: string[];
  };
  summary?: string;
  experience: {
    title: string;
    company: string;
    dates?: string;
    location?: string;
    bullets: string[];
  }[];
  education: {
    degree: string;
    school: string;
    dates?: string;
    details?: string;
  }[];
  skills: string[];
  projects?: { name: string; description: string }[];
  certifications?: string[];
  languages?: string[];
  awards?: string[];
}

// ─── Helpers ────────────────────────────────────────────────

const SECTION_KEYWORDS = [
  // Summary
  "summary",
  "objective",
  "profile",
  "about me",
  "about",
  "profil",
  "sommaire",
  "presentation",
  "resume",
  "professional summary",
  // Experience
  "experience",
  "work history",
  "employment",
  "career history",
  "parcours",
  "experiences",
  "professional experience",
  "work experience",
  // Education
  "education",
  "academic",
  "formation",
  "etudes",
  "cursus",
  "academic background",
  "educational background",
  // Skills
  "skills",
  "core competencies",
  "technical skills",
  "expertise",
  "competences",
  "aptitudes",
  "savoir-faire",
  "technologies",
  "tools",
  "tools & technologies",
  // Projects
  "projects",
  "personal projects",
  "projets",
  "key projects",
  // Certifications
  "certifications",
  "licenses",
  "certification",
  "professional certifications",
  // Languages
  "languages",
  "langues",
  // Awards
  "awards",
  "honors",
  "distinctions",
  "prix",
  "achievements",
  // Volunteering / Interests
  "volunteer",
  "volunteering",
  "interests",
  "hobbies",
  // References
  "references",
];

/** Regex that matches common bullet-point prefixes. */
const BULLET_PREFIX = /^[•\-◦✦▸►‣‐–*]\s*/;

/** Does this line look like a section header? */
export function isHeaderLine(line: string): boolean {
  const clean = line
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[:\s]+$/, "");

  if (clean.length > 50 || clean.length === 0) return false;

  return SECTION_KEYWORDS.some((k) => clean === k || clean.includes(k));
}

function cleanSectionName(sec: string): string {
  return sec
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Is this line a bullet point? */
function isBulletLine(line: string): boolean {
  return BULLET_PREFIX.test(line.trim());
}

/** Is this line purely a date / date-range? */
function isDateLine(line: string): boolean {
  const clean = line.trim();
  // e.g. "Jan 2020 - Present", "2018 – 2020", "06/2019 – 12/2021"
  return (
    /^\w{0,12}\s*\d{4}\s*[-–—to]+\s*(\w{0,12}\s*\d{4}|present|current|now)/i.test(clean) ||
    /^\d{4}\s*$/.test(clean) ||
    (/^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(clean) && /\d{4}/.test(clean))
  );
}

/** Clean a bullet prefix from a line. */
function stripBullet(line: string): string {
  return line.trim().replace(BULLET_PREFIX, "").trim();
}

// ─── Entry Splitting ────────────────────────────────────────
//
// Split a block of text (from one section) into separate entries
// (e.g. separate jobs). We use blank-line boundaries from the
// ORIGINAL text, and also detect "title-like" lines that are
// NOT bullets and NOT pure-date lines.

function splitIntoEntries(rawLines: string[]): string[][] {
  // Preserve blank-line info: track original blank-line positions
  const entries: string[][] = [];
  let current: string[] = [];

  for (const line of rawLines) {
    const trimmed = line.trim();

    if (trimmed === "") {
      // Blank line = potential entry boundary
      if (current.length > 0) {
        entries.push(current);
        current = [];
      }
      continue;
    }

    // If current is non-empty and this line looks like a new entry header
    // (not a bullet, not a date-only line, not starting with lowercase),
    // start a new entry
    if (
      current.length > 0 &&
      !isBulletLine(trimmed) &&
      !isDateLine(trimmed) &&
      /^[A-Z\d]/.test(trimmed) &&
      // The previous line was a bullet or date → this is likely a new entry
      (isBulletLine(current[current.length - 1]) || isDateLine(current[current.length - 1]))
    ) {
      entries.push(current);
      current = [];
    }

    current.push(trimmed);
  }

  if (current.length > 0) {
    entries.push(current);
  }

  return entries;
}

// ─── Experience Entry Parser ────────────────────────────────

function parseExperienceEntry(entryLines: string[]): ParsedResume["experience"][number] {
  if (entryLines.length === 0) {
    return { title: "", company: "", bullets: [] };
  }

  // First non-bullet line is the title/company line
  const firstLine = entryLines[0];

  // Try to split title and company on common separators
  const titleCompanyParts = firstLine.split(/\s+at\s+|\s+@\s+|\s+[—–]\s+|\s*\|\s*/i);
  let title = titleCompanyParts[0]?.trim() || firstLine;
  let company = titleCompanyParts[1]?.trim() || "";

  // If no separator found, try " - " but only if not a bullet
  if (!company && !isBulletLine(firstLine)) {
    const dashParts = firstLine.split(/\s+-\s+/);
    if (dashParts.length >= 2) {
      title = dashParts[0].trim();
      company = dashParts.slice(1).join(" - ").trim();
    }
  }

  // Extract dates from any line
  let dates = "";
  const dateLineIdx = entryLines.findIndex((l, idx) => idx > 0 && isDateLine(l));
  if (dateLineIdx > -1) {
    dates = entryLines[dateLineIdx];
  } else {
    // Look for a date range anywhere
    for (const l of entryLines) {
      const dateMatch = l.match(
        /(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s+)?\d{4}\s*[-–—to]+\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s+)?\d{4}|(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s+)?\d{4}\s*[-–—to]+\s*(?:present|current|now)/i
      );
      if (dateMatch) {
        dates = dateMatch[0].trim();
        break;
      }
    }
  }

  // Collect bullet points
  const bullets: string[] = [];
  const headerLinesToSkip = new Set([0]);
  if (dateLineIdx > -1) headerLinesToSkip.add(dateLineIdx);

  // Sometimes line 1 is company or location, line 2 is dates
  if (entryLines.length > 1 && !isBulletLine(entryLines[1]) && !isDateLine(entryLines[1])) {
    // Line 1 might be company name if we didn't get one
    if (!company) {
      company = entryLines[1];
      headerLinesToSkip.add(1);
    }
  }

  for (let i = 0; i < entryLines.length; i++) {
    if (headerLinesToSkip.has(i)) continue;
    const line = entryLines[i];

    if (isBulletLine(line)) {
      // Split if line contains multiple inline bullets: "• A • B • C"
      const inlineBullets = line
        .split(/[•✦▸►‣]/)
        .map((p) => p.trim().replace(BULLET_PREFIX, "").trim())
        .filter(Boolean);
      if (inlineBullets.length > 1) {
        bullets.push(...inlineBullets);
      } else {
        bullets.push(stripBullet(line));
      }
    } else if (isDateLine(line)) {
      // Skip pure date lines (already captured)
      if (!dates) dates = line;
    } else {
      // Non-bullet, non-date, non-header line — treat as a bullet
      const clean = stripBullet(line);
      if (clean && clean !== title && clean !== company) {
        bullets.push(clean);
      }
    }
  }

  return { title, company, dates, bullets };
}

// ─── Main Parser ────────────────────────────────────────────

export function parseResume(text: string): ParsedResume {
  // Keep blank lines for entry boundary detection
  const rawLines = text.split("\n");
  const result: ParsedResume = {
    contact: { name: "" },
    experience: [],
    education: [],
    skills: [],
  };

  // ── Contact block: first few lines before any section header ──
  // Scan up to 14 lines — contact sections often have a line each for
  // name, title, email, phone, location, LinkedIn, GitHub, portfolio
  const contactLines: string[] = [];
  let blankCount = 0;
  let i = 0;
  for (; i < Math.min(14, rawLines.length); i++) {
    const trimmed = rawLines[i].trim();
    if (trimmed === "") {
      blankCount++;
      // Allow one blank line inside the contact block (separates name from details)
      // but stop after two consecutive blanks
      if (blankCount >= 2 && contactLines.length > 0) break;
      continue;
    }
    blankCount = 0;
    if (isHeaderLine(trimmed)) break;
    contactLines.push(trimmed);
  }

  if (contactLines.length > 0) {
    result.contact.name = contactLines[0];
    const rest = contactLines.slice(1).join(" | ");

    // ── Standard fields ──────────────────────────────────────────
    const emailMatch = rest.match(/[\w.+-]+@[\w.-]+\.\w+/);
    const phoneMatch = rest.match(/[+]?[\d\s\-()]{7,}/);
    const locationMatch = rest.match(/(?:[\w\s]+,\s*[A-Z]{2})|(?:[\w\s]+,\s*[\w\s]+)/);
    if (emailMatch) result.contact.email = emailMatch[0];
    if (phoneMatch) result.contact.phone = phoneMatch[0].trim();
    if (locationMatch) result.contact.location = locationMatch[0].trim();

    // ── Extract LinkedIn / GitHub / Portfolio / any URL ──────────
    const links: string[] = [];
    const fullText = contactLines.join(" ");

    // Step 1: collect all email domains to exclude (e.g. "gmail.com")
    const emailDomains = new Set<string>();
    const emailPattern = /[\w.+-]+@([\w.-]+\.\w+)/g;
    let emailHit: RegExpExecArray | null;
    while ((emailHit = emailPattern.exec(fullText)) !== null) {
      emailDomains.add(emailHit[1].toLowerCase());
    }

    // Step 2: hard-skip known mail providers
    const MAIL_PROVIDERS = new Set([
      "gmail.com",
      "yahoo.com",
      "outlook.com",
      "hotmail.com",
      "icloud.com",
      "protonmail.com",
      "live.com",
      "mail.com",
      "aol.com",
      "ymail.com",
      "zoho.com",
    ]);

    // Step 3: broad URL regex — (?:[\w-]+\.)+ allows multi-segment domains:
    //   johndoe.github.io, me.johndoe.com, sub.mysite.co.uk
    //   [^\s<>"'()]* captures the full path including slashes, query params, hashes
    const urlRegex =
      /(?:https?:\/\/)?(?:[\w-]+\.)+(?:com|io|net|org|dev|me|co|app|tech|website|site|online|design|work)(?:\/[^\s<>"'()]*)?/gi;

    let urlMatch: RegExpExecArray | null;
    urlRegex.lastIndex = 0;
    while ((urlMatch = urlRegex.exec(fullText)) !== null) {
      let u = urlMatch[0].trim();
      // Strip trailing punctuation
      u = u.replace(/[.,;)'">\]]+$/, "");
      if (!u || u.length < 6) continue;

      // Extract full domain (everything before the first /)
      const domainMatch = u.match(/^(?:https?:\/\/)?(?:www\.)?([\w.-]+)/);
      const fullDomain = domainMatch?.[1]?.toLowerCase() ?? "";
      // Root domain = last two segments: "johndoe.github.io" → "github.io"
      const parts = fullDomain.split(".");
      const rootDomain = parts.slice(-2).join(".");
      const tld = parts[parts.length - 1] ?? "";

      // Skip email domains and known mail providers (check both full and root)
      if (
        emailDomains.has(fullDomain) ||
        emailDomains.has(rootDomain) ||
        MAIL_PROVIDERS.has(fullDomain) ||
        MAIL_PROVIDERS.has(rootDomain) ||
        /^\d/.test(u)
      )
        continue;

      // For bare .com/.net/.org with no path/prefix/known brand: skip fragments
      const hasPath = u.includes("/");
      const hasPrefix = u.startsWith("http") || u.startsWith("www.");
      const isPortTld = [
        "dev",
        "io",
        "me",
        "app",
        "tech",
        "website",
        "site",
        "online",
        "design",
        "work",
      ].includes(tld);
      const isKnownBrand = [
        "linkedin",
        "github",
        "gitlab",
        "behance",
        "dribbble",
        "stackoverflow",
        "medium",
        "portfolio",
      ].some((k) => fullDomain.includes(k));

      if (!hasPath && !hasPrefix && !isPortTld && !isKnownBrand) continue;

      // Deduplicate by full domain
      if (!links.some((l) => l.toLowerCase().includes(fullDomain.slice(0, 20)))) {
        links.push(u);
      }
    }

    if (links.length > 0) result.contact.links = links;
  } // end if (contactLines.length > 0)

  // ── Collect section buffers ──
  let currentSection = "summary";
  let buffer: string[] = []; // keeps blank lines for entry splitting

  const flushBuffer = () => {
    // Remove trailing blanks
    while (buffer.length > 0 && buffer[buffer.length - 1].trim() === "") {
      buffer.pop();
    }
    if (!buffer.length) return;

    const sec = cleanSectionName(currentSection);
    const textContent = buffer
      .map((l) => l.trim())
      .filter(Boolean)
      .join("\n");

    // ── Summary / Profile ──
    if (
      sec.includes("summary") ||
      sec.includes("objective") ||
      sec.includes("profile") ||
      sec.includes("about") ||
      sec.includes("sommaire") ||
      sec.includes("presentation")
    ) {
      result.summary = textContent;

      // ── Experience ──
    } else if (
      sec.includes("experience") ||
      sec.includes("work") ||
      sec.includes("employment") ||
      sec.includes("history") ||
      sec.includes("parcours")
    ) {
      const entries = splitIntoEntries(buffer);
      for (const entryLines of entries) {
        const filtered = entryLines.filter(Boolean);
        if (filtered.length === 0) continue;
        result.experience.push(parseExperienceEntry(filtered));
      }

      // ── Education ──
    } else if (
      sec.includes("education") ||
      sec.includes("academic") ||
      sec.includes("formation") ||
      sec.includes("etudes")
    ) {
      const entries = splitIntoEntries(buffer);
      for (const entryLines of entries) {
        const filtered = entryLines.filter((l) => l.trim() !== "");
        if (filtered.length === 0) continue;
        const degree = filtered[0] || "";
        const school = filtered.length > 1 ? filtered[1] : "";
        const dates =
          filtered.find((l) => isDateLine(l)) ||
          (() => {
            for (const l of filtered) {
              const m = l.match(/\d{4}/);
              if (m) return l;
            }
            return "";
          })();
        const detailLines = filtered.filter(
          (l) => l !== degree && l !== school && l !== dates && !isDateLine(l)
        );
        result.education.push({
          degree,
          school,
          dates,
          details: detailLines.join(". ").trim(),
        });
      }

      // ── Skills ──
    } else if (
      sec.includes("skill") ||
      sec.includes("competenc") ||
      sec.includes("expertise") ||
      sec.includes("aptitude") ||
      sec.includes("technolog") ||
      sec.includes("tools")
    ) {
      const skills = textContent
        .split(/[,\n•|✦▸►]/)
        .map((s) => s.replace(BULLET_PREFIX, "").trim())
        .filter(Boolean);
      result.skills = [...result.skills, ...skills];

      // ── Projects ──
    } else if (sec.includes("project") || sec.includes("projet")) {
      if (!result.projects) result.projects = [];
      const entries = splitIntoEntries(buffer);
      for (const entryLines of entries) {
        const filtered = entryLines.filter((l) => l.trim() !== "");
        if (filtered.length === 0) continue;
        const name = stripBullet(filtered[0]);
        const descLines = filtered.slice(1).map(stripBullet);
        result.projects.push({
          name,
          description: descLines.join(" ").trim(),
        });
      }

      // ── Certifications ──
    } else if (sec.includes("certif") || sec.includes("license")) {
      result.certifications = [
        ...(result.certifications || []),
        ...textContent.split("\n").map(stripBullet).filter(Boolean),
      ];

      // ── Languages ──
    } else if (sec.includes("language") || sec.includes("langue")) {
      result.languages = [
        ...(result.languages || []),
        ...textContent
          .split(/[,\n•]/)
          .map(stripBullet)
          .filter(Boolean),
      ];

      // ── Awards ──
    } else if (
      sec.includes("award") ||
      sec.includes("distinction") ||
      sec.includes("prix") ||
      sec.includes("achievement") ||
      sec.includes("honor")
    ) {
      result.awards = [
        ...(result.awards || []),
        ...textContent.split("\n").map(stripBullet).filter(Boolean),
      ];

      // ── Fallback → summary ──
    } else {
      if (!result.summary) {
        result.summary = textContent;
      } else {
        result.summary += "\n" + textContent;
      }
    }

    buffer = [];
  };

  // ── Main loop — skip past contact, iterate rest ──
  for (; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    if (isHeaderLine(trimmed)) {
      flushBuffer();
      currentSection = trimmed;
    } else {
      // Preserve the line (including blank lines) for entry splitting
      buffer.push(line);
    }
  }
  flushBuffer();

  return result;
}

// ─── Structured → Plain Text Converter ──────────────────────

export function resumeToText(data: ParsedResume): string {
  const lines: string[] = [];

  // Contact
  if (data.contact.name) lines.push(data.contact.name);
  const contactParts: string[] = [];
  if (data.contact.email) contactParts.push(data.contact.email);
  if (data.contact.phone) contactParts.push(data.contact.phone);
  if (data.contact.location) contactParts.push(data.contact.location);
  if (contactParts.length) lines.push(contactParts.join(" | "));
  if (data.contact.links?.length) lines.push(data.contact.links.join(" | "));
  lines.push("");

  // Summary
  if (data.summary) {
    lines.push("Summary");
    lines.push(data.summary);
    lines.push("");
  }

  // Experience
  if (data.experience.length > 0) {
    lines.push("Experience");
    lines.push("");
    for (const exp of data.experience) {
      let header = exp.title;
      if (exp.company) header += ` at ${exp.company}`;
      lines.push(header);
      if (exp.dates) lines.push(exp.dates);
      for (const bullet of exp.bullets) {
        lines.push(`• ${bullet}`);
      }
      lines.push("");
    }
  }

  // Education
  if (data.education.length > 0) {
    lines.push("Education");
    lines.push("");
    for (const edu of data.education) {
      lines.push(edu.degree);
      if (edu.school) lines.push(edu.school);
      if (edu.dates) lines.push(edu.dates);
      if (edu.details) lines.push(edu.details);
      lines.push("");
    }
  }

  // Skills
  if (data.skills.length > 0) {
    lines.push("Skills");
    lines.push(data.skills.join(", "));
    lines.push("");
  }

  // Projects
  if (data.projects?.length) {
    lines.push("Projects");
    lines.push("");
    for (const proj of data.projects) {
      lines.push(proj.name);
      if (proj.description) lines.push(proj.description);
      lines.push("");
    }
  }

  // Certifications
  if (data.certifications?.length) {
    lines.push("Certifications");
    for (const cert of data.certifications) {
      lines.push(`• ${cert}`);
    }
    lines.push("");
  }

  // Languages
  if (data.languages?.length) {
    lines.push("Languages");
    lines.push(data.languages.join(", "));
    lines.push("");
  }

  // Awards
  if (data.awards?.length) {
    lines.push("Awards");
    for (const award of data.awards) {
      lines.push(`• ${award}`);
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}

/**
 * Fallback OCR parser engine for scanned image-based PDF resumes.
 * Uses client-side canvas text detection when selectable text layers are empty.
 */
export async function extractTextWithOcrFallback(
  rawText: string,
  imageBlob?: Blob
): Promise<string> {
  if (rawText && rawText.trim().length >= 50) {
    return rawText.trim();
  }

  // If text layer is missing or image-scanned, attempt fallback OCR extraction
  if (typeof window !== "undefined" && imageBlob) {
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const imageUrl = URL.createObjectURL(imageBlob);
      const ret = await worker.recognize(imageUrl);
      await worker.terminate();
      URL.revokeObjectURL(imageUrl);
      return ret.data.text.trim();
    } catch {
      // Fallback to raw text if OCR engine unavailable
    }
  }

  return rawText;
}
