import { requireUser } from "@/lib/auth";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function GET() {
  try {
    // ── 1. Auth check ────────────────────────────────────────
    const supabase = createRouteHandlerClient({ cookies });
    const user = await requireUser();
  const session = { user };

    // ── 2. Resiliently fetch from database ────────────────────
    try {
      const { data, error } = await supabase
        .from("learning_paths")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        logger.warn("Table learning_paths not available or error:", (error instanceof Error ? error.message : String(error)));
        return NextResponse.json({ success: true, data: [], dbError: (error instanceof Error ? error.message : String(error)), fallback: true });
      }

      return NextResponse.json({ success: true, data });
    } catch (dbErr: unknown) {
      logger.warn("Graceful db catch for learning paths history GET:", (dbErr instanceof Error ? dbErr.message : String(dbErr)));
      return NextResponse.json({ success: true, data: [], dbError: (dbErr instanceof Error ? dbErr.message : String(dbErr)), fallback: true });
    }
  } catch (error: unknown) {
    logger.error("Learning paths history GET API error:", error);
    return NextResponse.json(
      { success: false, error: (error instanceof Error ? error.message : String(error)) || "Failed to load history" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // ── 1. Auth check ────────────────────────────────────────
    const supabase = createRouteHandlerClient({ cookies });
    const user = await requireUser();
  const session = { user };

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
        logger.warn("Supabase delete failed on learning_paths:", (error instanceof Error ? error.message : String(error)));
        return NextResponse.json({ success: false, error: (error instanceof Error ? error.message : String(error)) });
      }

      return NextResponse.json({ success: true });
    } catch (dbErr: unknown) {
      logger.warn("Supabase delete exception caught on learning_paths:", (dbErr instanceof Error ? dbErr.message : String(dbErr)));
      return NextResponse.json({ success: false, error: (dbErr instanceof Error ? dbErr.message : String(dbErr)), fallback: true });
    }
  } catch (error: unknown) {
    logger.error("Learning paths history DELETE API error:", error);
    return NextResponse.json(
      { success: false, error: (error instanceof Error ? error.message : String(error)) || "Failed to delete item" },
      { status: 500 }
    );
  }
}
