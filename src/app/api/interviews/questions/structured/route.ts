import { validateAndSanitizeInput } from "@/lib/validation";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { generateStructuredQuestions } from "@/lib/ai";
import { getUserProfile, canAnalyze, requireUser } from "@/lib/auth";

export const maxDuration = 60; // Allow up to 60s for AI response

export async function POST(req: NextRequest) {
  try {
    // ── 1. Auth check ────────────────────────────────────────
    const _user = await requireUser();

    // ── 2. Load user profile & check quota ───────────────────
    const profile = await getUserProfile(_user.id);
    if (!profile || !canAnalyze(profile)) {
      return NextResponse.json(
        { success: false, error: "Upgrade required to generate mock interview questions" },
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

    // ── 4. Generate questions array ──────────────────────────
    const questions = await generateStructuredQuestions(
      resumeText,
      jobDescription || undefined,
      targetRole || undefined
    );

    return NextResponse.json({ success: true, questions });
  } catch (error: unknown) {
    logger.error("Structured mock questions API error:", error);
    const message =
      error instanceof Error ? (error as Error).message : "Failed to generate mock interview questions";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
