import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { requireUserWithQuota, incrementUsage } from "@/lib/auth";
import { validateAndSanitizeInput } from "@/lib/validation";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { generateSmartResume } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    let _user;
    try {
      const session = await requireUserWithQuota();
      _user = session.user;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "QuotaExceeded") {
        return NextResponse.json(
          { success: false, error: "Upgrade required to generate smart resumes" },
          { status: 403 }
        );
      }
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await checkRateLimit(_user.id, "smart-resume");
    if (!rateLimit.success) {
      return rateLimitResponse();
    }

    const body = await req.json();
    let { resumeText, targetRole, jobDescription } = body;

    try {
      resumeText = validateAndSanitizeInput(resumeText, 15000, "Resume text", true);
      if (targetRole) {
        targetRole = validateAndSanitizeInput(targetRole, 200, "Target role");
      }
      if (jobDescription) {
        jobDescription = validateAndSanitizeInput(jobDescription, 10000, "Job description");
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? (err as Error).message : String(err);
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    await incrementUsage(_user.id);

    const smartResume = await generateSmartResume(resumeText, targetRole, jobDescription);

    return NextResponse.json({
      success: true,
      data: smartResume,
    });
  } catch (err: unknown) {
    logger.error("Smart Resume API Error:", err);
    const message =
      err instanceof Error ? (err as Error).message : "Smart resume generation failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
