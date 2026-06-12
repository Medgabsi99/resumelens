import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase";
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
    const {
      resumeId,
      jobTitle,
      companyName,
      jobUrl,
      jobDescription,
      overallScore,
      fitVerdict,
      resultJson,
    } = body;

    if (!jobTitle || !companyName || !jobDescription) {
      const errRes = NextResponse.json({ success: false, error: "Job title, company, and description are required" }, { status: 400 });
      return handleCors(req, errRes);
    }

    const admin = createAdminClient();

    // 1. Insert into job_matches
    const { error: matchError } = await admin
      .from("job_matches")
      .insert({
        user_id: session.user.id,
        job_title: jobTitle,
        company_name: companyName,
        job_description: jobDescription,
        overall_score: overallScore || 0,
        fit_verdict: fitVerdict || "weak",
        result_json: typeof resultJson === "string" ? resultJson : JSON.stringify(resultJson),
      });

    if (matchError) {
      logger.error("Match insert error:", matchError);
      const errRes = NextResponse.json({ success: false, error: `Failed to save match: ${matchError.message}` }, { status: 500 });
      return handleCors(req, errRes);
    }

    // 2. Insert into applications (saved status)
    const { error: appError } = await admin
      .from("applications")
      .insert({
        user_id: session.user.id,
        company_name: companyName,
        job_title: jobTitle,
        job_url: jobUrl || null,
        job_description: jobDescription,
        status: "saved",
        priority: "medium",
        resume_id: resumeId || null,
        match_score: overallScore || null,
      });

    if (appError) {
      logger.error("Application insert error:", appError);
      const errRes = NextResponse.json({ success: false, error: `Failed to save application: ${appError.message}` }, { status: 500 });
      return handleCors(req, errRes);
    }

    const okRes = NextResponse.json({ success: true, message: "Application tracked successfully!" });
    return handleCors(req, okRes);
  } catch (err: unknown) {
    logger.error("Extension track application error:", err);
    const errRes = NextResponse.json({ success: false, error: (err instanceof Error ? err.message : String(err)) }, { status: 500 });
    return handleCors(req, errRes);
  }
}
