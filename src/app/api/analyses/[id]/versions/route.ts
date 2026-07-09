import { requireUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// GET /api/analyses/[id]/versions — list all versions for this analysis
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const _user = await requireUser();

    const { data, error } = await supabase
      .from("resume_versions")
      .select("*")
      .eq("analysis_id", params.id)
      .eq("user_id", _user.id)
      .order("created_at", { ascending: false });

    if (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? (err as Error).message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

// POST /api/analyses/[id]/versions — create a new version snapshot
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const _user = await requireUser();

    const body = await req.json();
    const { versionName, resumeText, score } = body;

    if (!versionName?.trim() || !resumeText?.trim()) {
      return NextResponse.json({ success: false, error: "Version name and resume text are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("resume_versions")
      .insert({
        user_id: _user.id,
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
    const errorMsg = err instanceof Error ? (err as Error).message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

// DELETE /api/analyses/[id]/versions — delete a specific version
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const _user = await requireUser();

    const versionId = req.nextUrl.searchParams.get("versionId");
    if (!versionId) {
      return NextResponse.json({ success: false, error: "versionId is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("resume_versions")
      .delete()
      .eq("id", versionId)
      .eq("analysis_id", params.id)
      .eq("user_id", _user.id);

    if (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? (err as Error).message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
