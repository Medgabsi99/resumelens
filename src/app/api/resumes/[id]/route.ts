import { createServerComponentClient } from "@/lib/supabase-server";
import { requireUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// DELETE /api/resumes/<id>
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const _user = await requireUser();
  const supabase = await createServerComponentClient();
  const { id } = await params;

  const { error } = await supabase
    .from("resumes")
    .delete()
    .eq("id", id)
    .eq("user_id", _user.id);

  if (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// PUT /api/resumes/<id> — update name/role/company/jd/text
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const _user = await requireUser();
  const supabase = await createServerComponentClient();
  const { id } = await params;

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

  const { data, error } = await supabase
    .from("resumes")
    .update(update)
    .eq("id", id)
    .eq("user_id", _user.id)
    .select()
    .single();

  if (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}