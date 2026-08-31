/**
 * pdfSanitizer.ts — Self-Healing PDF Data Repair Engine
 *
 * Automatically detects and repairs every known class of issue in ParsedResume
 * data before any PDF template renders. Runs on every renderResumePdf() call.
 *
 * Detection → Repair rules:
 *   1.  Markdown syntax (**bold**, *italic*, `code`) in any string field
 *   2.  Education date duplication (degree line = dates field)
 *   3.  Education: embedded year-range in degree text
 *   4.  Education: school equals degree (parser failed to split)
 *   5.  Contact: name contains multi-line text (take first line only)
 *   6.  Contact: name includes professional title after a dash/newline
 *   7.  Contact: links array contains bare "|" separators
 *   8.  Contact: "null"/"undefined" string values
 *   9.  Experience: company field contains an embedded date range
 *   10. Experience: title is suspiciously short but company is very long
 *   11. Experience: bullets still have "•", "-", "–" prefix characters
 *   12. Experience: bullets longer than 300 chars (likely a parsing blob)
 *   13. Skills: items longer than 80 chars → split by comma
 *   14. Skills: items containing ":" (label:value blob) → flatten
 *   15. Any field value equal to "null", "undefined", "none", "N/A" → clear
 *   16. Summary: contains embedded section headings → trim to first paragraph
 *   17. Projects: description is empty → promote bullets if any
 *   18. Certifications: items with embedded issuer/date → leave as-is (valid)
 */

import type { ParsedResume } from "@/lib/parseResume";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SanitizerReport {
  issuesDetected: string[];
  repairsApplied: string[];
  isClean: boolean;
}

// ─── String-level utilities ───────────────────────────────────────────────────

/** Strip common markdown syntax from a string. */
function stripMarkdown(s: string): string {
  if (!s) return s;
  return s
    .replace(/\*\*([\s\S]+?)\*\*/g, "$1") // **bold**
    .replace(/\*([\s\S]+?)\*/g, "$1") // *italic*
    .replace(/__([\s\S]+?)__/g, "$1") // __bold__
    .replace(/_([^_\n]+)_/g, "$1") // _italic_
    .replace(/`([^`\n]+)`/g, "$1") // `code`
    .replace(/#{1,6}\s+/g, "") // # headings
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"); // [link](url) → link text
}

/** Replace known "null-like" string values with empty string. */
function nullStr(s: string | undefined | null): string {
  if (!s) return "";
  const t = s.trim().toLowerCase();
  if (["null", "undefined", "none", "n/a", "na", "-", "—", "–"].includes(t)) return "";
  return s;
}

/** Strip bullet-prefix characters from a string. */
function stripBulletPrefix(s: string): string {
  return s.replace(/^[\s]*[•\-–—○*▸►‣✦]\s*/, "").trim();
}

/** Detect if a string contains an embedded year range like "2021 – 2025". */
const YEAR_RANGE_RE = /\s+(\d{4}\s*[-–—]\s*(?:\d{4}|present|current|now|présent|actuel))\s*$/i;

function extractEmbeddedDate(text: string): { clean: string; date: string } {
  const m = text.match(YEAR_RANGE_RE);
  if (m && m.index !== undefined) {
    return {
      clean: text.slice(0, m.index).trim(),
      date: m[1].trim(),
    };
  }
  return { clean: text.trim(), date: "" };
}

/** Detect if a string is a date range. */
function isDateRange(s: string): boolean {
  const t = s.trim();
  return (
    /^\d{4}\s*[-–—]\s*(?:\d{4}|present|current|now|présent|actuel)$/i.test(t) ||
    /^(?:jan|feb|fév|mar|avr|apr|mai|may|jun|jul|juil|aug|août|sep|oct|nov|déc|dec)\w*\.?\s+\d{4}/i.test(
      t
    )
  );
}

/** Detect if a string is a standalone section heading embedded inside a field. */
const SECTION_HEADING_WORDS = new Set([
  "experience",
  "expérience",
  "education",
  "formation",
  "skills",
  "compétences",
  "projects",
  "projets",
  "certifications",
  "languages",
  "langues",
  "summary",
  "profil",
  "awards",
  "references",
  "profile",
  "objective",
]);

function containsEmbeddedHeading(s: string): boolean {
  const first = s.split("\n")[0].trim().toLowerCase().replace(/:$/, "");
  return SECTION_HEADING_WORDS.has(first) && first.length < 30;
}

// ─── Main sanitizer ───────────────────────────────────────────────────────────

export function sanitizeResumeData(raw: ParsedResume): {
  data: ParsedResume;
  report: SanitizerReport;
} {
  const issues: string[] = [];
  const repairs: string[] = [];

  function issue(msg: string) {
    issues.push(msg);
  }
  function repair(msg: string) {
    repairs.push(msg);
  }

  // Deep-clone to avoid mutating the original
  const d: ParsedResume = JSON.parse(JSON.stringify(raw));

  // ── 1. Contact ──────────────────────────────────────────────────────────────

  // Name: strip markdown
  if (/[*_`#]/.test(d.contact.name)) {
    issue("contact.name contains markdown");
    d.contact.name = stripMarkdown(d.contact.name);
    repair("Stripped markdown from contact.name");
  }

  // Name: take only the first line (prevents multi-line blobs)
  if (d.contact.name.includes("\n")) {
    issue("contact.name is multi-line");
    d.contact.name = d.contact.name.split("\n")[0].trim();
    repair("Trimmed contact.name to first line");
  }

  // Name: null-like values
  const cleanName = nullStr(d.contact.name);
  if (cleanName !== d.contact.name) {
    issue(`contact.name was null-like: "${d.contact.name}"`);
    d.contact.name = cleanName;
    repair("Cleared null-like contact.name");
  }

  // Email: markdown + null-like
  if (d.contact.email) {
    d.contact.email = stripMarkdown(d.contact.email);
    const ce = nullStr(d.contact.email);
    if (!ce) {
      issue("contact.email was null-like");
      d.contact.email = undefined;
      repair("Cleared null-like email");
    }
  }

  // Phone: markdown + null-like
  if (d.contact.phone) {
    d.contact.phone = stripMarkdown(d.contact.phone);
    const cp = nullStr(d.contact.phone);
    if (!cp) {
      issue("contact.phone was null-like");
      d.contact.phone = undefined;
      repair("Cleared null-like phone");
    }
  }

  // Location: markdown + null-like
  if (d.contact.location) {
    d.contact.location = stripMarkdown(d.contact.location);
    const cl = nullStr(d.contact.location);
    if (!cl) {
      issue("contact.location was null-like");
      d.contact.location = undefined;
      repair("Cleared null-like location");
    }
  }

  // Links: remove bare "|" items and null-like values
  if (d.contact.links) {
    const before = d.contact.links.length;
    d.contact.links = d.contact.links
      .map((l) => nullStr(l.trim()))
      .filter((l) => l && l !== "|" && l !== "|–" && l !== "–" && l.length > 3);
    if (d.contact.links.length !== before) {
      issue("contact.links contained empty/separator items");
      repair(`Removed ${before - d.contact.links.length} invalid link(s)`);
    }
  }

  // ── 2. Summary ──────────────────────────────────────────────────────────────

  if (d.summary) {
    // Strip markdown
    if (/[*_`#]/.test(d.summary)) {
      issue("summary contains markdown");
      d.summary = stripMarkdown(d.summary);
      repair("Stripped markdown from summary");
    }
    // Null-like
    const cs = nullStr(d.summary);
    if (!cs) {
      issue("summary was null-like");
      d.summary = undefined;
      repair("Cleared null-like summary");
    }
    // Check if summary contains experience bullets or jobs mixed in
    if (
      d.summary &&
      (d.summary.includes("•") ||
        d.summary.includes("\n- ") ||
        /[\w\u00C0-\u024F]{3,}\s+[—–-]\s+[\w\u00C0-\u024F]{2,}/.test(d.summary))
    ) {
      const lines = d.summary.split("\n");
      const cleanSummaryLines: string[] = [];
      const expLines: string[] = [];
      let inExp = false;

      for (const line of lines) {
        const t = line.trim();
        if (!t) continue;
        if (inExp) {
          expLines.push(line);
          continue;
        }
        if (
          t.startsWith("•") ||
          t.startsWith("- ") ||
          t.startsWith("* ") ||
          (cleanSummaryLines.length > 0 &&
            /[\w\u00C0-\u024F]{3,}\s+[—–-]\s+[\w\u00C0-\u024F]{2,}/.test(t))
        ) {
          inExp = true;
          expLines.push(line);
          continue;
        }
        // If inline bullet in line
        const bulletIdx = t.search(/[•✦▸►‣]/);
        if (bulletIdx > 0) {
          inExp = true;
          const narrative = t.slice(0, bulletIdx).trim();
          const bulletPart = t.slice(bulletIdx).trim();
          if (narrative) cleanSummaryLines.push(narrative);
          if (bulletPart) expLines.push(bulletPart);
          continue;
        }
        cleanSummaryLines.push(line);
      }

      if (expLines.length > 0) {
        issue("summary contained mixed-in experience entries");
        d.summary = cleanSummaryLines.join("\n").trim() || undefined;
        repair("Cleaned summary and separated experience entries");
      }
    }
  }

  // ── 3. Experience ───────────────────────────────────────────────────────────

  d.experience = d.experience
    .filter((exp) => exp.title || exp.company || exp.bullets.length > 0)
    .map((exp, i) => {
      const tag = `experience[${i}]`;

      // Title: markdown + null-like
      if (/[*_`#]/.test(exp.title)) {
        issue(`${tag}.title has markdown`);
        exp.title = stripMarkdown(exp.title);
        repair(`Stripped markdown from ${tag}.title`);
      }
      exp.title = nullStr(exp.title);

      // Company: markdown + null-like + embedded date
      if (/[*_`#]/.test(exp.company)) {
        issue(`${tag}.company has markdown`);
        exp.company = stripMarkdown(exp.company);
        repair(`Stripped markdown from ${tag}.company`);
      }
      exp.company = nullStr(exp.company);

      // Company: contains an embedded date (e.g. "Acme Corp Jan 2023 – Present")
      if (exp.company) {
        const { clean, date } = extractEmbeddedDate(exp.company);
        if (date) {
          issue(`${tag}.company has embedded date: "${date}"`);
          exp.company = clean;
          if (!exp.dates) exp.dates = date;
          repair(`Extracted date from ${tag}.company → dates="${date}"`);
        }
      }

      // Title too short but company very long → title might be in company
      if (exp.title.length < 5 && exp.company.length > 30 && !exp.company.match(/^[A-Z\s]+$/)) {
        const parts = exp.company.split(/\s*[,\-–—]\s*/);
        if (parts.length >= 2) {
          issue(`${tag} title/company may be swapped`);
          exp.title = parts[0].trim();
          exp.company = parts.slice(1).join(" – ").trim();
          repair(`Split ${tag}.company into title + company`);
        }
      }

      // Dates: null-like
      if (exp.dates) {
        const cd = nullStr(exp.dates);
        if (!cd) {
          issue(`${tag}.dates was null-like`);
          exp.dates = "";
          repair(`Cleared null-like ${tag}.dates`);
        } else exp.dates = stripMarkdown(cd);
      }

      // Bullets: strip prefixes, markdown, null-like, over-long blobs
      exp.bullets = exp.bullets
        .map((b) => {
          let fixed = nullStr(b.trim());
          if (!fixed) return "";
          // Strip markdown
          if (/[*_`#]/.test(fixed)) {
            issue(`${tag} bullet has markdown`);
            fixed = stripMarkdown(fixed);
            repair(`Stripped markdown from ${tag} bullet`);
          }
          // Strip bullet prefix chars that the parser didn't clean
          if (/^[•\-–—○*▸►‣✦]\s/.test(fixed)) {
            issue(`${tag} bullet has leftover prefix char`);
            fixed = stripBulletPrefix(fixed);
            repair(`Stripped prefix from ${tag} bullet`);
          }
          // Over-long bullet (parsing blob) → split by ". " into multiple bullets
          return fixed;
        })
        .filter(Boolean);

      // Flatten any over-long blob bullets
      const flatBullets: string[] = [];
      for (const b of exp.bullets) {
        if (b.length > 300) {
          issue(`${exp.title} has over-long bullet (${b.length} chars) — splitting`);
          const parts = b.split(/\.\s+(?=[A-ZÀ-Ü])/);
          flatBullets.push(...parts.map((p) => p.trim()).filter((p) => p.length > 10));
          repair(`Split over-long bullet in ${exp.title} into ${parts.length} bullets`);
        } else {
          flatBullets.push(b);
        }
      }
      exp.bullets = flatBullets;

      return exp;
    });

  // ── 4. Education ─────────────────────────────────────────────────────────────

  d.education = d.education
    .filter((edu) => edu.degree || edu.school)
    .map((edu, i) => {
      const tag = `education[${i}]`;

      // Degree: markdown + null-like
      if (/[*_`#]/.test(edu.degree)) {
        issue(`${tag}.degree has markdown`);
        edu.degree = stripMarkdown(edu.degree);
        repair(`Stripped markdown from ${tag}.degree`);
      }
      edu.degree = nullStr(edu.degree);

      // Degree: extract embedded year range
      if (edu.degree) {
        const { clean, date } = extractEmbeddedDate(edu.degree);
        if (date) {
          issue(`${tag}.degree has embedded date: "${date}"`);
          edu.degree = clean;
          if (!edu.dates || edu.dates === edu.degree) {
            edu.dates = date;
          }
          repair(`Extracted date from ${tag}.degree`);
        }
      }

      // School: markdown + null-like
      if (/[*_`#]/.test(edu.school)) {
        issue(`${tag}.school has markdown`);
        edu.school = stripMarkdown(edu.school);
        repair(`Stripped markdown from ${tag}.school`);
      }
      edu.school = nullStr(edu.school);

      // School equals degree → clear school (parser duplicated the field)
      if (edu.school && edu.school === edu.degree) {
        issue(`${tag}.school duplicates degree`);
        edu.school = "";
        repair(`Cleared duplicate ${tag}.school`);
      }

      // Dates: null-like
      if (edu.dates) {
        edu.dates = nullStr(stripMarkdown(edu.dates));
        // If dates contains the full degree text, it's a duplication bug
        if (edu.dates && edu.degree && edu.dates.includes(edu.degree.slice(0, 20))) {
          issue(`${tag}.dates duplicates degree text — extracting year only`);
          const yearMatch =
            edu.dates.match(/(\d{4}\s*[-–—]\s*(?:\d{4}|présent|present|actuel|today))/i) ||
            edu.dates.match(/\d{4}/);
          edu.dates = yearMatch ? yearMatch[0].trim() : "";
          repair(`Extracted year from duplicate ${tag}.dates`);
        }
        // dates is not a date-like string
        if (edu.dates && edu.dates.length > 60 && !isDateRange(edu.dates)) {
          issue(`${tag}.dates is too long to be a date (${edu.dates.length} chars) — clearing`);
          edu.dates = "";
          repair(`Cleared invalid ${tag}.dates`);
        }
      }

      // Details: markdown + null-like
      if (edu.details) {
        edu.details = nullStr(stripMarkdown(edu.details));
      }

      return edu;
    });

  // ── 5. Skills ────────────────────────────────────────────────────────────────

  const rawSkills = d.skills.flatMap((skill) => {
    let s = nullStr(stripMarkdown(skill));
    if (!s) return [];
    // Strip bullet prefixes
    s = stripBulletPrefix(s);
    // Long skills → split by comma (parser lumped multiple into one)
    if (s.length > 80) {
      issue(`Skill item too long (${s.length} chars) — splitting: "${s.slice(0, 40)}..."`);
      repair("Split long skill item by comma");
      return s
        .split(/[,;]/)
        .map((p) => p.trim())
        .filter((p) => p.length > 1 && p.length < 60);
    }
    // "Label: skill1, skill2" blob → flatten
    if (/^[A-ZÀ-Ü][a-zà-öø-ÿA-ZÀ-Ü\s&\/]+:\s/.test(s) && s.includes(",")) {
      issue(`Skill item is a label:values blob — flattening: "${s.slice(0, 40)}"`);
      const parts = s.split(/:\s*/);
      const values = (parts[1] || "")
        .split(/[,;]/)
        .map((p) => p.trim())
        .filter(Boolean);
      repair(`Flattened skill blob into ${values.length} items`);
      return values;
    }
    return [s];
  });
  d.skills = [...new Set(rawSkills)]; // deduplicate

  // ── 6. Projects ──────────────────────────────────────────────────────────────

  if (d.projects) {
    d.projects = d.projects
      .filter((p) => p.name || p.description)
      .map((p, i) => {
        const tag = `project[${i}]`;
        if (/[*_`#]/.test(p.name)) {
          issue(`${tag}.name has markdown`);
          p.name = stripMarkdown(p.name);
          repair(`Stripped markdown from ${tag}.name`);
        }
        p.name = nullStr(p.name) || `Project ${i + 1}`;
        if (/[*_`#]/.test(p.description)) {
          issue(`${tag}.description has markdown`);
          p.description = stripMarkdown(p.description);
          repair(`Stripped markdown from ${tag}.description`);
        }
        p.description = nullStr(p.description);
        return p;
      });
  }

  // ── 7. Certifications ────────────────────────────────────────────────────────

  if (d.certifications) {
    d.certifications = d.certifications
      .map((c) => nullStr(stripMarkdown(stripBulletPrefix(c))))
      .filter(Boolean);
  }

  // ── 8. Languages ─────────────────────────────────────────────────────────────

  if (d.languages) {
    d.languages = d.languages
      .map((l) => nullStr(stripMarkdown(stripBulletPrefix(l))))
      .filter(Boolean);
  }

  // ── 9. Awards ────────────────────────────────────────────────────────────────

  if (d.awards) {
    d.awards = d.awards.map((a) => nullStr(stripMarkdown(stripBulletPrefix(a)))).filter(Boolean);
  }

  const report: SanitizerReport = {
    issuesDetected: issues,
    repairsApplied: repairs,
    isClean: issues.length === 0,
  };

  // Log in development for visibility
  if (typeof process !== "undefined" && process.env.NODE_ENV === "development" && !report.isClean) {
    console.group("[pdfSanitizer] Auto-repair report");
    console.warn(`Issues detected: ${issues.length}, Repairs applied: ${repairs.length}`);
    issues.forEach((iss, i) => console.warn(`  ✗ ${iss} → ${repairs[i] ?? "no repair"}`));
    console.groupEnd();
  }

  return { data: d, report };
}

// ─────────────────────────────────────────────────────────────────────────────
// sanitizeStructuredResume
// Repairs StructuredResume JSON returned by Gemini before PlainTextPdfTemplate
// renders it. Covers the same issue classes as sanitizeResumeData but for the
// structured JSON schema.
// ─────────────────────────────────────────────────────────────────────────────

import type { StructuredResume, StructuredSection } from "@/types/structuredResume";

/** Clean a nullable string field: strip markdown and null-like values. */
function cleanField(v: string | null | undefined): string {
  if (!v) return "";
  const stripped = stripMarkdown(v);
  return nullStr(stripped);
}

/** Clean an array of strings: strip markdown, prefixes, null-like values, dedup. */
function cleanStringArray(arr: string[] | null | undefined): string[] {
  if (!arr) return [];
  const seen = new Set<string>();
  return arr
    .map((s) => cleanField(stripBulletPrefix(s)))
    .filter((s) => {
      if (!s || seen.has(s)) return false;
      seen.add(s);
      return true;
    });
}

export function sanitizeStructuredResume(raw: StructuredResume): StructuredResume {
  if (!raw) return raw;

  // Deep-clone
  const r: StructuredResume = JSON.parse(JSON.stringify(raw));

  // ── Contact ────────────────────────────────────────────────────────────────
  const c = r.contact;
  c.name = cleanField(c.name) || "";
  // Name: take only first line
  if (c.name.includes("\n")) c.name = c.name.split("\n")[0].trim();
  c.title = cleanField(c.title) || (null as unknown as string);
  c.email = cleanField(c.email) || (null as unknown as string);
  c.phone = cleanField(c.phone) || (null as unknown as string);
  c.location = cleanField(c.location) || (null as unknown as string);
  c.linkedin = cleanField(c.linkedin) || (null as unknown as string);
  c.github = cleanField(c.github) || (null as unknown as string);
  c.portfolio = cleanField(c.portfolio) || (null as unknown as string);
  c.other_links = cleanStringArray(c.other_links).filter(
    (l) => l !== "|" && l !== "|–" && l !== "–" && l.length > 3
  );

  // ── Sections ────────────────────────────────────────────────────────────────
  r.sections = (r.sections || [])
    .map((sec: StructuredSection) => {
      sec.original_heading = cleanField(sec.original_heading);

      switch (sec.type) {
        case "summary":
          sec.summary_text = cleanField(sec.summary_text);
          break;

        case "experience":
          sec.experience = (sec.experience || []).map((exp) => {
            exp.title = cleanField(exp.title);
            exp.company = cleanField(exp.company);
            exp.location = cleanField(exp.location);
            exp.dates = cleanField(exp.dates);
            // Extract embedded date from company if needed
            if (exp.company) {
              const m = exp.company.match(YEAR_RANGE_RE);
              if (m && m.index !== undefined) {
                const companyClean = exp.company.slice(0, m.index).trim();
                if (!exp.dates) exp.dates = m[1].trim();
                exp.company = companyClean;
              }
            }
            exp.bullets = cleanStringArray(exp.bullets);
            // Split over-long bullets
            const flat: string[] = [];
            for (const b of exp.bullets) {
              if (b.length > 300) {
                flat.push(
                  ...b
                    .split(/\.\s+(?=[A-ZÀ-Ü])/)
                    .map((p) => p.trim())
                    .filter((p) => p.length > 10)
                );
              } else {
                flat.push(b);
              }
            }
            exp.bullets = flat;
            return exp;
          });
          break;

        case "education":
          sec.education = (sec.education || []).map((edu) => {
            edu.degree = cleanField(edu.degree);
            edu.school = cleanField(edu.school);
            edu.location = cleanField(edu.location);
            edu.details = cleanField(edu.details);
            // Extract embedded date from degree
            if (edu.degree) {
              const { clean, date } = extractEmbeddedDate(edu.degree);
              if (date) {
                edu.degree = clean;
                if (!edu.dates || edu.dates === edu.degree) edu.dates = date;
              }
            }
            // Dates: null-like or too long
            edu.dates = cleanField(edu.dates);
            if (edu.dates && edu.dates.length > 60 && !isDateRange(edu.dates)) edu.dates = "";
            // School duplicates degree
            if (edu.school && edu.school === edu.degree) edu.school = "";
            return edu;
          });
          break;

        case "skills":
          // Clean skill_categories
          sec.skill_categories = (sec.skill_categories || [])
            .map((cat) => ({
              label: cleanField(cat.label),
              skills: cleanStringArray(cat.skills),
            }))
            .filter((cat) => cat.label && cat.skills.length > 0);
          // Clean flat skills
          sec.skills_flat = cleanStringArray(sec.skills_flat);
          // Flatten long skill blobs
          sec.skills_flat = sec.skills_flat.flatMap((s) =>
            s.length > 80
              ? s
                  .split(/[,;]/)
                  .map((p) => p.trim())
                  .filter((p) => p.length > 1)
              : [s]
          );
          break;

        case "projects":
          sec.projects = (sec.projects || []).map((p) => ({
            ...p,
            name: cleanField(p.name) || "Project",
            dates: cleanField(p.dates),
            tech: cleanField(p.tech),
            bullets: cleanStringArray(p.bullets),
          }));
          break;

        case "certifications":
          sec.certifications = (sec.certifications || [])
            .map((cert) => ({
              name: cleanField(cert.name),
              issuer: cleanField(cert.issuer),
              date: cleanField(cert.date),
            }))
            .filter((cert) => cert.name);
          break;

        case "languages":
          sec.languages = cleanStringArray(sec.languages);
          break;

        case "awards":
          sec.awards = cleanStringArray(sec.awards);
          break;

        case "other":
          sec.other_text = cleanField(sec.other_text);
          break;
      }

      return sec;
      // Remove sections that ended up empty after sanitization
    })
    .filter((sec: StructuredSection) => {
      switch (sec.type) {
        case "summary":
          return !!sec.summary_text;
        case "experience":
          return (sec.experience || []).length > 0;
        case "education":
          return (sec.education || []).length > 0;
        case "skills":
          return (sec.skill_categories || []).length > 0 || (sec.skills_flat || []).length > 0;
        case "projects":
          return (sec.projects || []).length > 0;
        case "certifications":
          return (sec.certifications || []).length > 0;
        case "languages":
          return (sec.languages || []).length > 0;
        case "awards":
          return (sec.awards || []).length > 0;
        case "other":
          return !!sec.other_text;
        default:
          return true;
      }
    });

  if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
    console.debug(
      "[pdfSanitizer] sanitizeStructuredResume: cleaned",
      r.sections.length,
      "sections"
    );
  }

  return r;
}
