import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase";
import { SavedResume } from "@/types";

// GET /api/resumes — list all saved resumes
export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("resumes")
    .select("*")
    .eq("user_id", session.user.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data as SavedResume[] });
}

// POST /api/resumes — save a new resume
export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const { name, resumeText, targetRole, targetCompany, jobDescription, lastScore } = body;

  if (!name?.trim() || !resumeText?.trim()) {
    return NextResponse.json({ success: false, error: "Name and resume text are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("resumes")
    .insert({
      user_id: session.user.id,
      name: name.trim(),
      target_role: targetRole || null,
      target_company: targetCompany || null,
      resume_text: resumeText,
      job_description: jobDescription || null,
      last_score: lastScore ?? null,
    })
    .select()
    .single();

  if (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data as SavedResume });
}