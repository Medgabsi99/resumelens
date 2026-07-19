import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { requireUser } from "@/lib/auth";
import { validateAndSanitizeInput } from "@/lib/validation";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { bulletOptimizerModel, withRetryAndTimeout } from "@/lib/ai/client";

export const maxDuration = 45; // Allow up to 45s for AI response

export async function POST(req: NextRequest) {
  // ── 1. Auth check ────────────────────────────────────────
  let _user;
  try {
    _user = await requireUser();
  } catch (err) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(_user.id, "optimize-bullet");
  if (!rateLimit.success) {
    return rateLimitResponse();
  }

  // ── 2. Parse request ──────────────────────────────────────
  let body;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  let { text, targetRole, jobDescription } = body;

  try {
    text = validateAndSanitizeInput(text, 1000, "Bullet text", true);
    if (targetRole) {
      targetRole = validateAndSanitizeInput(targetRole, 200, "Target role");
    }
    if (jobDescription) {
      jobDescription = validateAndSanitizeInput(jobDescription, 10000, "Job description");
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? (err as Error).message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
  }

  // ── 3. Optimize Bullet ────────────────────────────────────
  try {
    const userPrompt = `
      Please optimize the following resume sentence, bullet point, or phrase:
      
      [PHRASE START]
      ${text}
      [PHRASE END]
      
      ${targetRole ? `Target Role: ${targetRole}` : ""}
      ${jobDescription ? `Job Description:\n[JD START]\n${jobDescription}\n[JD END]` : ""}
      
      Optimize the phrase in 3 separate ways:
      1. metricDriven: Focuses on metrics, percentages, dollar amounts, scale, or direct impact. (Provide realistic numeric placeholders like [X]% or $[Y] if they need to customize the metric).
      2. actionFocused: Starts with a strong action verb (e.g., Architected, Executed, Spearheaded) and focuses on ownership, engineering execution and impact.
      3. skillsTargeted: Explicitly threads matching technologies, frameworks, and keywords derived from the target role or job description.
      
      You must respond with ONLY a valid JSON object matching this schema:
      {
        "metricDriven": "string",
        "actionFocused": "string",
        "skillsTargeted": "string"
      }
    `;

    const responseText = await withRetryAndTimeout(async () => {
      const chatRes = await bulletOptimizerModel.generateContent({
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      });
      return chatRes.response.text();
    });

    if (!responseText) {
      throw new Error("Empty response from AI model");
    }

    // Clean JSON formatting markdown flags
    const cleanJson = responseText
      .replace(/```json/i, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleanJson);
    return NextResponse.json({ success: true, alternatives: parsed });

  } catch (err: unknown) {
    logger.error("Bullet optimization error:", err);
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Failed to optimize bullet point" },
      { status: 500 }
    );
  }
}
