import { JobMatchResult } from "@/types";
import { withRetryAndTimeout, matchModel, smartResumeModel } from "./client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { embedText } from "./embeddings";
import { retrieveRelevantChunks, hasEmbeddings, aggregateSectionScores } from "./retrieval";
import logger from "@/lib/logger";

export interface SmartResumeResult {
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
  recommendedTemplate: string;
}

export async function matchJobToResume(
  resumeText: string,
  jobDescription: string,
  jobTitle?: string,
  companyName?: string,
  // Optional: pass these to enable embedding-based similarity grounding
  userId?: string,
  supabase?: SupabaseClient,
): Promise<JobMatchResult> {
  const titleLine = jobTitle ? ` for the role of "${jobTitle}"` : "";
  const companyLine = companyName ? ` at ${companyName}` : "";

  // ── Embedding similarity signal (optional, grounding layer) ────────────
  let embeddingSignalBlock = "";
  if (userId && supabase) {
    try {
      const embeddingsExist = await hasEmbeddings(userId, supabase);
      if (embeddingsExist) {
        // Embed the job description with SEMANTIC_SIMILARITY task type
        // (comparing two documents, not query vs. document)
        const jdEmbedding = await embedText(jobDescription, "SEMANTIC_SIMILARITY");

        // Retrieve top-10 resume chunks to get broad cross-section coverage
        const chunks = await retrieveRelevantChunks(
          jdEmbedding,
          userId,
          supabase,
          10,   // broader retrieval for job matching
          0.2,  // lower threshold to capture even weak signals
        );

        if (chunks.length > 0) {
          const sectionScores = aggregateSectionScores(chunks);
          const topChunks = chunks.slice(0, 3);

          logger.info(`[job-match] Embedding scores: ${JSON.stringify(sectionScores)}`);

          // Format embedding signals for LLM grounding
          const scoreLines = Object.entries(sectionScores)
            .sort(([, a], [, b]) => b - a)
            .map(([section, score]) => `  ${section}: ${Math.round(score * 100)}% semantic match`)
            .join("\n");

          const topChunkLines = topChunks
            .map((c) => `  [${c.chunk_type}] (${Math.round(c.similarity * 100)}% match): ${c.content.slice(0, 120)}...`)
            .join("\n");

          embeddingSignalBlock = `
[EMBEDDING SIMILARITY SIGNAL — use these scores to calibrate your assessment]
These are cosine similarity scores between the job description and the candidate's resume sections.
Higher = more semantically aligned. Use these as an objective grounding signal for your scores.

Per-section semantic similarity:
${scoreLines}

Top matching resume excerpts:
${topChunkLines}
[END EMBEDDING SIGNAL]

`;
        }
      }
    } catch (err) {
      // Non-fatal — fall back to pure LLM matching
      logger.warn("[job-match] Embedding signal failed, proceeding without it:", err);
    }
  }

  const prompt = `Evaluate how well this candidate's resume matches the following job description${titleLine}${companyLine}.
${embeddingSignalBlock}
[RESUME START]
${resumeText.slice(0, 6000)}
[RESUME END]

[JOB DESCRIPTION START]
${jobDescription.slice(0, 4000)}
[JOB DESCRIPTION END]

Return ONLY a JSON object with this exact structure:
{
  "overallScore": <integer 0-100 — weighted average of breakdown>,
  "fitVerdict": "<one of: strong | good | fair | weak>",
  "summary": "<2-3 sentence honest assessment of overall fit, mentioning the strongest alignment and biggest gap>",
  "strengths": ["<specific reason this candidate is a good fit>", "<another>", "<another>"],
  "gaps": ["<specific missing requirement or weak area>", "<another>", "<another>"],
  "matchedSkills": ["<skill the candidate has that JD requires>"],
  "missingSkills": ["<skill JD requires that candidate lacks>"],
  "matchedKeywords": ["<important JD keyword/phrase present in resume>"],
  "missingKeywords": ["<important JD keyword/phrase absent from resume>"],
  "experienceMatch": {
    "required": "<what JD asks for, e.g. '5+ years in product management'>",
    "yours": "<candidate's relevant experience, e.g. '3 years as PM at SaaS startup'>",
    "verdict": "<one of: exceeds | meets | slightly-below | below>"
  },
  "topRecommendations": [
    "<specific actionable recommendation to improve match, e.g. 'Add a bullet quantifying revenue impact at Company X'>",
    "<another specific recommendation>",
    "<another>"
  ],
  "breakdown": {
    "skills": <integer 0-100 — required technical/hard skills match>,
    "experience": <integer 0-100 — relevant experience level match>,
    "education": <integer 0-100 — education requirements match>,
    "responsibilities": <integer 0-100 — past responsibilities align with role>,
    "culture": <integer 0-100 — values, work style, soft skills alignment>
  }
}

Scoring guide:
- 80-100: strong fit — would likely get an interview
- 65-79: good fit — competitive candidate with minor gaps
- 50-64: fair fit — possible but needs significant resume tailoring
- below 50: weak fit — major gaps in skills or experience

Be brutally honest. Most resume-to-JD matches score 40-70. Don't inflate scores.

Skills breakdown: weight heavily (1.0x)
Experience: weight heavily (1.0x)
Responsibilities: medium weight (0.8x)
Education: lower weight (0.5x) unless explicitly required
Culture: lower weight (0.4x) but include for completeness`;

  const result = await withRetryAndTimeout(() => matchModel.generateContent(prompt));
  const raw = result.response.text();
  const clean = raw.replace(/```json|```/g, "").trim();

  let parsed: JobMatchResult;
  try {
    parsed = JSON.parse(clean);
  } catch {
    throw new Error("AI returned malformed JSON for job match. Please try again.");
  }

  // Validate and clamp scores
  parsed.overallScore = Math.max(
    0,
    Math.min(100, parseInt(String(parsed.overallScore)) || 50),
  );

  // Validate breakdown
  if (parsed.breakdown) {
    const clamp = (n: number) => Math.max(0, Math.min(100, parseInt(String(n)) || 0));
    parsed.breakdown.skills = clamp(parsed.breakdown.skills);
    parsed.breakdown.experience = clamp(parsed.breakdown.experience);
    parsed.breakdown.education = clamp(parsed.breakdown.education);
    parsed.breakdown.responsibilities = clamp(parsed.breakdown.responsibilities);
    parsed.breakdown.culture = clamp(parsed.breakdown.culture);
  }

  // Validate verdict
  const validVerdicts = ["strong", "good", "fair", "weak"] as const;
  if (!validVerdicts.includes(parsed.fitVerdict as any)) {
    const score = parsed.overallScore;
    parsed.fitVerdict = score >= 80 ? "strong" : score >= 65 ? "good" : score >= 50 ? "fair" : "weak";
  }

  // Validate experienceMatch verdict
  const validExpVerdicts = ["exceeds", "meets", "slightly-below", "below"] as const;
  if (parsed.experienceMatch && !validExpVerdicts.includes(parsed.experienceMatch.verdict as any)) {
    parsed.experienceMatch.verdict = "meets";
  }

  return parsed;
}

export async function generateSmartResume(
  resumeText: string,
  targetRole?: string,
  jobDescription?: string,
): Promise<SmartResumeResult> {
  let prompt = `Transform the following raw resume text into a perfectly structured resume. Improve and enhance the content while keeping it truthful to the original.`;
  
  if (targetRole) {
    prompt += `\n\nThe candidate is targeting the role of: "${targetRole}". Tailor the summary and highlight relevant experience for this role.`;
  }
  
  if (jobDescription) {
    prompt += `\n\nJob Description to optimize for:\n[JOB DESCRIPTION START]\n${jobDescription.slice(0, 3000)}\n[JOB DESCRIPTION END]`;
  }

  prompt += `\n\n[RESUME START]\n${resumeText.slice(0, 6000)}\n[RESUME END]

Return ONLY a JSON object with this exact structure:
{
  "contact": {
    "name": "<full name>",
    "email": "<email if found>",
    "phone": "<phone if found>",
    "location": "<city, state/country if found>",
    "links": ["<LinkedIn URL>", "<portfolio URL>", "<GitHub URL>"]
  },
  "summary": "<2-3 compelling sentences summarizing the candidate's value proposition${targetRole ? ` tailored for the ${targetRole} role` : ""}. Use strong, confident language. No generic fluff.>",
  "experience": [
    {
      "title": "<exact job title>",
      "company": "<company name>",
      "dates": "<start - end, e.g. 'Jan 2020 - Present'>",
      "location": "<city, state if available>",
      "bullets": [
        "<strong bullet: action verb + what you did + quantified result/impact>",
        "<each bullet should be 1-2 lines, specific, and measurable>",
        "<3-5 bullets per role, ordered by impact>"
      ]
    }
  ],
  "education": [
    {
      "degree": "<degree name, e.g. 'Bachelor of Science in Computer Science'>",
      "school": "<university name>",
      "dates": "<graduation year or date range>",
      "details": "<honors, GPA if notable, relevant coursework>"
    }
  ],
  "skills": [
    "<group related skills together, e.g. 'Python, Java, Go' as one entry or individual entries>",
    "<include both technical and soft skills relevant to the role>"
  ],
  "projects": [
    {
      "name": "<project name>",
      "description": "<1-2 sentence description with technologies and impact>"
    }
  ],
  "certifications": ["<certification name and issuing body>"],
  "languages": ["<language and proficiency level>"],
  "awards": ["<award name and context>"],
  "recommendedTemplate": "<one of: professional, modern, creative, minimal, executive>"
}

Rules for enhancing the resume:
1. Every experience bullet MUST start with a strong action verb (Led, Developed, Optimized, Architected, Delivered, etc.)
2. Every bullet SHOULD include a quantified metric or concrete result when possible (%, $, time saved, users impacted)
3. The summary should NOT start with "I" — use third-person implied style: "Results-driven engineer with..."
4. Skills should be individual items, not grouped into categories with colons
5. Remove any filler, generic text, or duties-focused language — focus on achievements and impact
6. Keep dates in consistent format: "Mon YYYY - Mon YYYY" or "YYYY - YYYY"
7. Order experience entries from most recent to oldest
8. If information is missing or unclear, omit the field rather than making things up

Template recommendation guide:
- "professional": Traditional corporate roles (finance, law, consulting, government, healthcare)
- "modern": Tech, engineering, product, data science roles
- "creative": Design, marketing, media, startup roles
- "minimal": When the candidate wants a clean, universal look — safe default
- "executive": Senior leadership, C-suite, VP-level, director roles`;

  const result = await withRetryAndTimeout(() => smartResumeModel.generateContent(prompt));
  const raw = result.response.text();
  const clean = raw.replace(/```json|```/g, "").trim();

  let parsed: SmartResumeResult;
  try {
    parsed = JSON.parse(clean);
  } catch {
    throw new Error("AI returned malformed JSON for smart resume. Please try again.");
  }

  // Validate required fields
  if (!parsed.contact) {
    parsed.contact = { name: "Your Name" };
  }
  if (!parsed.experience) {
    parsed.experience = [];
  }
  if (!parsed.education) {
    parsed.education = [];
  }
  if (!parsed.skills) {
    parsed.skills = [];
  }

  // Use codified template recommendation logic
  parsed.recommendedTemplate = getRecommendedTemplate(
    targetRole || "",
    resumeText || "",
    parsed.experience || []
  );

  return parsed;
}

export async function tailorResume(
  resumeText: string,
  jobDescription: string,
  targetRole?: string,
): Promise<SmartResumeResult> {
  let prompt = `You are an expert resume writer. Your task is to tailor the candidate's resume specifically for the target job description.
Your goal is to optimize the resume's match score while strictly preserving all factual details (company names, job titles, education degrees, dates, locations, contact info, name). Do NOT invent any fictional history, companies, projects, or credentials.`;

  if (targetRole) {
    prompt += `\n\nThe target role is: "${targetRole}".`;
  }

  prompt += `

[JOB DESCRIPTION START]
${jobDescription.slice(0, 4000)}
[JOB DESCRIPTION END]

[RESUME START]
${resumeText.slice(0, 6000)}
[RESUME END]

Return ONLY a JSON object matching this exact structure:
{
  "contact": {
    "name": "<strictly preserve from original>",
    "email": "<strictly preserve from original>",
    "phone": "<strictly preserve from original>",
    "location": "<strictly preserve from original>",
    "links": ["<strictly preserve from original>"]
  },
  "summary": "<2-3 sentence tailored summary aligning with the job description. Emphasize relevant skills and value proposition without using 'I'.>",
  "experience": [
    {
      "title": "<strictly preserve title from original>",
      "company": "<strictly preserve company from original>",
      "dates": "<strictly preserve dates from original>",
      "location": "<strictly preserve location from original>",
      "bullets": [
        "<tailored bullet: modify the original experience bullets to highlight relevant keywords, tasks, and results related to the job description. Start with a strong action verb and include metrics if the original bullet had them.>"
      ]
    }
  ],
  "education": [
    {
      "degree": "<strictly preserve degree from original>",
      "school": "<strictly preserve school from original>",
      "dates": "<strictly preserve dates from original>",
      "details": "<strictly preserve details/gpa from original>"
    }
  ],
  "skills": [
    "<strictly preserve original skills, but re-order them to prioritize keywords from the job description, and add missing skills that are explicitly mentioned in the job description ONLY if the candidate's original resume or bullets imply they have experience with them. Do NOT invent unrelated skills.>"
  ],
  "projects": [
    {
      "name": "<strictly preserve name from original>",
      "description": "<tailored description highlighting technologies or tasks relevant to the job description>"
    }
  ],
  "certifications": ["<strictly preserve certifications from original>"],
  "languages": ["<strictly preserve languages from original>"],
  "awards": ["<strictly preserve awards from original>"],
  "recommendedTemplate": "<recommend one of: professional, modern, creative, minimal, executive>"
}

Rules for tailoring:
1. Every experience bullet MUST start with a strong action verb.
2. Align the phrasing of experience bullets with the job description's keywords (e.g. if the JD asks for 'collaborating with cross-functional teams', phrase it like that rather than 'worked with different departments' if it matches the original experience).
3. Do NOT change dates, company names, titles, or schools. They must remain exactly as in the original resume.
4. Keep the output strictly in the specified JSON schema. Do not output anything other than the JSON.`;

  const result = await withRetryAndTimeout(() => smartResumeModel.generateContent(prompt));
  const raw = result.response.text();
  const clean = raw.replace(/```json|```/g, "").trim();

  let parsed: SmartResumeResult;
  try {
    parsed = JSON.parse(clean);
  } catch {
    throw new Error("AI returned malformed JSON for tailored resume. Please try again.");
  }

  // Validate required fields
  if (!parsed.contact) {
    parsed.contact = { name: "Your Name" };
  }
  if (!parsed.experience) {
    parsed.experience = [];
  }
  if (!parsed.education) {
    parsed.education = [];
  }
  if (!parsed.skills) {
    parsed.skills = [];
  }

  // Use codified template recommendation logic
  parsed.recommendedTemplate = getRecommendedTemplate(
    targetRole || "",
    parsed.experience || []
  );

  return parsed;
}

function getRecommendedTemplate(
  targetRole: string = "",
  experience: any[] = []
): string {
  const role = targetRole.toLowerCase();
  
  // 1. Executive Seniority check
  const hasSenioritySignal = /\b(director|vp|vice president|chief|head of|partner|executive|president|c-suite|ceo|cto|cfo|coo|cmo|cro|cio)\b/i.test(role);
  
  // Calculate total years of experience roughly from dates if experience list is available
  let totalYears = 0;
  if (experience && experience.length > 0) {
    let minYear = new Date().getFullYear();
    let maxYear = 1970;
    let foundDates = false;
    for (const exp of experience) {
      if (exp.dates) {
        const years = exp.dates.match(/\b\d{4}\b/g);
        if (years && years.length > 0) {
          foundDates = true;
          const numYears = years.map(Number);
          const expMin = Math.min(...numYears);
          const expMax = Math.max(...numYears);
          if (expMin < minYear) minYear = expMin;
          if (expMax > maxYear) maxYear = expMax;
        }
      }
    }
    if (foundDates && maxYear >= minYear) {
      totalYears = maxYear - minYear;
    }
  }
  
  if (hasSenioritySignal || totalYears > 12) {
    return "executive";
  }
  
  // 2. Creative / Marketing check
  const isCreative = /\b(design|designer|creative|marketing|brand|writer|copywriter|art|artist|content|product marketing|media|social media|growth)\b/i.test(role);
  if (isCreative) {
    return "creative";
  }
  
  // 3. Tech / Engineering / Product check
  const isTech = /\b(software|developer|engineer|tech|product|engineering|programmer|data|analytics|cloud|devops|qa|scrum|agile|system|architect|fullstack|frontend|backend)\b/i.test(role);
  if (isTech) {
    return "modern";
  }
  
  // 4. Default -> professional
  return "professional";
}
