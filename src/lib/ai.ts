import { GoogleGenerativeAI } from "@google/generative-ai";
import { AnalysisResult } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction:
    "You are an expert resume coach and senior technical recruiter with 15+ years of experience across tech, product, design, finance, and business. You give brutally honest, specific, actionable feedback. You must respond with ONLY valid JSON — no preamble, no markdown fences, no explanation outside the JSON object.",
});

export function buildAnalysisPrompt(
  resumeText: string,
  jobDescription?: string,
  targetRole?: string
): string {
  let prompt = `Analyze this resume`;
  if (targetRole) prompt += ` for a ${targetRole} position`;
  if (jobDescription) prompt += ` against the following job description`;
  prompt += `.\n\nRESUME:\n${resumeText.slice(0, 6000)}`;

  if (jobDescription) {
    prompt += `\n\nJOB DESCRIPTION:\n${jobDescription.slice(0, 3000)}`;
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
  ]
}

Scoring guide: 80-100 = exceptional, 65-79 = solid, 50-64 = average, below 50 = needs major work. Be honest — most resumes score 45-65. Give exactly 3 rewrite suggestions. Every suggestion must be meaningfully better than the original.`;

  return prompt;
}

export async function analyzeResume(
  resumeText: string,
  jobDescription?: string,
  targetRole?: string
): Promise<AnalysisResult> {
  const prompt = buildAnalysisPrompt(resumeText, jobDescription, targetRole);

  const result = await model.generateContent(prompt);
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
  parsed.score = Math.max(1, Math.min(100, parseInt(String(parsed.score)) || 50));
  parsed.strengths = (parsed.strengths || []).slice(0, 5);
  parsed.weaknesses = (parsed.weaknesses || []).slice(0, 5);
  parsed.suggestions = (parsed.suggestions || []).slice(0, 5);

  return parsed;
}

// ─── File text extraction ─────────────────────────────────

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === "application/pdf") {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // Treat as plain text
  return buffer.toString("utf-8");
}
