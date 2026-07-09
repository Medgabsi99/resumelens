import { createServerComponentClient } from "@/lib/supabase-server";
import { requireUser } from "@/lib/auth";
import { validateAndSanitizeInput } from "@/lib/validation";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { generateOutreachMessage } from "@/lib/ai";
import { handleCors, handleCorsPreflight } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req) || new NextResponse(null, { status: 204 });
}

export async function POST(req: NextRequest) {
  try {
    const _user = await requireUser();
  const supabase = await createServerComponentClient();

    const body = await req.json();
    const { resumeId } = body;
    let { jobTitle, companyName, jobDescription, recruiterName, outreachType } = body;

    if (!resumeId) {
      const errRes = NextResponse.json({ success: false, error: "resumeId is required" }, { status: 400 });
      return handleCors(req, errRes);
    }

    try {
      jobDescription = validateAndSanitizeInput(jobDescription, 10000, "Job description", true);
      jobTitle = validateAndSanitizeInput(jobTitle, 200, "Job title", true);
      companyName = validateAndSanitizeInput(companyName, 200, "Company name", true);
      if (recruiterName) {
        recruiterName = validateAndSanitizeInput(recruiterName, 200, "Recruiter name");
      }
      if (outreachType) {
        outreachType = validateAndSanitizeInput(outreachType, 100, "Outreach type");
      }
    } catch (err: unknown) {
      const errRes = NextResponse.json({ success: false, error: (err instanceof Error ? (err as Error).message : String(err)) }, { status: 400 });
      return handleCors(req, errRes);
    }

    // Fetch the target resume text
    const { data: resume, error: resumeError } = await supabase
      .from("resumes")
      .select("resume_text")
      .eq("id", resumeId)
      .eq("user_id", _user.id)
      .single();

    if (resumeError || !resume) {
      const errRes = NextResponse.json({ success: false, error: resumeError?.message || "Resume not found" }, { status: 404 });
      return handleCors(req, errRes);
    }

    // Call the AI message generator
    const message = await generateOutreachMessage(
      resume.resume_text,
      jobDescription,
      jobTitle,
      companyName,
      recruiterName,
      outreachType
    );

    const okRes = NextResponse.json({
      success: true,
      data: message
    });
    return handleCors(req, okRes);
  } catch (err: unknown) {
    logger.error("Outreach generation endpoint error:", err);
    const errRes = NextResponse.json({ success: false, error: (err instanceof Error ? (err as Error).message : String(err)) }, { status: 500 });
    return handleCors(req, errRes);
  }
}
