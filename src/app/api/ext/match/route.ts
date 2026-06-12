import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase";
import { matchJobToResume } from "@/lib/ai";
import { handleCors, handleCorsPreflight } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req) || new NextResponse(null, { status: 204 });
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      const errRes = NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
      return handleCors(req, errRes);
    }

    const body = await req.json();
    const { resumeId, jobTitle, companyName, jobDescription } = body;

    if (!resumeId || !jobDescription) {
      const errRes = NextResponse.json({ success: false, error: "resumeId and jobDescription are required" }, { status: 400 });
      return handleCors(req, errRes);
    }

    const admin = createAdminClient();
    
    // Fetch target resume
    const { data: resume, error: resumeError } = await admin
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
  } catch (err: any) {
    logger.error("Extension match scoring error:", err);
    const errRes = NextResponse.json({ success: false, error: err.message }, { status: 500 });
    return handleCors(req, errRes);
  }
}
