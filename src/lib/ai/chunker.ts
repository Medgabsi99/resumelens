/**
 * chunker.ts
 *
 * Splits raw resume plain-text into semantically labelled chunks
 * suitable for embedding and vector storage.
 *
 * Strategy:
 *  1. Detect section headers with regex patterns (case-insensitive)
 *  2. Assign each section a `ChunkType` label
 *  3. Split long sections into sub-chunks of ~400 tokens (≈1,600 chars)
 *     with a 60-char overlap to avoid losing context at boundaries
 *  4. Drop chunks shorter than MIN_CHUNK_CHARS (whitespace, page numbers, etc.)
 */

export type ChunkType =
  | "contact"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "awards"
  | "other";

export interface ResumeChunk {
  index: number;
  type: ChunkType;
  content: string;
  /** Approximate token count (chars / 4) */
  approxTokens: number;
  metadata: Record<string, string>;
}

// ─── Section header patterns ──────────────────────────────────────────────────
const SECTION_PATTERNS: Array<{ type: ChunkType; pattern: RegExp }> = [
  {
    type: "summary",
    pattern:
      /^(SUMMARY|PROFESSIONAL SUMMARY|CAREER SUMMARY|OBJECTIVE|CAREER OBJECTIVE|PROFILE|ABOUT ME|PROFESSIONAL PROFILE|PERSONAL STATEMENT|EXECUTIVE SUMMARY|OVERVIEW|INTRODUCTION|BIO)$/i,
  },
  {
    type: "experience",
    pattern:
      /^(EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|WORK HISTORY|EMPLOYMENT HISTORY|EMPLOYMENT|CAREER HISTORY|RELEVANT EXPERIENCE|INTERNSHIP|INTERNSHIPS|INTERN EXPERIENCE|VOLUNTEER EXPERIENCE|VOLUNTEERING|COMMUNITY INVOLVEMENT|TEACHING EXPERIENCE|CONSULTING EXPERIENCE|FREELANCE EXPERIENCE)$/i,
  },
  {
    type: "education",
    pattern:
      /^(EDUCATION|EDUCATIONAL BACKGROUND|ACADEMIC BACKGROUND|ACADEMIC HISTORY|ACADEMICS|QUALIFICATIONS|DEGREES|ACADEMIC QUALIFICATIONS|TRAINING & EDUCATION)$/i,
  },
  {
    type: "skills",
    pattern:
      /^(SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES|KEY SKILLS|TECHNOLOGIES|TECHNICAL PROFICIENCIES|COMPETENCIES|TOOLS|LANGUAGES & TECHNOLOGIES|TECHNOLOGIES & TOOLS|TECH STACK|STACK|TOOLING|TOOLS & TECHNOLOGIES|PROGRAMMING LANGUAGES|HARD SKILLS|AREAS OF EXPERTISE|EXPERTISE)$/i,
  },
  {
    type: "projects",
    pattern:
      /^(PROJECTS|PERSONAL PROJECTS|PORTFOLIO|NOTABLE PROJECTS|SIDE PROJECTS|OPEN SOURCE|OPEN-SOURCE|SELECTED PROJECTS|KEY PROJECTS|ACADEMIC PROJECTS|RESEARCH PROJECTS)$/i,
  },
  {
    type: "certifications",
    pattern:
      /^(CERTIFICATIONS|CERTIFICATES|CREDENTIALS|LICENSES|PROFESSIONAL CERTIFICATIONS|TRAINING|ACCREDITATIONS|COURSES|ONLINE COURSES|PROFESSIONAL DEVELOPMENT)$/i,
  },
  {
    type: "awards",
    pattern:
      /^(AWARDS|HONORS|ACHIEVEMENTS|ACCOMPLISHMENTS|RECOGNITION|PUBLICATIONS|RESEARCH|PRESENTATIONS|CONFERENCES|PATENTS|ACTIVITIES|EXTRACURRICULAR|LEADERSHIP|MEMBERSHIPS|AFFILIATIONS|INTERESTS|LANGUAGES|REFERENCES)$/i,
  },
];

/**
 * Normalize a raw header line before pattern matching.
 * Strips decorative characters found in stylised resumes:
 *   ---Work Experience---  →  WORK EXPERIENCE
 *   ■ EDUCATION             →  EDUCATION
 *   == Projects ==         →  PROJECTS
 */
function normalizeHeader(line: string): string {
  return line
    .replace(/^[-=_*\u25a0\u25aa\u25b8\u25ba\u2022\u25c6\u25c7\u25b6\u25cf\s]+/, "")
    .replace(/[-=_*\u25a0\u25aa\u25b8\u25ba\u2022\u25c6\u25c7\u25b6\u25cf\s]+$/, "")
    .replace(/:$/, "")
    .trim();
}

const MAX_CHUNK_CHARS = 1_600; // ~400 tokens
const OVERLAP_CHARS = 80;
const MIN_CHUNK_CHARS = 60;

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Chunk a resume's plain text into labelled sections.
 * Returns an array of chunks ready to be embedded and stored.
 */
export function chunkResume(resumeText: string): ResumeChunk[] {
  const lines = resumeText.split(/\r?\n/);
  const sections: Array<{ type: ChunkType; lines: string[] }> = [];

  let currentType: ChunkType = "contact";
  let currentLines: string[] = [];

  for (const line of lines) {
    const detectedType = detectSectionType(line.trim());
    if (detectedType !== null) {
      // Save previous section
      if (currentLines.length > 0) {
        sections.push({ type: currentType, lines: currentLines });
      }
      currentType = detectedType;
      currentLines = []; // header itself is omitted from content (noisy for embeddings)
    } else {
      currentLines.push(line);
    }
  }

  // Flush last section
  if (currentLines.length > 0) {
    sections.push({ type: currentType, lines: currentLines });
  }

  // Convert sections → chunks (splitting long ones)
  const chunks: ResumeChunk[] = [];
  let globalIndex = 0;

  for (const section of sections) {
    const content = section.lines.join("\n").trim();
    if (content.length < MIN_CHUNK_CHARS) continue;

    const subChunks = splitIntoSubChunks(content);
    for (const sub of subChunks) {
      if (sub.length < MIN_CHUNK_CHARS) continue;
      chunks.push({
        index: globalIndex++,
        type: section.type,
        content: sub,
        approxTokens: Math.ceil(sub.length / 4),
        metadata: { sectionType: section.type },
      });
    }
  }

  return chunks;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectSectionType(line: string): ChunkType | null {
  if (!line) return null;
  const normalized = normalizeHeader(line);
  if (!normalized) return null;
  for (const { type, pattern } of SECTION_PATTERNS) {
    if (pattern.test(normalized)) return type;
  }
  return null;
}

/**
 * Split a block of text into sub-chunks of MAX_CHUNK_CHARS with OVERLAP_CHARS
 * overlap to preserve context at chunk boundaries.
 */
function splitIntoSubChunks(text: string): string[] {
  if (text.length <= MAX_CHUNK_CHARS) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + MAX_CHUNK_CHARS;

    // Try to break at a newline or sentence boundary
    if (end < text.length) {
      const breakAt = findNaturalBreak(text, end);
      end = breakAt;
    }

    chunks.push(text.slice(start, end).trim());
    start = Math.max(start + 1, end - OVERLAP_CHARS);
  }

  return chunks.filter((c) => c.length >= MIN_CHUNK_CHARS);
}

function findNaturalBreak(text: string, near: number): number {
  // Look backward for a newline within 200 chars
  const lookBack = Math.max(0, near - 200);
  const slice = text.slice(lookBack, near);
  const lastNewline = slice.lastIndexOf("\n");
  if (lastNewline !== -1) return lookBack + lastNewline + 1;

  // Fall back to nearest word boundary
  const lastSpace = slice.lastIndexOf(" ");
  if (lastSpace !== -1) return lookBack + lastSpace + 1;

  return near;
}

/**
 * Convenience: chunk a plain-text string and return just the content strings.
 * Useful for testing or quick embedding without metadata.
 */
export function chunkResumeTexts(resumeText: string): string[] {
  return chunkResume(resumeText).map((c) => c.content);
}
