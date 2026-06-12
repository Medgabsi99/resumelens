import { requireUser } from "@/lib/auth";
import { validateAndSanitizeInput } from "@/lib/validation";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { generatePortfolio } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const user = await requireUser();
  const session = { user };

    const body = await req.json();
    let { resumeText } = body;

    try {
      resumeText = validateAndSanitizeInput(resumeText, 15000, "Resume text", true);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    const data = await generatePortfolio(resumeText);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    logger.error("Generate portfolio error:", error);
    return NextResponse.json(
      { success: false, error: (error instanceof Error ? error.message : String(error)) || "Failed to generate portfolio copy" },
      { status: 500 }
    );
  }
}
