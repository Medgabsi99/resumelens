import { createServerComponentClient } from "@/lib/supabase-server";
import { requireUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  // ── 1. Auth check ────────────────────────────────────────
  const _user = await requireUser();
  const supabase = await createServerComponentClient();

  // ── 2. Fetch analyses summary ────────────────────────────
  // Exclude result_json and resume_text to keep payload lightweight and fast
  const { data, error } = await supabase
    .from("analyses")
    .select("id, score, target_role, created_at")
    .eq("user_id", _user.id)
    .order("created_at", { ascending: false });

  if (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
