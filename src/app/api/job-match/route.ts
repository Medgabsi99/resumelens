import { validateAndSanitizeInput } from "@/lib/validation";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { matchJobToResume } from "@/lib/ai";
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
      { success: false, error: "Upgrade required to match against a job" },
      { status: 403 }
    );
  }

  // ── 3. Parse request ──────────────────────────────────────
  const body = await req.json();
  let { resumeText, jobDescription, jobTitle, companyName } = body;

  try {
    resumeText = validateAndSanitizeInput(resumeText, 15000, "Resume text", true);
    jobDescription = validateAndSanitizeInput(jobDescription, 10000, "Job description", true);
    if (jobDescription.length < 50) {
      throw new Error("Job description must be at least 50 characters.");
    }
    if (jobTitle) {
      jobTitle = validateAndSanitizeInput(jobTitle, 200, "Job title");
    }
    if (companyName) {
      companyName = validateAndSanitizeInput(companyName, 200, "Company name");
    }
  } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

  // ── 4. Run job match ─────────────────────────────────────
  try {
    const matchResult = await matchJobToResume(
      resumeText,
      jobDescription,
      jobTitle,
      companyName
    );

    // ── 5. Persist match to database (optional) ─────────────
    try {
      await supabase.from("job_matches").insert({
        user_id: session.user.id,
        job_title: jobTitle || null,
        company_name: companyName || null,
        job_description: jobDescription,
        overall_score: matchResult.overallScore,
        fit_verdict: matchResult.fitVerdict,
        result_json: JSON.stringify(matchResult),
      });
    } catch (dbErr) {
      // Don't fail the request if persistence fails
      logger.warn("Failed to persist job match:", dbErr);
    }

    return NextResponse.json({ success: true, data: matchResult });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Job match failed";
    logger.error("Job match error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
