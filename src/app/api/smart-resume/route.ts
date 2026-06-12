import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
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
    const { resumeText, targetRole, jobDescription } = body;

    if (!resumeText || typeof resumeText !== "string") {
      return NextResponse.json(
        { success: false, error: "Resume text is required" },
        { status: 400 },
      );
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
    console.error("Smart resume generation error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate smart resume";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
