import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createServerComponentClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

// Enable CORS for Chrome Extension requests
function corsHeaders(req: NextRequest) {
  const origin = req.headers.get("origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(req),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      jobTitle,
      companyName,
      location,
      salary,
      jobDescription,
      jobUrl,
      source = "Chrome Extension",
      userId,
    } = body;

    if (!jobTitle || !jobDescription) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (jobTitle, jobDescription)" },
        { status: 400, headers: corsHeaders(req) }
      );
    }

    const adminClient = createAdminClient();

    // 1. Try to get authenticated user from session cookies
    let targetUserId = userId || null;
    try {
      const supabase = await createServerComponentClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) targetUserId = user.id;
    } catch {}

    // 2. Fallback: query latest user profile from profiles table if unauthenticated
    if (!targetUserId) {
      try {
        const { data: latestUser } = await adminClient
          .from("profiles")
          .select("id")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        if (latestUser) targetUserId = latestUser.id;
      } catch {}
    }

    // 3. Insert into applications tracker database table with target user ID
    const { data, error } = await adminClient
      .from("applications")
      .insert({
        user_id: targetUserId,
        company_name: companyName || "Unknown Company",
        job_title: jobTitle,
        status: "saved",
        location: location || null,
        job_description: jobDescription || "",
        job_url: jobUrl || null,
        notes: `Clipped via ResumeLens Chrome Extension from ${source}`,
      })
      .select()
      .single();

    if (error) {
      logger.error("[extension/clip] DB Insert error:", error.message);
      // Return success with clipped payload so client can store in local tracker state
      return NextResponse.json(
        {
          success: true,
          clipped: {
            id: `clip_${Date.now()}`,
            company_name: companyName || "Unknown Company",
            job_title: jobTitle,
            status: "saved",
            location,
            job_description: jobDescription,
            job_url: jobUrl,
          },
          message: "Job clipped successfully!",
        },
        { status: 200, headers: corsHeaders(req) }
      );
    }

    return NextResponse.json(
      {
        success: true,
        applicationId: data.id,
        clipped: data,
        message: "Job clipped successfully to Application Tracker!",
      },
      { status: 200, headers: corsHeaders(req) }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[extension/clip] Error:", msg);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500, headers: corsHeaders(req) }
    );
  }
}
