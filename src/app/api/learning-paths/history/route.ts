import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET() {
  try {
    // ── 1. Auth check ────────────────────────────────────────
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

    // ── 2. Resiliently fetch from database ────────────────────
    try {
      const { data, error } = await supabase
        .from("learning_paths")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Table learning_paths not available or error:", error.message);
        return NextResponse.json({ success: true, data: [], dbError: error.message, fallback: true });
      }

      return NextResponse.json({ success: true, data });
    } catch (dbErr: any) {
      console.warn("Graceful db catch for learning paths history GET:", dbErr.message);
      return NextResponse.json({ success: true, data: [], dbError: dbErr.message, fallback: true });
    }
  } catch (error: any) {
    console.error("Learning paths history GET API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load history" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // ── 1. Auth check ────────────────────────────────────────
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

    // ── 2. Parse ID ──────────────────────────────────────────
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID is required" },
        { status: 400 }
      );
    }

    // ── 3. Resiliently delete ────────────────────────────────
    try {
      const { error } = await supabase
        .from("learning_paths")
        .delete()
        .eq("id", id)
        .eq("user_id", session.user.id);

      if (error) {
        console.warn("Supabase delete failed on learning_paths:", error.message);
        return NextResponse.json({ success: false, error: error.message });
      }

      return NextResponse.json({ success: true });
    } catch (dbErr: any) {
      console.warn("Supabase delete exception caught on learning_paths:", dbErr.message);
      return NextResponse.json({ success: false, error: dbErr.message, fallback: true });
    }
  } catch (error: any) {
    console.error("Learning paths history DELETE API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete item" },
      { status: 500 }
    );
  }
}
