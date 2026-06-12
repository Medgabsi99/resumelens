import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
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
    const { resumeText, jobDescription, targetRole } = body;

    if (!resumeText) {
      return NextResponse.json(
        { success: false, error: "Resume text is required" },
        { status: 400 }
      );
    }

    if (!jobDescription || jobDescription.trim().length < 50) {
      return NextResponse.json(
        { success: false, error: "Job description is required and must be at least 50 characters" },
        { status: 400 }
      );
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
