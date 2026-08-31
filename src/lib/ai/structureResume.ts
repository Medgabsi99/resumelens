/**
 * structureResume.ts
 *
 * Parses corrected resume plain text into a clean StructuredResume JSON using
 * Gemini 2.0-flash (fast + cheap). This runs AFTER fixResume completes so that
 * the main fix call stays lean and reliable (no huge combined JSON output).
 *
 * The StructuredResume drives the elite PlainTextPdfTemplate renderer, giving
 * perfect section detection, dates, bullet extraction, and skill categorization
 * with zero regex parsing.
 */
import { getSecureModel, withRetryAndTimeout } from "./client";
import type { StructuredResume } from "@/types/structuredResume";

const structureModel = getSecureModel({
  model: "gemini-3.6-flash",
  systemInstruction: `You are a precision resume parser. Extract the structure of a resume into clean JSON.
Rules:
- null fields: use null (not the string "null")
- bullets: strip the bullet prefix char (•, -, –) — return only the text
- dates: preserve exactly as written (e.g. "Fév 2025 – Présent")
- skill_categories: always try to group skills into categories (Frontend, Backend, Cloud/DevOps, Databases, Tools, Languages)
- If skills are already in "Label: skill1, skill2" format, preserve that as categories
- original_heading: copy the section title exactly as it appears in the text
- type: classify correctly — do not guess; if unsure use "other"
Respond ONLY with valid JSON, no markdown.`,
  generationConfig: {
    responseMimeType: "application/json", // Guarantees JSON output — no markdown wrapper
    temperature: 0, // Deterministic — same input → same structure
  },
});

const SCHEMA = `{
  "contact": {
    "name": "string",
    "title": "string|null",
    "email": "string|null",
    "phone": "string|null",
    "location": "string|null",
    "linkedin": "string|null",
    "github": "string|null",
    "portfolio": "string|null",
    "other_links": ["string"]
  },
  "sections": [
    {
      "original_heading": "string",
      "type": "summary|experience|education|skills|projects|certifications|languages|awards|other",
      "summary_text": "string (for type=summary)",
      "experience": [
        {
          "title": "string",
          "company": "string",
          "location": "string|null",
          "dates": "string",
          "bullets": ["string"]
        }
      ],
      "education": [
        {
          "degree": "string",
          "school": "string",
          "location": "string|null",
          "dates": "string|null",
          "details": "string|null"
        }
      ],
      "skill_categories": [
        { "label": "string", "skills": ["string"] }
      ],
      "skills_flat": ["string"],
      "projects": [
        {
          "name": "string",
          "dates": "string|null",
          "tech": "string|null",
          "bullets": ["string"]
        }
      ],
      "certifications": [
        { "name": "string", "issuer": "string|null", "date": "string|null" }
      ],
      "languages": ["string"],
      "awards": ["string"],
      "other_text": "string|null"
    }
  ]
}`;

export async function structureResume(correctedText: string): Promise<StructuredResume> {
  const prompt = `Parse this resume into the exact JSON schema below. Include ALL sections and ALL content — nothing may be omitted.

RESUME TEXT:
${correctedText.slice(0, 12000)}

JSON SCHEMA TO FOLLOW:
${SCHEMA}

Return ONLY the JSON object. No explanation, no markdown.`;

  const result = await withRetryAndTimeout(
    () => structureModel.generateContent(prompt),
    30000, // 30s max — this model is fast
    2,
    500,
    { route: "structure-resume", model: "gemini-3.6-flash" }
  );

  const raw = result.response.text();
  const clean = raw.replace(/```json|```/g, "").trim();

  let parsed: StructuredResume;
  try {
    parsed = JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        throw new Error("structureResume: invalid JSON from model");
      }
    } else {
      throw new Error("structureResume: no JSON object found in response");
    }
  }

  // Sanitize: replace any "null" string values with actual null
  return sanitizeStructuredResume(parsed);
}

/**
 * Recursively replaces "null" strings with null and cleans up
 * any model artifacts in the structured resume fields.
 */
function sanitizeStructuredResume(obj: unknown): StructuredResume {
  const str = JSON.stringify(obj, (_k, v) => {
    if (v === "null" || v === "undefined" || v === "none" || v === "N/A" || v === "n/a")
      return null;
    return v;
  });
  return JSON.parse(str) as StructuredResume;
}
