import { validateAndSanitizeInput } from "@/lib/validation";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { generateSmartResume } from "@/lib/ai";
import { resumeToText } from "@/lib/parseResume";

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = createServerComponentClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
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
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }

    // Call AI to generate structured resume
    const smartResult = await generateSmartResume(
      resumeText,
      targetRole,
      jobDescription,
    );

    // Convert structured data back to plain text for the editor
    const { recommendedTemplate, ...parsedResume } = smartResult;
    const enhancedText = resumeToText(parsedResume);

    return NextResponse.json({
      success: true,
      parsedResume,
      recommendedTemplate,
      enhancedText,
    });
  } catch (error: unknown) {
    logger.error("Smart resume generation error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate smart resume";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
