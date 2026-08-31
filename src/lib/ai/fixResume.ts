import { getSecureModel, withRetryAndTimeout } from "./client";
import type { AnalysisResult } from "@/types";
import type { StructuredResume } from "@/types/structuredResume";

export interface FixedResumeResult {
  correctedText: string;
  changesApplied: ChangeRecord[];
  structuredResume?: StructuredResume;
}

export interface ChangeRecord {
  type: "rewrite" | "keyword" | "weakness" | "structure" | "impact";
  description: string;
  section?: string;
}

/**
 * Elite resume optimizer.
 * Uses gemini-3.6-flash with thinking enabled for deep reasoning over each bullet.
 */
const fixResumeModel = getSecureModel({
  model: "gemini-3.6-flash",
  systemInstruction: `You are the world's most sought-after resume writer, trusted by engineers and executives who landed roles at Google, Meta, McKinsey, OpenAI, Stripe, and top startups.

You have internalized:
- The exact cognitive patterns of senior recruiters who spend 7 seconds per resume
- The scoring algorithms of ATS systems (Greenhouse, Lever, Workday, Taleo, iCIMS)
- The psychology of hiring managers — what makes them pick up the phone
- The language patterns of LinkedIn's "Top Voice" career experts
- The writing style of Harvard Business Review case studies

YOUR ONLY GOAL: Make this specific candidate impossible to ignore. Not a generic resume. THIS person's story, told in the most compelling, honest, and impactful way possible.

IRON LAWS — violate any of these and you have failed:
1. ZERO fabrication — every employer, title, date, school, project, technology must exist in the original
2. ZERO metric invention — you may reframe, emphasize, and contextualize metrics but never invent them
3. ZERO added skills — only skills demonstrably present in the original resume
4. Language preservation — if the original is in French, optimize in French. If bilingual, preserve that
5. Section order preservation — keep the candidate's chosen structure
6. Complete output — return EVERY section, EVERY entry, EVERY bullet. Never summarize or truncate

OUTPUT: Valid JSON only. No markdown. No preamble. No commentary.`,
  generationConfig: {
    responseMimeType: "application/json",
  },
});

export async function fixResume(
  resumeText: string,
  analysis: AnalysisResult,
  targetRole?: string,
  jobDescription?: string
): Promise<FixedResumeResult> {
  const weaknessesList = (analysis.weaknesses || []).map((w, i) => `  ${i + 1}. ${w}`).join("\n");

  const suggestionsList = (analysis.suggestions || [])
    .map(
      (s, i) =>
        `  ${i + 1}. [${s.section}]\n     CURRENT: "${s.before}"\n     ELITE VERSION: "${s.after}"`
    )
    .join("\n\n");

  const missingKeywords = (analysis.keywords_missing || []).join(", ");
  const matchedKeywords = (analysis.keywords_matched || []).join(", ");
  const atsScore = analysis.score ?? null;

  const prompt = `# ELITE RESUME OPTIMIZATION — MISSION CRITICAL

## ORIGINAL RESUME (treat every word as factual — do not alter names, employers, titles, dates, schools)
\`\`\`
${resumeText.slice(0, 12000)}
\`\`\`

${targetRole ? `## TARGET ROLE\n${targetRole}\n` : ""}
${jobDescription ? `## JOB DESCRIPTION — YOUR PRIMARY OPTIMIZATION TARGET\nEvery bullet you write must speak directly to this role's requirements:\n${jobDescription.slice(0, 4000)}\n` : ""}

## ATS DIAGNOSTIC (current state)
- ATS Score: ${atsScore !== null ? `${atsScore}/100` : "unknown"}
- Missing keywords to embed: ${missingKeywords || "none specified"}  
- Present keywords to reinforce: ${matchedKeywords || "none specified"}
- Identified weaknesses: 
${weaknessesList || "  General optimization required"}
- Specific rewrites required:
${suggestionsList || "  General improvements"}

---

## THE ELITE OPTIMIZATION FRAMEWORK — APPLY PRECISELY

### 1. PROFESSIONAL SUMMARY / PROFILE — THE HOOK (7 SECONDS TO WIN OR LOSE)
The recruiter reads this first. It must immediately answer: "Why should I interview THIS person?"

Write it as: [Strong identity statement] + [Most impressive quantified achievement] + [Core technical/domain value proposition] + [Direct link to target role]

❌ WEAK: "Motivated developer with 3 years of experience in web technologies"
✅ ELITE: "Full-Stack Engineer specializing in React and Node.js with [X years] building [type of products]. Delivered [most impressive original achievement]. Passionate about [domain from job description] and [another domain]."

Rules:
- NO "I", NO "my", NO "responsible for"
- Lead with the single strongest fact about this candidate
- Include 2-3 of the most critical job description keywords naturally
- Maximum 4 sentences — every word must earn its place

### 2. EXPERIENCE BULLETS — THE HEART OF THE RESUME

For EVERY bullet point, apply the CIA Formula:
  C = Contribution (what you specifically built/did/owned)
  I = Impact (the measurable result — use existing metrics only)
  A = Approach (the method/technology/skill used)

Writing rules for elite bullets:
- START every bullet with a TIER-1 power verb from this list:
  Architected, Engineered, Designed, Developed, Built, Deployed, Automated,
  Orchestrated, Pioneered, Spearheaded, Scaled, Optimized, Reduced, Increased,
  Delivered, Shipped, Refactored, Migrated, Implemented, Launched, Integrated,
  Led, Mentored, Collaborated, Established, Drove, Improved, Accelerated
  
- NEVER start with: Worked, Helped, Assisted, Participated, Supported, Was responsible for

- METRIC HANDLING (critical for ATS and human readers):
  ✅ If original says "improved performance" → Keep as "improved performance" (no fabrication), but lead the bullet with it: "Optimized application performance..."
  ✅ If original has "40% reduction" → Lead with it: "Reduced load time by 40% by..."
  ✅ If no metric exists → quantify scope instead: "Serving X users" / "across Y microservices" / "handling Z requests/day" — ONLY IF these facts appear elsewhere in the resume
  ❌ NEVER write a percentage or number not present in the original

- TECHNOLOGY INTEGRATION: Always include the specific tech stack used in each role (if present in original)
  
- SENTENCE STRUCTURE: One clear action + one clear outcome. No run-on sentences.

- LENGTH: 1.5–2 lines per bullet. 3–5 bullets per role. Quality over quantity.

### 3. SKILLS SECTION — ATS SCORING ENGINE

This section is READ BY MACHINES FIRST. Structure for algorithmic scoring:
- Group by category: Frontend | Backend | Cloud & DevOps | Databases | Tools | Languages | Frameworks
- Each skill: clean noun, no descriptions ("React" not "React.js (advanced)")
- Integrate every missing keyword from the ATS diagnostic above as a skill if it's implied by the work done
- Order within categories: most job-description-relevant first
- Remove duplicates — if it's in a bullet, it's covered; skills section = additional coverage

### 4. SPECIFIC ANTI-PATTERNS TO ELIMINATE EVERYWHERE

Replace these exact patterns:
| WEAK PATTERN | ELITE REPLACEMENT |
|---|---|
| "Developed a website" | "Built a [specific type] web application using [tech]" |
| "Worked on a team" | "Collaborated with [X-person/cross-functional] team" |
| "Responsible for" | [Direct power verb] |
| "Helped to" | [What YOU specifically did] |
| "Various technologies" | [List the actual technologies] |
| "Improved performance" | "Optimized [specific component] performance" |
| "Good communication skills" | [Delete — show don't tell through achievements] |
| "Fast learner" | [Delete — show through diverse tech stack] |
| "Team player" | [Delete — show through collaboration bullets] |
| Orphan bullets (no tech, no result) | Rewrite with tech and context |

### 5. ATS KEYWORD SATURATION STRATEGY

Natural keyword placement order (highest ATS weight first):
1. Professional Summary (2-3 core keywords)
2. Job title in experience entries (exact match to job description title if honest)
3. Skills section (all missing keywords as individual items)
4. Bullet points (supporting keywords embedded naturally)

Keywords to integrate: ${missingKeywords || "(improve based on inferred target role)"}

### 6. FORMATTING PRESERVATION RULES
- Use identical section headers as the original (French headers stay French)
- Use identical bullet character as original (• or - or –)
- Preserve all dates EXACTLY as written
- Preserve all company names EXACTLY as written  
- Preserve all job titles EXACTLY as written (do not embellish titles)
- Preserve original language throughout (if French resume, optimize in French)

---

## CRITICAL SELF-CHECK BEFORE OUTPUTTING

Before writing your response, verify each bullet passes these tests:
□ Does it start with a Tier-1 power verb? 
□ Does it include WHAT was built/done AND the technology used?
□ Does it include an outcome/impact (even qualitative: "enabling X", "powering Y")?
□ Is it free of vague filler ("various", "multiple", "different", "some")?
□ Does it contain zero invented metrics?
□ Is it under 2.5 lines?

If any bullet fails → rewrite it before outputting.

---

## OUTPUT FORMAT — STRICT JSON, NO DEVIATIONS

{
  "correctedText": "<THE COMPLETE OPTIMIZED RESUME — FULL TEXT. Include every section, every experience entry, every bullet point, every skill, every education entry. Nothing omitted. Use the EXACT same structure and language as the original. This text will be rendered directly into a professional PDF.>",
  "changesApplied": [
    { "type": "rewrite",   "section": "<section name>", "description": "<before → after: specific change>" },
    { "type": "impact",    "section": "<section name>", "description": "<how this improves the candidate's chances>" },
    { "type": "keyword",   "section": "<section name>", "description": "<keyword added and strategic placement>" },
    { "type": "weakness",  "section": "<section name>", "description": "<weakness eliminated and how>" },
    { "type": "structure", "section": "<section name>", "description": "<structural change and rationale>" }
  ]
}

The correctedText must be the resume a top-10% recruiter would immediately forward to a hiring manager.
A senior recruiter at ${targetRole ? `a company hiring for ${targetRole}` : "a top tech company"} must read this and immediately think: "I need to interview this person."`;

  const result = await withRetryAndTimeout(
    () => fixResumeModel.generateContent(prompt),
    120000, // 2 minutes — this deserves thorough reasoning
    3,
    2000,
    { route: "fix-resume", model: "gemini-3.6-flash" }
  );

  const raw = result.response.text();
  const clean = raw
    .replace(/```json[\s\S]*?```/g, (m) => m.slice(7, -3))
    .replace(/```/g, "")
    .trim();

  let parsed: FixedResumeResult;
  try {
    parsed = JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        throw new Error("AI returned invalid JSON — please retry");
      }
    } else {
      throw new Error("AI returned invalid JSON — please retry");
    }
  }

  if (!parsed.correctedText || typeof parsed.correctedText !== "string") {
    throw new Error("AI did not return the optimized resume text");
  }

  // Guard: output must be at least 70% the length of the input (prevents truncation)
  const minLength = Math.floor(resumeText.length * 0.7);
  if (parsed.correctedText.length < minLength) {
    throw new Error(
      `Resume appears incomplete (${parsed.correctedText.length} chars vs expected ${minLength}+). Please retry.`
    );
  }

  return {
    correctedText: parsed.correctedText,
    changesApplied: Array.isArray(parsed.changesApplied) ? parsed.changesApplied : [],
    structuredResume: parsed.structuredResume ?? undefined,
  };
}
