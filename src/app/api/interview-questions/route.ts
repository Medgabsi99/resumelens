import { validateAndSanitizeInput } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { generateInterviewQuestions } from "@/lib/ai";
import { getUserProfile, canAnalyze } from "@/lib/auth";

export const maxDuration = 60; // Allow up to 60s for AI response

export async function POST(req: NextRequest) {
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
      { success: false, error: "Upgrade required to generate interview questions" },
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
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }

  // ── 4. Generate Interview Questions ───────────────────────
  try {
    const questions = await generateInterviewQuestions(resumeText, jobDescription, targetRole);
    return NextResponse.json({ success: true, data: questions });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Interview questions generation failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}