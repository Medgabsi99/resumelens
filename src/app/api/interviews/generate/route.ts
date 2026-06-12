import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { generateSimulatorQuestions } from "@/lib/ai";
import { getUserProfile, canAnalyze } from "@/lib/auth";

export const maxDuration = 60; // Allow up to 60s for AI response

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
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

    // 2. Load user profile & check quota
    const profile = await getUserProfile(session.user.id);
    if (!profile || !canAnalyze(profile)) {
      return NextResponse.json(
        { success: false, error: "Upgrade required to generate mock interview questions" },
        { status: 403 }
      );
    }

    // 3. Parse request
    const body = await req.json();
    const { resumeText, targetRole, companyName, jobDescription, interviewType, difficulty } = body;

    if (!resumeText || !targetRole || !companyName) {
      return NextResponse.json(
        { success: false, error: "Resume text, target role, and company name are required" },
        { status: 400 }
      );
    }

    // 4. Generate custom simulator questions
    const questions = await generateSimulatorQuestions(
      resumeText,
      targetRole,
      companyName,
      jobDescription || undefined,
      interviewType || "behavioral",
      difficulty || "mid"
    );

    return NextResponse.json({ success: true, questions });
  } catch (error: unknown) {
    logger.error("Mock simulator questions generate route error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate mock interview questions";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
