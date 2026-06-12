import { requireUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  const user = await requireUser();
  const session = { user };

  const { data: analysis, error } = await supabase
    .from("analyses")
    .select("id, resume_text, job_description, target_role, score")
    .eq("id", params.id)
    .eq("user_id", session.user.id)
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
      resumeText: analysis.resume_text || "",
      jobDescription: analysis.job_description || "",
      targetRole: analysis.target_role || "",
      score: analysis.score,
    },
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  const user = await requireUser();
  const session = { user };

  const { error } = await supabase
    .from("analyses")
    .delete()
    .eq("id", params.id)
    .eq("user_id", session.user.id);

  if (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Analysis deleted successfully",
  });
}