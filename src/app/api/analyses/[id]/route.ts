import { createServerComponentClient, createAdminClient } from "@/lib/supabase-server";
import { requireUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const _user = await requireUser();
  const supabase = await createServerComponentClient();
  const { id } = await params;

  let { data: analysis, error } = await supabase
    .from("analyses")
    .select("id, resume_text, job_description, target_role, score, result_json, created_at")
    .eq("id", id)
    .eq("user_id", _user.id)
    .single();

  if (error || !analysis) {
    const admin = createAdminClient();
    const { data: adminData } = await admin
      .from("analyses")
      .select("id, resume_text, job_description, target_role, score, result_json, created_at")
      .eq("id", id)
      .eq("user_id", _user.id)
      .single();

    if (adminData) {
      analysis = adminData;
      error = null;
    }
  }

  if (error || !analysis) {
    return NextResponse.json(
      { success: false, error: "Analysis not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      id: analysis.id,
      resume_text: analysis.resume_text || "",
      job_description: analysis.job_description || "",
      target_role: analysis.target_role || "",
      score: analysis.score,
      result_json: analysis.result_json,
      created_at: analysis.created_at,
    },
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const _user = await requireUser();
  const supabase = await createServerComponentClient();
  const { id } = await params;

  const { error } = await supabase
    .from("analyses")
    .delete()
    .eq("id", id)
    .eq("user_id", _user.id);

  if (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Analysis deleted successfully",
  });
}