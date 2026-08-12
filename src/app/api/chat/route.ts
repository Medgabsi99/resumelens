import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { createServerComponentClient } from "@/lib/supabase-server";
import { requireUser } from "@/lib/auth";
import { validateAndSanitizeInput } from "@/lib/validation";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { chatWithResumeStream } from "@/lib/ai/chat";
import { getUserProfile, canAnalyze } from "@/lib/auth";
import { createSSEResponse } from "@/lib/sse";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // ── 1. Auth ──────────────────────────────────────────────
  const _user = await requireUser();
  const rateLimit = await checkRateLimit(_user.id, "chat");
  if (!rateLimit.success) {
    return rateLimitResponse();
  }
  const supabase = await createServerComponentClient();

  // ── 2. Quota check ───────────────────────────────────────
  const profile = await getUserProfile(_user.id);
  if (!profile || !canAnalyze(profile)) {
    return NextResponse.json(
      { success: false, error: "Upgrade required to use chat" },
      { status: 403 }
    );
  }

  // ── 3. Parse & validate ──────────────────────────────────
  const body = await req.json();
  let { message, resumeText, jobDescription, targetRole } = body;
  const { history } = body;

  try {
    message = validateAndSanitizeInput(message, 2000, "Message", true);
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

  // ── 4. RAG Chat ──────────────────────────────────────────
  try {
    const streamResult = await chatWithResumeStream(
      message,
      _user.id,
      supabase,
      resumeText,
      jobDescription,
      targetRole,
      history
    );

    return createSSEResponse(async (send) => {
      for await (const chunk of streamResult.stream) {
        const text = chunk.text();
        if (text) {
          send(text);
        }
      }
    });
  } catch (err: unknown) {
    logger.error("Chat API error:", err);
    const errorMsg = err instanceof Error ? (err as Error).message : "Chat failed";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
