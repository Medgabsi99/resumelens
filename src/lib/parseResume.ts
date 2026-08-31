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

// ─── Section Mapping (Bilingual: English & French) ───────────────────────────

const NORMALIZED_SECTION_MAP: Record<
  string,
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "languages"
  | "awards"
> = {
  // Summary (English)
  summary: "summary",
  "professional summary": "summary",
  "executive summary": "summary",
  "career summary": "summary",
  "summary of qualifications": "summary",
  profile: "summary",
  "professional profile": "summary",
  "personal profile": "summary",
  "career profile": "summary",
  about: "summary",
  "about me": "summary",
  objective: "summary",
  "career objective": "summary",
  "professional objective": "summary",

  // Summary (French)
  sommaire: "summary",
  "sommaire professionnel": "summary",
  profil: "summary",
  "profil professionnel": "summary",
  "a propos": "summary",
  "a propos de moi": "summary",
  presentation: "summary",
  "presentation generale": "summary",
  resume: "summary",
  "resume professionnel": "summary",
  objectif: "summary",
  "objectif professionnel": "summary",

  // Experience (English)
  experience: "experience",
  experiences: "experience",
  "professional experience": "experience",
  "professional experiences": "experience",
  "work experience": "experience",
  "work experiences": "experience",
  "work history": "experience",
  "employment history": "experience",
  employment: "experience",
  "career history": "experience",
  "relevant experience": "experience",

  // Experience (French)
  "experience professionnelle": "experience",
  "experiences professionnelles": "experience",
  parcours: "experience",
  "parcours professionnel": "experience",
  "historique professionnel": "experience",
  "stages et experiences": "experience",
  "experiences et stages": "experience",
  stages: "experience",

  // Education (English)
  education: "education",
  "educational background": "education",
  "academic background": "education",
  "academic history": "education",
  academics: "education",

  // Education (French)
  formation: "education",
  formations: "education",
  etudes: "education",
  cursus: "education",
  "cursus universitaire": "education",
  "cursus academique": "education",
  "parcours academique": "education",
  "formation academique": "education",
  "diplomes et formations": "education",
  "formations et diplomes": "education",
  diplomes: "education",

  // Skills (English)
  skills: "skills",
  "technical skills": "skills",
  "core competencies": "skills",
  "key skills": "skills",
  expertise: "skills",
  "areas of expertise": "skills",
  "hard skills": "skills",
  "soft skills": "skills",
  technologies: "skills",
  "technologies and tools": "skills",
  "technologies & tools": "skills",
  "tools and technologies": "skills",
  "tools & technologies": "skills",
  tools: "skills",

  // Skills (French)
  competences: "skills",
  "competences techniques": "skills",
  "competences cles": "skills",
  "savoir faire": "skills",
  "savoir-faire": "skills",
  aptitudes: "skills",
  "technologies et outils": "skills",
  "outils et technologies": "skills",
  "langages et outils": "skills",

  // Projects (English & French)
  projects: "projects",
  "personal projects": "projects",
  "key projects": "projects",
  "selected projects": "projects",
  "academic projects": "projects",
  projets: "projects",
  "projets personnels": "projects",
  "projets realises": "projects",
  "projets academiques": "projects",
  "projets et realisations": "projects",
  realisations: "projects",

  // Certifications (English & French)
  certifications: "certifications",
  certification: "certifications",
  certificates: "certifications",
  licenses: "certifications",
  "licenses & certifications": "certifications",
  certificats: "certifications",
  "licences et certifications": "certifications",

  // Languages (English & French)
  languages: "languages",
  language: "languages",
  "language skills": "languages",
  "language proficiency": "languages",
  langues: "languages",
  "langues pratiquees": "languages",
  "competences linguistiques": "languages",

  // Awards (English & French)
  awards: "awards",
  honors: "awards",
  "honors & awards": "awards",
  distinctions: "awards",
  achievements: "awards",
  prix: "awards",
  recompenses: "awards",
  "prix et distinctions": "awards",
};

/** Regex that matches common bullet-point prefixes. */
const BULLET_PREFIX = /^[•\-◦✦▸►‣‐–*]\s*/;

/** Determine section category from a candidate header line (Bilingual). */
export function getSectionType(
  line: string
):
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "languages"
  | "awards"
  | null {
  if (!line) return null;
  const trimmed = line.trim();
  if (isBulletLine(trimmed)) return null;
  if (/[.!;]$/.test(trimmed)) return null;

  const clean = trimmed
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^[\s#*=_:–—\-#|]+|[\s#*=_:–—\-#|]+$/g, "")
    .trim();

  if (!clean || clean.length > 50 || clean.length < 3) return null;

  // Direct exact match
  if (NORMALIZED_SECTION_MAP[clean]) {
    return NORMALIZED_SECTION_MAP[clean];
  }

  // Prefix / suffix match (e.g. "Mes Formations", "Key Skills", "Mon Parcours")
  for (const [key, sec] of Object.entries(NORMALIZED_SECTION_MAP)) {
    if (
      clean === key ||
      clean === `mes ${key}` ||
      clean === `mon ${key}` ||
      clean === `my ${key}` ||
      clean === `key ${key}` ||
      clean === `core ${key}`
    ) {
      return sec;
    }
  }

  return null;
}

/** Does this line look like a section header? */
export function isHeaderLine(line: string): boolean {
  return getSectionType(line) !== null;
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
  return (
    // e.g. "Jan 2020 - Present", "2018 – 2020", "Fév 2025 – Présent", "02/2025 - 07/2025"
    /^\w{0,12}\s*\d{4}\s*[-–—to]+\s*(\w{0,12}\s*\d{4}|present|current|now|présent|actuel)/i.test(
      clean
    ) ||
    /^\d{1,2}\/\d{4}\s*[-–—to]+\s*(\d{1,2}\/\d{4}|present|current|now|présent|actuel)/i.test(
      clean
    ) ||
    /^\d{4}\s*[-–—]\s*\d{4}$/.test(clean) ||
    /^\d{4}\s*$/.test(clean) ||
    (/^(?:jan|feb|fév|mar|avr|apr|mai|may|jun|jul|juil|aug|août|sep|oct|nov|déc|dec)/i.test(
      clean
    ) &&
      /\d{4}/.test(clean))
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
    // Look for a date range anywhere in the lines (supports French months)
    for (const l of entryLines) {
      const dateMatch = l.match(
        /(?:(?:jan|feb|fév|mar|avr|apr|mai|may|jun|jul|juil|aug|août|sep|oct|nov|déc|dec)\w*\.?\s+)?\d{4}\s*[-–—to]+\s*(?:(?:jan|feb|fév|mar|avr|apr|mai|may|jun|jul|juil|aug|août|sep|oct|nov|déc|dec)\w*\.?\s+)?\d{4}|(?:(?:jan|feb|fév|mar|avr|apr|mai|may|jun|jul|juil|aug|août|sep|oct|nov|déc|dec)\w*\.?\s+)?\d{4}\s*[-–—to]+\s*(?:present|current|now|présent|actuel)/i
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

function isLikelyContactLine(line: string, indexInContact: number): boolean {
  const t = line.trim();
  if (!t) return false;
  if (isBulletLine(t)) return false;
  if (isHeaderLine(t)) return false;
  // First 1-2 lines can be name / title (short)
  if (indexInContact <= 1 && t.length < 70 && !t.includes(". ")) return true;
  // Contains email
  if (/[\w.+-]+@[\w.-]+\.\w+/.test(t)) return true;
  // Contains phone
  if (/[+]?[\d\s\-()]{7,}/.test(t) && t.length < 50) return true;
  // Contains URL / link / domain
  if (/(?:https?:\/\/|www\.|\.com|\.io|\.me|\.app|\.net|\.org|\.fr|\.tn|linkedin|github)/i.test(t))
    return true;
  // Short line with pipes e.g. "Hammamet, Tunisia | Developer"
  if (t.includes("|") && t.length < 100) return true;
  // Short city/country location or subtitle
  if (t.length < 50 && !t.includes(". ") && !t.endsWith(".")) return true;
  return false;
}

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
  const contactLines: string[] = [];
  let i = 0;
  for (; i < Math.min(10, rawLines.length); i++) {
    const trimmed = rawLines[i].trim();
    if (trimmed === "") {
      if (contactLines.length > 0) {
        const nextNonEmpty = rawLines.slice(i + 1).find((l) => l.trim() !== "");
        if (nextNonEmpty && !isLikelyContactLine(nextNonEmpty, contactLines.length)) {
          i++;
          break;
        }
      }
      continue;
    }
    if (!isLikelyContactLine(trimmed, contactLines.length)) {
      break;
    }
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

    const sectionType = getSectionType(currentSection);
    const sec = cleanSectionName(currentSection);
    const textContent = buffer
      .map((l) => l.trim())
      .filter(Boolean)
      .join("\n");

    // ── 1. Summary / Profile ──
    if (
      sectionType === "summary" ||
      sec.includes("summary") ||
      sec.includes("objective") ||
      sec.includes("profile") ||
      sec.includes("sommaire") ||
      sec.includes("presentation") ||
      sec.includes("profil")
    ) {
      // Safety: the summary section sometimes has experience entries
      // accidentally merged into it (AI or raw text may not emit an explicit header).
      // Split the buffer at the first sign of an experience entry or bullet point:
      const summaryLines: string[] = [];
      const experienceOverflow: string[] = [];
      let inExperience = false;

      for (let li = 0; li < buffer.length; li++) {
        const l = buffer[li];
        const t = l.trim();

        if (inExperience) {
          experienceOverflow.push(l);
          continue;
        }

        if (t === "") {
          if (summaryLines.length > 0) summaryLines.push("");
          continue;
        }

        // Check if this line is the START of experience:
        const isBullet = isBulletLine(t);
        const hasInlineBullet = /[•✦▸►‣]\s+[A-ZÀ-Ü]/.test(t);
        const isRoleHeader =
          /[\w\u00C0-\u024F]{3,}\s+[—–-]\s+[\w\u00C0-\u024F]{2,}/.test(t) &&
          !isBullet &&
          t.length < 120;
        const isDate =
          isDateLine(t) ||
          /\b(?:19|20)\d{2}\s*[-–—]\s*(?:(?:19|20)\d{2}|present|current|now|présent|actuel)\b/i.test(
            t
          );
        const isExpHeader = getSectionType(t) === "experience";

        if (
          isBullet ||
          hasInlineBullet ||
          (summaryLines.some((s) => s.trim() !== "") && (isRoleHeader || isDate || isExpHeader))
        ) {
          inExperience = true;
          if (hasInlineBullet && !isBullet) {
            const bulletIdx = t.search(/[•✦▸►‣]/);
            if (bulletIdx > 0) {
              const narrative = t.slice(0, bulletIdx).trim();
              const bulletPart = t.slice(bulletIdx).trim();
              if (narrative) summaryLines.push(narrative);
              if (bulletPart) experienceOverflow.push(bulletPart);
              continue;
            }
          }
          if (!isExpHeader) {
            experienceOverflow.push(l);
          }
          continue;
        }

        summaryLines.push(l);
      }

      result.summary =
        summaryLines
          .map((l) => l.trim())
          .filter(Boolean)
          .join("\n") || undefined;

      // Re-parse overflowed experience lines as experience entries
      if (experienceOverflow.length > 0) {
        const overflowEntries = splitIntoEntries(experienceOverflow);
        for (const entryLines of overflowEntries) {
          const filtered = entryLines.filter(Boolean);
          if (filtered.length === 0) continue;
          result.experience.push(parseExperienceEntry(filtered));
        }
      }

      // ── 2. Experience ──
    } else if (
      sectionType === "experience" ||
      sec.includes("experience") ||
      sec.includes("work") ||
      sec.includes("employment") ||
      sec.includes("history") ||
      sec.includes("parcours") ||
      sec.includes("stage")
    ) {
      const entries = splitIntoEntries(buffer);
      for (const entryLines of entries) {
        const filtered = entryLines.filter(Boolean);
        if (filtered.length === 0) continue;
        result.experience.push(parseExperienceEntry(filtered));
      }

      // ── 3. Education ──
    } else if (
      sectionType === "education" ||
      sec.includes("education") ||
      sec.includes("academic") ||
      sec.includes("formation") ||
      sec.includes("etudes") ||
      sec.includes("diplome") ||
      sec.includes("cursus")
    ) {
      const entries = splitIntoEntries(buffer);
      for (const entryLines of entries) {
        const filtered = entryLines.filter((l) => l.trim() !== "");
        if (filtered.length === 0) continue;

        const rawFirst = filtered[0] || "";

        // If the first line has an embedded year-range (e.g. "ESPRIT, Tunis — Diplôme 2021 – 2025"),
        // split it so the date doesn't appear in both degree AND dates columns.
        const embeddedDateRe =
          /\s+(\d{4}\s*[-–—]\s*(?:\d{4}|present|current|now|présent|actuel))\s*$/i;
        const embeddedMatch = rawFirst.match(embeddedDateRe);
        const degree = embeddedMatch
          ? rawFirst.slice(0, embeddedMatch.index).trim()
          : rawFirst.trim();
        const embeddedDate = embeddedMatch ? embeddedMatch[1].trim() : "";

        // School is the next non-date non-degree line
        const school = filtered.length > 1 && !isDateLine(filtered[1]) ? filtered[1] : "";

        // Dates: prefer explicit standalone date line, then embedded, then year search
        const explicitDateLine = filtered.find((l, idx) => idx > 0 && isDateLine(l));
        let dates = explicitDateLine || embeddedDate;
        if (!dates) {
          for (const l of filtered) {
            const m = l.match(/\b\d{4}\b/);
            if (m) {
              dates = l;
              break;
            }
          }
        }

        const headerSet = new Set<string>([rawFirst]);
        if (school) headerSet.add(school);
        if (explicitDateLine) headerSet.add(explicitDateLine);

        const detailLines = filtered.filter(
          (l) => !headerSet.has(l) && !isDateLine(l) && l.trim() !== degree
        );

        result.education.push({
          degree,
          school,
          dates,
          details: detailLines.join(". ").trim(),
        });
      }

      // ── 4. Skills ──
    } else if (
      sectionType === "skills" ||
      sec.includes("skill") ||
      sec.includes("competenc") ||
      sec.includes("expertise") ||
      sec.includes("aptitude") ||
      sec.includes("technolog") ||
      sec.includes("tool") ||
      sec.includes("savoir")
    ) {
      const skills = textContent
        .split(/[,\n•|✦▸►]/)
        .map((s) => s.replace(BULLET_PREFIX, "").trim())
        .filter(Boolean);
      result.skills = [...result.skills, ...skills];

      // ── 5. Projects ──
    } else if (
      sectionType === "projects" ||
      sec.includes("project") ||
      sec.includes("projet") ||
      sec.includes("realisation")
    ) {
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

      // ── 6. Certifications ──
    } else if (
      sectionType === "certifications" ||
      sec.includes("certif") ||
      sec.includes("license") ||
      sec.includes("licence")
    ) {
      result.certifications = [
        ...(result.certifications || []),
        ...textContent.split("\n").map(stripBullet).filter(Boolean),
      ];

      // ── 7. Languages ──
    } else if (sectionType === "languages" || sec.includes("language") || sec.includes("langue")) {
      result.languages = [
        ...(result.languages || []),
        ...textContent
          .split(/[,\n•]/)
          .map(stripBullet)
          .filter(Boolean),
      ];

      // ── 8. Awards ──
    } else if (
      sectionType === "awards" ||
      sec.includes("award") ||
      sec.includes("distinction") ||
      sec.includes("prix") ||
      sec.includes("achievement") ||
      sec.includes("honor") ||
      sec.includes("recompense")
    ) {
      result.awards = [
        ...(result.awards || []),
        ...textContent.split("\n").map(stripBullet).filter(Boolean),
      ];

      // ── 9. Fallback — unrecognized section header ──
    } else {
      const hasRoleLines = buffer.some((l) => {
        const t = l.trim();
        return /[\w\u00C0-\u024F]{3,}\s+[—–-]\s+[\w\u00C0-\u024F]{2,}/.test(t) && t.length < 120;
      });
      const hasBullets = buffer.some((l) => isBulletLine(l));
      const hasDateLines = buffer.some((l) => isDateLine(l.trim()));

      if (hasRoleLines || (hasBullets && hasDateLines)) {
        const entries = splitIntoEntries(buffer);
        for (const entryLines of entries) {
          const filtered = entryLines.filter(Boolean);
          if (filtered.length === 0) continue;
          result.experience.push(parseExperienceEntry(filtered));
        }
      } else if (!result.summary) {
        result.summary = textContent;
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
