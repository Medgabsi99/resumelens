import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase";

// GET /api/analyses/[id]/versions — list all versions for this analysis
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("resume_versions")
      .select("*")
      .eq("analysis_id", params.id)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

// POST /api/analyses/[id]/versions — create a new version snapshot
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });

    const body = await req.json();
    const { versionName, resumeText, score } = body;

    if (!versionName?.trim() || !resumeText?.trim()) {
      return NextResponse.json({ success: false, error: "Version name and resume text are required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("resume_versions")
      .insert({
        user_id: session.user.id,
        analysis_id: params.id,
        version_name: versionName.trim(),
        resume_text: resumeText,
        score: score ?? null,
      })
      .select()
      .single();

    if (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

// DELETE /api/analyses/[id]/versions — delete a specific version
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });

    const versionId = req.nextUrl.searchParams.get("versionId");
    if (!versionId) {
      return NextResponse.json({ success: false, error: "versionId is required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("resume_versions")
      .delete()
      .eq("id", versionId)
      .eq("analysis_id", params.id)
      .eq("user_id", session.user.id);

    if (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
