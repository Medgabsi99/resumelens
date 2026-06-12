import { requireUser } from "@/lib/auth";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import crypto from "crypto";

export const runtime = "nodejs";
export const maxDuration = 15; // Lower duration limit since it's just a file upload

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = createRouteHandlerClient({ cookies });
  const user = await requireUser();
  const session = { user };

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const template = (formData.get("template") as string) || "classic";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No PDF file provided" },
        { status: 400 }
      );
    }

    const pdfBuffer = Buffer.from(await file.arrayBuffer());

    const bucket = process.env.SUPABASE_PDF_BUCKET || "pdfs";
    const fileName = `exports/${crypto.randomUUID()}-${template}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, pdfBuffer, { contentType: "application/pdf" });

    if (uploadError) {
      logger.error("Supabase upload error:", uploadError.message || uploadError);
      throw uploadError;
    }

    // Always create a signed URL (valid for 2 hours) to prevent predictable public access.
    const expiresIn = 60 * 60 * 2; // 2 hours
    const { data: signedData, error: signedErr } = await supabase.storage
      .from(bucket)
      .createSignedUrl(fileName, expiresIn);

    if (signedErr || !signedData?.signedUrl) {
      logger.error(
        "Supabase createSignedUrl error:",
        signedErr?.message || signedErr
      );
      throw signedErr || new Error("Failed to create signed URL");
    }

    return NextResponse.json(
      { success: true, url: signedData.signedUrl },
      { status: 200 }
    );
  } catch (err: unknown) {
    logger.error("Upload PDF error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
