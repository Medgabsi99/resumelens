import { validateAndSanitizeInput } from "@/lib/validation";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { tailorResume } from "@/lib/ai";
import { resumeToText } from "@/lib/parseResume";
import { getUserProfile, canAnalyze } from "@/lib/auth";

export const maxDuration = 60; // Allow up to 60s for AI response

export async function POST(req: NextRequest) {
  try {
    // ── 1. Auth check ────────────────────────────────────────
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // ── 2. Load user profile & check quota ───────────────────
    const profile = await getUserProfile(session.user.id);
    if (!profile || !canAnalyze(profile)) {
      return NextResponse.json(
        { success: false, error: "Upgrade required to tailor your resume" },
        { status: 403 }
      );
    }

    // ── 3. Parse request ──────────────────────────────────────
    const body = await req.json();
    let { resumeText, jobDescription, targetRole } = body;

    try {
      resumeText = validateAndSanitizeInput(resumeText, 15000, "Resume text", true);
      jobDescription = validateAndSanitizeInput(jobDescription, 10000, "Job description", true);
      if (jobDescription.length < 50) {
        throw new Error("Job description must be at least 50 characters.");
      }
      if (targetRole) {
        targetRole = validateAndSanitizeInput(targetRole, 200, "Target role");
      }
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }

    // ── 4. Call AI to tailor resume ──────────────────────────
    const tailoredResult = await tailorResume(
      resumeText,
      jobDescription,
      targetRole || undefined
    );

    // Convert structured result back to plain text for the editor
    const { recommendedTemplate, ...parsedResume } = tailoredResult;
    const tailoredText = resumeToText(parsedResume);

    return NextResponse.json({
      success: true,
      tailoredResume: parsedResume,
      tailoredText,
      recommendedTemplate,
    });
  } catch (error: unknown) {
    logger.error("Auto-tailor API error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to auto-tailor resume";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
