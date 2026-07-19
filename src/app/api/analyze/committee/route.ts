import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { createServerComponentClient } from "@/lib/supabase-server";
import { requireUser } from "@/lib/auth";
import { validateAndSanitizeInput } from "@/lib/validation";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { analyzeHiringCommittee } from "@/lib/ai";

export const maxDuration = 60; // Allow up to 60s for AI response

export async function POST(req: NextRequest) {
  const supabase = await createServerComponentClient();
  try {
    // ── 1. Auth check ────────────────────────────────────────
    const user = await requireUser();
  const rateLimit = await checkRateLimit(user.id, "analyze-committee");
  if (!rateLimit.success) {
    return rateLimitResponse();
  }

    // ── 2. Parse and Validate Request ────────────────────────
    const body = await req.json();
    let resumeText = body.resumeText || "";
    let jobDescription = body.jobDescription || "";
    let targetRole = body.targetRole || "";
    let companyName = body.companyName || "";

    try {
      resumeText = validateAndSanitizeInput(resumeText, 15000, "Resume text", true);
      if (jobDescription) {
        jobDescription = validateAndSanitizeInput(jobDescription, 10000, "Job description");
      }
      if (targetRole) {
        targetRole = validateAndSanitizeInput(targetRole, 200, "Target role");
      }
      if (companyName) {
        companyName = validateAndSanitizeInput(companyName, 200, "Company name");
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? (err as Error).message : String(err);
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    if (resumeText.trim().length < 100) {
      return NextResponse.json(
        { success: false, error: "Resume text is too short or empty." },
        { status: 400 }
      );
    }

    // ── 3. Call AI Layout Simulator ───────────────────────────
    const debrief = await analyzeHiringCommittee(
      resumeText,
      jobDescription || undefined,
      targetRole || undefined,
      companyName || undefined
    );

    // Calculate consensus average score
    const score = Math.round((debrief.hrScore + debrief.techScore + debrief.productScore) / 3);

    // ── 4. Save to Database ──────────────────────────────────
    const { data: newRecord, error: dbErr } = await supabase
      .from("analyses")
      .insert({
        user_id: user.id,
        score,
        result_json: JSON.stringify(debrief),
        target_role: targetRole || null,
        resume_text: resumeText,
        job_description: jobDescription || null,
      })
      .select("id")
      .single();

    if (dbErr || !newRecord) {
      logger.error("Failed to persist committee debrief:", dbErr);
      return NextResponse.json(
        { success: false, error: "Failed to persist debrief scorecard in database." },
        { status: 500 }
      );
    }

    // ── 5. Respond ──────────────────────────────────────────
    return NextResponse.json({
      success: true,
      data: debrief,
      analysisId: newRecord.id,
    });
  } catch (error: unknown) {
    logger.error("Committee analysis API error:", error);
    const message = error instanceof Error ? (error as Error).message : "Failed to run committee debrief";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
