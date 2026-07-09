import { requireUser } from "@/lib/auth";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { generateSkillGapPath } from "@/lib/ai";

export const maxDuration = 60; // Allow up to 60s for AI response

export async function POST(req: NextRequest) {
  try {
    // ── 1. Auth check ────────────────────────────────────────
    await requireUser();

    // ── 2. Parse request ──────────────────────────────────────
    const body = await req.json();
    const { resumeText, jobDescription, roleTitle, companyName } = body;

    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { success: false, error: "Resume text and job description are required" },
        { status: 400 }
      );
    }

    if (!roleTitle || !companyName) {
      return NextResponse.json(
        { success: false, error: "Role title and company name are required" },
        { status: 400 }
      );
    }

    // ── 3. Call AI Generator ──────────────────────────────────
    const path = await generateSkillGapPath(
      resumeText,
      jobDescription,
      roleTitle,
      companyName
    );

    return NextResponse.json({ success: true, path });
  } catch (error: unknown) {
    logger.error("Learning path generation API error:", error);
    return NextResponse.json(
      { success: false, error: (error instanceof Error ? error.message : String(error)) || "Failed to generate learning path" },
      { status: 500 }
    );
  }
}
