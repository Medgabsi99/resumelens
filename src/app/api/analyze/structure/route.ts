import { validateAndSanitizeInput } from "@/lib/validation";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { analyzePdfStructure, extractTextFromBuffer } from "@/lib/ai";

export const maxDuration = 60; // Allow up to 60s for AI response

export async function POST(req: NextRequest) {
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

    // ── 2. Parse request ──────────────────────────────────────
    let resumeText = "";
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { success: false, error: "No file provided" },
          { status: 400 }
        );
      }

      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: "File too large (max 10MB)" },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      try {
        resumeText = await extractTextFromBuffer(buffer, file.type);
      } catch (err) {
        return NextResponse.json(
          { success: false, error: "Could not read PDF. Make sure it is a valid document." },
          { status: 400 }
        );
      }
    } else {
      const body = await req.json();
      resumeText = body.resumeText || "";
    }

    try {
      resumeText = validateAndSanitizeInput(resumeText, 15000, "Resume text", true);
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }

    if (resumeText.trim().length < 100) {
      return NextResponse.json(
        { success: false, error: "Resume text is too short or empty." },
        { status: 400 }
      );
    }

    // ── 3. Call AI Layout Scanner ─────────────────────────────
    const analysis = await analyzePdfStructure(resumeText);

    return NextResponse.json({
      success: true,
      data: analysis,
      extractedText: resumeText,
    });
  } catch (error: any) {
    logger.error("Structure scan API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to scan structure" },
      { status: 500 }
    );
  }
}
