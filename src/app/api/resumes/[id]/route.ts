import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase";

// DELETE /api/resumes/<id>
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });

  const admin = createAdminClient();
  const { error } = await admin
    .from("resumes")
    .delete()
    .eq("id", params.id)
    .eq("user_id", session.user.id);

  if (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// PUT /api/resumes/<id> — update name/role/company/jd/text
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });

  const body = await req.json();

  type ResumeUpdate = {
    updated_at: string;
    name?: string;
    resume_text?: string;
    target_role?: string | null;
    target_company?: string | null;
    job_description?: string | null;
    last_score?: number | null;
  };

  const update: ResumeUpdate = { updated_at: new Date().toISOString() };

  if (body.name !== undefined) update.name = body.name;
  if (body.resumeText !== undefined) update.resume_text = body.resumeText;
  if (body.targetRole !== undefined) update.target_role = body.targetRole ?? null;
  if (body.targetCompany !== undefined) update.target_company = body.targetCompany ?? null;
  if (body.jobDescription !== undefined) update.job_description = body.jobDescription ?? null;
  if (body.lastScore !== undefined) update.last_score = body.lastScore ?? null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("resumes")
    .update(update)
    .eq("id", params.id)
    .eq("user_id", session.user.id)
    .select()
    .single();

  if (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}