import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { requireUserWithQuota, incrementUsage } from "@/lib/auth";
import { validateAndSanitizeInput } from "@/lib/validation";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { analyzePdfStructure, extractTextFromBuffer } from "@/lib/ai";

export const maxDuration = 60; // Allow up to 60s for AI response

export async function POST(req: NextRequest) {
  try {
    // ── 1. Auth & Quota check ──────────────────────────────────
    let _user;
    try {
      const session = await requireUserWithQuota();
      _user = session.user;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "QuotaExceeded") {
        return NextResponse.json(
          { success: false, error: "Upgrade required to run ATS structural scans" },
          { status: 403 }
        );
      }
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await checkRateLimit(_user.id, "analyze-structure");
    if (!rateLimit.success) {
      return rateLimitResponse();
    }

    // ── 2. Parse request ──────────────────────────────────────
    let resumeText = "";
    let pdfBuffer: Buffer | undefined = undefined;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
      }

      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: "File too large (max 10MB)" },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      if (file.type === "application/pdf") {
        pdfBuffer = buffer;
      }

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
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? (err as Error).message : String(err);
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    if (resumeText.trim().length < 100) {
      return NextResponse.json(
        { success: false, error: "Resume text is too short or empty." },
        { status: 400 }
      );
    }

    await incrementUsage(_user.id);

    // ── 3. Call AI Layout Scanner ─────────────────────────────
    const analysis = await analyzePdfStructure(resumeText, pdfBuffer);

    return NextResponse.json({
      success: true,
      data: analysis,
      extractedText: resumeText,
    });
  } catch (error: unknown) {
    logger.error("Structure scan API error:", error);
    const message = error instanceof Error ? (error as Error).message : "Failed to scan structure";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
