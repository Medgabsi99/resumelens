/**
 * extractResumeStyle.ts
 *
 * Uses Gemini Vision (gemini-3.6-flash) to analyse the raw bytes of an uploaded
 * resume file (PDF rendered as image, or image directly) and extract precise
 * visual style tokens — accent color, fonts, layout, section heading style, etc.
 *
 * This is intentionally lightweight and fast (~3-5s). It runs in parallel with
 * the main analysis so it adds zero wait time to the user.
 */

import { genAI } from "./client";
import type { ResumeStyleTokens } from "@/types";
export { DEFAULT_STYLE_TOKENS } from "@/lib/resumeStyleDefaults";
import { DEFAULT_STYLE_TOKENS } from "@/lib/resumeStyleDefaults";

const styleModel = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

const STYLE_PROMPT = `You are a visual design analyst specialising in document layout.
Analyse this resume image and extract its EXACT visual style. Be precise about colors — use the actual hex from the document.

Return ONLY this JSON (no markdown, no preamble):
{
  "accentColor": "<hex of section headings / accent elements, e.g. '#0f766e'>",
  "inkColor": "<hex of main body text, e.g. '#1a1a1a'>",
  "fontFamily": "<closest web font match: 'Inter' | 'Lora' | 'Georgia' | 'Roboto' | 'Open Sans' | 'Playfair Display'>",
  "sectionStyle": "<one of: 'colored-underline' | 'all-caps-line' | 'bold-only' | 'colored-box' | 'plain'>",
  "headerAlignment": "<'left' | 'center'>",
  "datePosition": "<'inline-right' | 'new-line'>",
  "hasPhoto": <true|false>,
  "hasSeparatorLine": <true|false>,
  "layout": "<'single-column' | 'two-column' | 'sidebar'>",
  "nameSizeCategory": "<'large' | 'medium'>",
  "bulletStyle": "<'dash' | 'dot' | 'circle' | 'none'>",
  "backgroundColor": "<hex of page background, usually '#ffffff'>"
}

Rules:
- accentColor: look at section heading text color, NOT underlines or borders (those often inherit)
- If section headings are a teal/green → extract that exact teal hex
- If bold-only headings with no color → use '#1a1a1a' for accentColor
- fontFamily: pick the closest available Google Font match
- sectionStyle: 'colored-underline' means colored text + line below; 'all-caps-line' means ALL CAPS + full-width horizontal rule`;

/**
 * Extracts visual style tokens from a resume file buffer.
 * Supports PDF (first-page screenshot via Gemini's native PDF understanding)
 * and image files (PNG, JPG, WEBP).
 *
 * Returns DEFAULT_STYLE_TOKENS if extraction fails (always non-throwing).
 */
export async function extractResumeStyle(
  fileBuffer: Buffer,
  mimeType: string
): Promise<ResumeStyleTokens> {
  try {
    // Gemini Vision accepts PDF natively (renders first page automatically)
    // and standard image types
    const supportedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/gif",
    ];

    if (!supportedTypes.includes(mimeType)) {
      return DEFAULT_STYLE_TOKENS;
    }

    const result = await Promise.race([
      styleModel.generateContent([
        {
          inlineData: {
            data: fileBuffer.toString("base64"),
            mimeType,
          },
        },
        STYLE_PROMPT,
      ]),
      // 5s timeout — must never delay overall response
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Style extraction timed out")), 5000)
      ),
    ]);

    const raw = (result as Awaited<ReturnType<typeof styleModel.generateContent>>).response
      .text()
      .replace(/```json|```/g, "")
      .trim();

    // Extract JSON object
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return DEFAULT_STYLE_TOKENS;

    const parsed = JSON.parse(match[0]) as Partial<ResumeStyleTokens>;

    // Validate and merge with defaults
    return {
      accentColor: parsed.accentColor || DEFAULT_STYLE_TOKENS.accentColor,
      inkColor: parsed.inkColor || DEFAULT_STYLE_TOKENS.inkColor,
      fontFamily: parsed.fontFamily || DEFAULT_STYLE_TOKENS.fontFamily,
      sectionStyle: parsed.sectionStyle || DEFAULT_STYLE_TOKENS.sectionStyle,
      headerAlignment: parsed.headerAlignment || DEFAULT_STYLE_TOKENS.headerAlignment,
      datePosition: parsed.datePosition || DEFAULT_STYLE_TOKENS.datePosition,
      hasPhoto: parsed.hasPhoto ?? DEFAULT_STYLE_TOKENS.hasPhoto,
      hasSeparatorLine: parsed.hasSeparatorLine ?? DEFAULT_STYLE_TOKENS.hasSeparatorLine,
      layout: parsed.layout || DEFAULT_STYLE_TOKENS.layout,
      nameSizeCategory: parsed.nameSizeCategory || DEFAULT_STYLE_TOKENS.nameSizeCategory,
      bulletStyle: parsed.bulletStyle || DEFAULT_STYLE_TOKENS.bulletStyle,
      backgroundColor: parsed.backgroundColor || DEFAULT_STYLE_TOKENS.backgroundColor,
    };
  } catch {
    return DEFAULT_STYLE_TOKENS;
  }
}
