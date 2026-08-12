import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { requireUser } from "@/lib/auth";
import { validateAndSanitizeInput } from "@/lib/validation";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { generateCoverLetterStream } from "@/lib/ai";
import { getUserProfile, canAnalyze } from "@/lib/auth";
import { createSSEResponse } from "@/lib/sse";

export const maxDuration = 60; // Allow up to 60s for AI response

export async function POST(req: NextRequest) {
  // ── 1. Auth check ────────────────────────────────────────
  const _user = await requireUser();
  const rateLimit = await checkRateLimit(_user.id, "cover-letter");
  if (!rateLimit.success) {
    return rateLimitResponse();
  }

  // ── 2. Load user profile & check quota ───────────────────
  const profile = await getUserProfile(_user.id);
  if (!profile || !canAnalyze(profile)) {
    return NextResponse.json(
      { success: false, error: "Upgrade required to generate cover letter" },
      { status: 403 }
    );
  }

  // ── 3. Parse request ──────────────────────────────────────
  const body = await req.json();
  let { resumeText, jobDescription, targetRole } = body;

  try {
    resumeText = validateAndSanitizeInput(resumeText, 15000, "Resume text", true);
    if (jobDescription) {
      jobDescription = validateAndSanitizeInput(jobDescription, 10000, "Job description");
    }
    if (targetRole) {
      targetRole = validateAndSanitizeInput(targetRole, 200, "Target role");
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? (err as Error).message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
  }

  // ── 4. Generate Cover Letter via SSE Stream ──────────────
  try {
    const streamResult = await generateCoverLetterStream(resumeText, jobDescription, targetRole);
    return createSSEResponse(async (send) => {
      for await (const chunk of streamResult.stream) {
        const text = chunk.text();
        if (text) {
          send(text);
        }
      }
    });
  } catch (err: unknown) {
    logger.error("Cover letter API error:", err);
    const message =
      err instanceof Error ? (err as Error).message : "Cover letter generation failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
