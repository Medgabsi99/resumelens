import { validateAndSanitizeInput } from "@/lib/validation";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { generateInterviewQuestionsStream } from "@/lib/ai";
import { getUserProfile, canAnalyze, requireUser } from "@/lib/auth";

export const maxDuration = 60; // Allow up to 60s for AI response

export async function POST(req: NextRequest) {
  const _user = await requireUser();

  // ── 2. Load user profile & check quota ───────────────────
  const profile = await getUserProfile(_user.id);
  if (!profile || !canAnalyze(profile)) {
    return NextResponse.json(
      { success: false, error: "Upgrade required to generate interview questions" },
      { status: 403 }
    );
  }

  // ── 3. Parse request ──────────────────────────────────────
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
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
  }

  // ── 4. Generate Interview Questions ───────────────────────
  try {
    const streamResult = await generateInterviewQuestionsStream(resumeText, jobDescription, targetRole);
    const responseStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of streamResult.stream) {
            const text = chunk.text();
            controller.enqueue(encoder.encode(text));
          }
        } catch (streamErr) {
          logger.error("Interview questions stream error:", streamErr);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err: unknown) {
    logger.error("Interview questions API error:", err);
    const message = err instanceof Error ? err.message : "Interview questions generation failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
