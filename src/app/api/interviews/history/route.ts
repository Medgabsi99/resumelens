import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function GET() {
  try {
    // 1. Auth check
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

    // 2. Resiliently fetch from database
    try {
      const { data, error } = await supabase
        .from("mock_interviews")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        logger.warn("Table mock_interviews not available or error:", (error instanceof Error ? error.message : String(error)));
        return NextResponse.json({ success: true, data: [], dbError: (error instanceof Error ? error.message : String(error)), fallback: true });
      }

      return NextResponse.json({ success: true, data });
    } catch (dbErr: unknown) {
      logger.warn("Graceful db catch for interviews history GET:", (dbErr instanceof Error ? dbErr.message : String(dbErr)));
      return NextResponse.json({ success: true, data: [], dbError: (dbErr instanceof Error ? dbErr.message : String(dbErr)), fallback: true });
    }
  } catch (error: unknown) {
    logger.error("Interviews history GET API error:", error);
    return NextResponse.json(
      { success: false, error: (error instanceof Error ? error.message : String(error)) || "Failed to load history" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // 1. Auth check
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

    // 2. Parse ID
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID is required" },
        { status: 400 }
      );
    }

    // 3. Resiliently delete
    try {
      const { error } = await supabase
        .from("mock_interviews")
        .delete()
        .eq("id", id)
        .eq("user_id", session.user.id);

      if (error) {
        logger.warn("Supabase delete failed on mock_interviews:", (error instanceof Error ? error.message : String(error)));
        return NextResponse.json({ success: false, error: (error instanceof Error ? error.message : String(error)) });
      }

      return NextResponse.json({ success: true });
    } catch (dbErr: unknown) {
      logger.warn("Supabase delete exception caught on mock_interviews:", (dbErr instanceof Error ? dbErr.message : String(dbErr)));
      return NextResponse.json({ success: false, error: (dbErr instanceof Error ? dbErr.message : String(dbErr)), fallback: true });
    }
  } catch (error: unknown) {
    logger.error("Interviews history DELETE API error:", error);
    return NextResponse.json(
      { success: false, error: (error instanceof Error ? error.message : String(error)) || "Failed to delete item" },
      { status: 500 }
    );
  }
}
