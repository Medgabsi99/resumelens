import { requireUser } from "@/lib/auth";
import { validateAndSanitizeInput } from "@/lib/validation";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { evaluateInterviewAnswer } from "@/lib/ai";

export const maxDuration = 60; // Allow up to 60s for AI response

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    await requireUser();

    // 2. Parse request
    const body = await req.json();
    let { resumeText, question, answer, jobDescription } = body;

    try {
      resumeText = validateAndSanitizeInput(resumeText, 15000, "Resume text", true);
      question = validateAndSanitizeInput(question, 2000, "Question", true);
      answer = validateAndSanitizeInput(answer, 4000, "Answer", true);
      if (jobDescription) {
        jobDescription = validateAndSanitizeInput(jobDescription, 10000, "Job description");
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    // 3. Evaluate response
    const evaluation = await evaluateInterviewAnswer(
      resumeText,
      question,
      answer,
      jobDescription || undefined
    );

    return NextResponse.json({ success: true, evaluation });
  } catch (error: unknown) {
    logger.error("Simulator turn evaluation route error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to evaluate answer";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
