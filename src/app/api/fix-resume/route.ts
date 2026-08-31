import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { validateAndSanitizeInput } from "@/lib/validation";
import logger from "@/lib/logger";
import { fixResume } from "@/lib/ai/fixResume";
import { structureResume } from "@/lib/ai/structureResume";
import type { AnalysisResult } from "@/types";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    // Auth required
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await checkRateLimit(session.user.id, "fix-resume");
    if (!rateLimit.success) return rateLimitResponse();

    const body = await req.json();
    let { resumeText, targetRole, jobDescription, analysis } = body;

    try {
      resumeText = validateAndSanitizeInput(resumeText, 16000, "Resume text", true);
      if (targetRole) targetRole = validateAndSanitizeInput(targetRole, 200, "Target role");
      if (jobDescription)
        jobDescription = validateAndSanitizeInput(jobDescription, 6000, "Job description");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }

    if (!analysis || typeof analysis !== "object") {
      return NextResponse.json(
        { success: false, error: "Analysis result is required" },
        { status: 400 }
      );
    }

    // Step 1: Elite resume optimization (main call — lean JSON output)
    const fixResult = await fixResume(
      resumeText,
      analysis as AnalysisResult,
      targetRole,
      jobDescription
    );

    // Step 2: Structure extraction — runs immediately after fix, uses fast model
    // This gives the PDF renderer perfect structured data without risking the main call's JSON integrity.
    let structuredResume = fixResult.structuredResume;
    if (!structuredResume) {
      try {
        structuredResume = await structureResume(fixResult.correctedText);
      } catch (structureErr) {
        // Non-fatal — PDF renderer will fall back to text parsing
        logger.warn("[fix-resume] structureResume failed (non-fatal):", structureErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        correctedText: fixResult.correctedText,
        changesApplied: fixResult.changesApplied,
        structuredResume,
      },
    });
  } catch (err: unknown) {
    logger.error("[fix-resume] Error:", err);
    const message = err instanceof Error ? err.message : "Failed to fix resume";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
