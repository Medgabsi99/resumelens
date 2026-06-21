import { requireUser } from "@/lib/auth";
import { validateAndSanitizeInput } from "@/lib/validation";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { generateOutreachMessage } from "@/lib/ai";
import { getUserProfile, canAnalyze } from "@/lib/auth";

export const maxDuration = 60; // Allow up to 60s for AI response

export async function POST(req: NextRequest) {
  // ── 1. Auth check ────────────────────────────────────────
  const supabase = createRouteHandlerClient({ cookies });
  const user = await requireUser();
  const session = { user };

  // ── 2. Load user profile & check quota ───────────────────
  const profile = await getUserProfile(session.user.id);
  if (!profile || !canAnalyze(profile)) {
    return NextResponse.json(
      { success: false, error: "Upgrade required to generate outreach messages" },
      { status: 403 }
    );
  }

  // ── 3. Parse request ──────────────────────────────────────
  const body = await req.json();
  let { resumeText, jobDescription, jobTitle, companyName, recruiterName, outreachType } = body;

  try {
    resumeText = validateAndSanitizeInput(resumeText, 15000, "Resume text", true);
    jobTitle = validateAndSanitizeInput(jobTitle, 200, "Job title", true);
    companyName = validateAndSanitizeInput(companyName, 200, "Company name", true);
    if (jobDescription) {
      jobDescription = validateAndSanitizeInput(jobDescription, 10000, "Job description");
    }
    if (recruiterName) {
      recruiterName = validateAndSanitizeInput(recruiterName, 200, "Recruiter name");
    }
    if (outreachType) {
      outreachType = validateAndSanitizeInput(outreachType, 100, "Outreach type");
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
  }

  // ── 4. Generate Outreach Message ──────────────────────────
  try {
    const message = await generateOutreachMessage(
      resumeText,
      jobDescription || "",
      jobTitle,
      companyName,
      recruiterName,
      outreachType || "recruiter"
    );

    return NextResponse.json({
      success: true,
      data: message,
    });
  } catch (err: unknown) {
    logger.error("Outreach API error:", err);
    const message = err instanceof Error ? err.message : "Outreach message generation failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
