import { requireUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function GET() {
  // ── 1. Auth check ────────────────────────────────────────
  const supabase = createRouteHandlerClient({ cookies });
  const user = await requireUser();
  const session = { user };

  // ── 2. Fetch analyses summary ────────────────────────────
  // Exclude result_json and resume_text to keep payload lightweight and fast
  const { data, error } = await supabase
    .from("analyses")
    .select("id, score, target_role, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
