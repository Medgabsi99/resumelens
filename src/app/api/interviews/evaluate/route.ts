import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { requireUserWithQuota, incrementUsage } from "@/lib/auth";
import { validateAndSanitizeInput } from "@/lib/validation";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { evaluateInterviewAnswer } from "@/lib/ai";

export const maxDuration = 60; // Allow up to 60s for AI response

export async function POST(req: NextRequest) {
  try {
    // 1. Auth & Quota check
    let _user;
    try {
      const session = await requireUserWithQuota();
      _user = session.user;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "QuotaExceeded") {
        return NextResponse.json(
          { success: false, error: "Upgrade required to evaluate interview answers" },
          { status: 403 }
        );
      }
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await checkRateLimit(_user.id, "interviews-evaluate");
    if (!rateLimit.success) {
      return rateLimitResponse();
    }

    // 2. Parse request
    const body = await req.json();
    let { resumeText, question, answer, jobDescription } = body;

    try {
      resumeText = validateAndSanitizeInput(resumeText, 15000, "Resume text", true);
      question = validateAndSanitizeInput(question, 2000, "Question", true);
      answer = validateAndSanitizeInput(answer, 5000, "Answer", true);
      if (jobDescription) {
        jobDescription = validateAndSanitizeInput(jobDescription, 10000, "Job description");
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? (err as Error).message : String(err);
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    await incrementUsage(_user.id);

    // 3. Evaluate via AI
    const evaluation = await evaluateInterviewAnswer(resumeText, question, answer, jobDescription);

    return NextResponse.json({ success: true, evaluation });
  } catch (err: unknown) {
    logger.error("Interview Evaluation API Error:", err);
    const message = err instanceof Error ? (err as Error).message : "Interview evaluation failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
