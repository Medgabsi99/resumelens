import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { requireUserWithQuota, incrementUsage } from "@/lib/auth";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { generateSkillGapPath } from "@/lib/ai";

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
          { success: false, error: "Upgrade required to generate learning paths" },
          { status: 403 }
        );
      }
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await checkRateLimit(_user.id, "learning-paths");
    if (!rateLimit.success) {
      return rateLimitResponse();
    }

    // ── 2. Parse request ──────────────────────────────────────
    const body = await req.json();
    const { resumeText, jobDescription, roleTitle, companyName } = body;

    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { success: false, error: "Resume text and job description are required" },
        { status: 400 }
      );
    }

    await incrementUsage(_user.id);

    // ── 3. Generate Learning Path ──────────────────────────────
    const path = await generateSkillGapPath(
      resumeText,
      jobDescription,
      roleTitle || "Target Role",
      companyName || "Target Company"
    );

    return NextResponse.json({ success: true, path });
  } catch (err: unknown) {
    logger.error("Learning paths API error:", err);
    const message =
      err instanceof Error ? (err as Error).message : "Failed to generate learning path";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
