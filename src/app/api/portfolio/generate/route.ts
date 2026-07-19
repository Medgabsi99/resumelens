import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { requireUser } from "@/lib/auth";
import { validateAndSanitizeInput } from "@/lib/validation";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { generatePortfolio } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const _user = await requireUser();
    const rateLimit = await checkRateLimit(_user.id, "portfolio-generate");
    if (!rateLimit.success) {
      return rateLimitResponse();
    }

    const body = await req.json();
    let { resumeText } = body;

    try {
      resumeText = validateAndSanitizeInput(resumeText, 15000, "Resume text", true);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? (err as Error).message : String(err);
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
      { success: false, error: (error instanceof Error ? (error as Error).message : String(error)) || "Failed to generate portfolio copy" },
      { status: 500 }
    );
  }
}
