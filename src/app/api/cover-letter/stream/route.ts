import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { validateAndSanitizeInput } from "@/lib/validation";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { generateCoverLetterStream } from "@/lib/ai/coverLetter";
import { requireUser } from "@/lib/auth";
import { createSSEResponse } from "@/lib/sse";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let _user;
  try {
    _user = await requireUser();
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(_user.id, "cover-letter-stream");
  if (!rateLimit.success) {
    return rateLimitResponse();
  }

  const body = await req.json();
  let { resumeText, jobDescription, targetRole } = body;

  try {
    resumeText = validateAndSanitizeInput(resumeText, 15000, "Resume text", true);
    if (jobDescription) {
      jobDescription = validateAndSanitizeInput(jobDescription, 10000, "Job description");
    }
    if (targetRole) {
      targetRole = validateAndSanitizeInput(targetRole, 200, "Target role");
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? (err as Error).message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
  }

  try {
    const streamResult = await generateCoverLetterStream(resumeText, jobDescription, targetRole);

    return createSSEResponse(async (send) => {
      for await (const chunk of streamResult.stream) {
        const text = chunk.text();
        if (text) {
          send(text);
        }
      }
    });
  } catch (err: unknown) {
    logger.error("Cover letter stream API error:", err);
    const message =
      err instanceof Error ? (err as Error).message : "Cover letter generation failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
