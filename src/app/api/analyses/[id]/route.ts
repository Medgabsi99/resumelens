import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const _user = await requireUser();
  const supabase = createServerComponentClient({ cookies });

  const { data: analysis, error } = await supabase
    .from("analyses")
    .select("id, resume_text, job_description, target_role, score, result_json, created_at")
    .eq("id", params.id)
    .eq("user_id", _user.id)
    .single();

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
  { params }: { params: { id: string } }
) {
  const _user = await requireUser();
  const supabase = createServerComponentClient({ cookies });

  const { error } = await supabase
    .from("analyses")
    .delete()
    .eq("id", params.id)
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