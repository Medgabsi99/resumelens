import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getSecureModel, withRetryAndTimeout } from "@/lib/ai/client";

export const maxDuration = 45;

const xyzModel = getSecureModel({
  model: "gemini-2.5-flash",
  systemInstruction:
    "You are an elite resume strategist who coaches candidates at top FAANG companies. You apply the Google XYZ formula rigorously: Accomplished [X] as measured by [Y] by doing [Z]. Every bullet you produce is crisp, impactful, and passes ATS screening.",
});

export async function POST(req: NextRequest) {
  let _user;
  try {
    _user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(_user.id, "xyz-bullet");
  if (!rateLimit.success) {
    return rateLimitResponse();
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { bullet, targetRole, jobDescription } = body;

  if (!bullet || typeof bullet !== "string" || bullet.trim().length < 5) {
    return NextResponse.json({ error: "Invalid bullet text provided." }, { status: 400 });
  }

  const roleHint = targetRole ? ` for a ${targetRole} role` : "";
  const jdContext = jobDescription
    ? `\n\nRelevant Job Description (use to thread in matching keywords and technologies):\n[JD START]\n${String(jobDescription).slice(0, 3000)}\n[JD END]`
    : "";

  const prompt = `A candidate${roleHint} has this weak resume bullet:

ORIGINAL BULLET: "${bullet.trim()}"
${jdContext}

Your task: Transform this bullet using the proven Google XYZ formula:
"Accomplished [X] as measured by [Y] by doing [Z]"

Where:
- X = The quantified achievement or result (use realistic numeric placeholders like [X]% or $[Y] if real numbers are unknown)
- Y = The measurable metric that proves success (revenue, user growth, latency, uptime, team size, cost savings, etc.)
- Z = The method, technology, or action that produced the result

Also provide two additional rewrites using alternative strong action verbs.

Respond ONLY with a valid JSON object — no preamble, no markdown fences:
{
  "xyzRewrite": "Full XYZ formula bullet here",
  "xyzBreakdown": {
    "x": "What was accomplished",
    "y": "How it was measured",
    "z": "How it was done / the method"
  },
  "alternativeA": "Alternative rewrite using different strong action verb",
  "alternativeB": "Another alternative with focus on business impact",
  "weaknessAnalysis": "1-2 sentence explanation of what made the original bullet weak",
  "improvedVerb": "The stronger action verb used in xyzRewrite"
}`;

  try {
    const raw = await withRetryAndTimeout(async () => {
      const result = await xyzModel.generateContent(prompt);
      return result.response.text();
    });

    const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({ success: true, data: parsed });
  } catch (err: unknown) {
    logger.error("XYZ bullet error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to generate XYZ bullet rewrite" },
      { status: 500 }
    );
  }
}
