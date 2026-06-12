import { requireUser } from "@/lib/auth";
import { validateAndSanitizeInput } from "@/lib/validation";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { matchJobToResume } from "@/lib/ai";
import { handleCors, handleCorsPreflight } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req) || new NextResponse(null, { status: 204 });
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const user = await requireUser();
    const session = { user };

    const body = await req.json();
    let { resumeId, jobTitle, companyName, jobDescription } = body;

    if (!resumeId) {
      const errRes = NextResponse.json({ success: false, error: "resumeId is required" }, { status: 400 });
      return handleCors(req, errRes);
    }

    try {
      jobDescription = validateAndSanitizeInput(jobDescription, 10000, "Job description", true);
      if (jobTitle) {
        jobTitle = validateAndSanitizeInput(jobTitle, 200, "Job title");
      }
      if (companyName) {
        companyName = validateAndSanitizeInput(companyName, 200, "Company name");
      }
    } catch (err: unknown) {
      const errRes = NextResponse.json({ success: false, error: (err instanceof Error ? err.message : String(err)) }, { status: 400 });
      return handleCors(req, errRes);
    }

    // Fetch target resume
    const { data: resume, error: resumeError } = await supabase
      .from("resumes")
      .select("resume_text")
      .eq("id", resumeId)
      .eq("user_id", session.user.id)
      .single();

    if (resumeError || !resume) {
      const errRes = NextResponse.json({ success: false, error: resumeError?.message || "Resume not found" }, { status: 404 });
      return handleCors(req, errRes);
    }

    // Call AI evaluator
    const matchResult = await matchJobToResume(
      resume.resume_text,
      jobDescription,
      jobTitle,
      companyName
    );

    const okRes = NextResponse.json({
      success: true,
      data: matchResult
    });
    return handleCors(req, okRes);
  } catch (err: unknown) {
    logger.error("Extension match scoring error:", err);
    const errRes = NextResponse.json({ success: false, error: (err instanceof Error ? err.message : String(err)) }, { status: 500 });
    return handleCors(req, errRes);
  }
}
