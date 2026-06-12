import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../lib/supabase";
import { createRouteHandlerClient } from "@/lib/supabase";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const maxDuration = 15; // Lower duration limit since it's just a file upload

export async function POST(req: NextRequest) {
  // Auth check
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

    const adminClient = createAdminClient();
    const bucket = process.env.SUPABASE_PDF_BUCKET || "pdfs";
    const fileName = `exports/${Date.now()}-${template}.pdf`;

    const { error: uploadError } = await adminClient.storage
      .from(bucket)
      .upload(fileName, pdfBuffer, { contentType: "application/pdf" });

    if (uploadError) {
      logger.error("Supabase upload error:", uploadError.message || uploadError);
      throw uploadError;
    }

    const { data: urlData } = await adminClient.storage
      .from(bucket)
      .getPublicUrl(fileName);

    if (urlData?.publicUrl) {
      return NextResponse.json(
        { success: true, url: urlData.publicUrl },
        { status: 200 }
      );
    }

    // Fallback: create a signed URL (valid for 24 hours) so private buckets still work.
    try {
      const expiresIn = 60 * 60 * 24; // 24 hours
      const { data: signedData, error: signedErr } = await adminClient.storage
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
        { success: true, url: signedData.signedUrl, signed: true },
        { status: 200 }
      );
    } catch (e) {
      logger.error("Signed URL fallback failed:", e);
      throw e;
    }
  } catch (err: any) {
    logger.error("Upload PDF error:", err);
    return NextResponse.json(
      { success: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
