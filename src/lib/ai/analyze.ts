import { AnalysisResult } from "@/types";
import { withRetryAndTimeout, negotiationResponseModel } from "./client";

export function buildAnalysisPrompt(
  resumeText: string,
  jobDescription?: string,
  targetRole?: string,
): string {
  let prompt = `Analyze this resume`;
  if (targetRole) prompt += ` for a ${targetRole} position`;
  if (jobDescription) prompt += ` against the following job description`;
  prompt += `.\n\n[RESUME START]\n${resumeText.slice(0, 6000)}\n[RESUME END]`;

  if (jobDescription) {
    prompt += `\n\n[JOB DESCRIPTION START]\n${jobDescription.slice(0, 3000)}\n[JOB DESCRIPTION END]`;
  }

  prompt += `

Return ONLY a JSON object — no preamble, no markdown fences. Use this exact structure:
{
  "score": <integer 1-100>,
  "summary": "<2-3 sentence honest overall assessment — be specific, not generic>",
  "strengths": ["<concrete strength>", "<concrete strength>", "<concrete strength>", "<optional 4th>"],
  "weaknesses": ["<specific weakness>", "<specific weakness>", "<specific weakness>", "<optional 4th>"],${
    jobDescription
      ? `
  "keywords_matched": ["<keyword from JD present in resume>"],
  "keywords_missing": ["<important JD keyword absent from resume>"],`
      : ""
  }
  "suggestions": [
    {
      "section": "<e.g. Experience — Acme Corp 2022>",
      "before": "<weak original bullet or phrase>",
      "after": "<stronger rewrite: action verb + metric + impact>"
    },
    { "section": "...", "before": "...", "after": "..." },
    { "section": "...", "before": "...", "after": "..." }
  ],
  "ats_breakdown": {
    "format": <integer 1-100>,
    "keywords": <integer 1-100>,
    "impact": <integer 1-100>,
    "readability": <integer 1-100>
  }
}

Scoring guide: 80-100 = exceptional, 65-79 = solid, 50-64 = average, below 50 = needs major work. Be honest — most resumes score 45-65. Give exactly 3 rewrite suggestions. Every suggestion must be meaningfully better than the original.

ATS breakdown sub-scores:
- format: How well the resume is structured for ATS (no tables, columns, missing headers, no header/footer text). Penalize missing section headings, inconsistent formatting.
- keywords: How well the resume's keywords match the job description. ${jobDescription ? "Score based on the specific JD provided." : "If no JD provided, score based on how well the resume uses relevant industry keywords for the target role."}
- impact: How strong the bullet points are — action verbs, quantified achievements, concrete results. Penalize generic duties, responsibilities without outcomes.
- readability: How scannable the resume is — clear section headings, consistent spacing, appropriate length, good typographic hierarchy.`;

  return prompt;
}

export async function analyzeResume(
  resumeText: string,
  jobDescription?: string,
  targetRole?: string,
): Promise<AnalysisResult> {
  const prompt = buildAnalysisPrompt(resumeText, jobDescription, targetRole);

  const result = await withRetryAndTimeout(() => negotiationResponseModel.generateContent(prompt));
  const raw = result.response.text();

  // Strip any accidental markdown fences
  const clean = raw.replace(/```json|```/g, "").trim();

  let parsed: AnalysisResult;
  try {
    parsed = JSON.parse(clean);
  } catch {
    throw new Error("AI returned malformed JSON. Please try again.");
  }

  // Validate and clamp
  parsed.score = Math.max(
    1,
    Math.min(100, parseInt(String(parsed.score)) || 50),
  );
  parsed.strengths = (parsed.strengths || []).slice(0, 5);
  parsed.weaknesses = (parsed.weaknesses || []).slice(0, 5);
  parsed.suggestions = (parsed.suggestions || []).slice(0, 5);

  return parsed;
}
