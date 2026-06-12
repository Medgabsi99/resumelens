import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const admin = createAdminClient();
  const { data: analysis, error } = await admin
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
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("analyses")
    .delete()
    .eq("id", params.id)
    .eq("user_id", session.user.id);

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Analysis deleted successfully",
  });
}