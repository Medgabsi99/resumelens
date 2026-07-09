import { requireUser } from "@/lib/auth";
import { validateAndSanitizeInput } from "@/lib/validation";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { chatWithResumeStream } from "@/lib/ai/chat";
import { getUserProfile, canAnalyze } from "@/lib/auth";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // â”€â”€ 1. Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const _user = await requireUser();

  // â”€â”€ 2. Quota check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const profile = await getUserProfile(_user.id);
  if (!profile || !canAnalyze(profile)) {
    return NextResponse.json(
      { success: false, error: "Upgrade required to use chat" },
      { status: 403 }
    );
  }

  // â”€â”€ 3. Parse & validate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ 4. RAG Chat â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // chatWithResumeStream now embeds the question (RETRIEVAL_QUERY task type)
  // and retrieves the top-k semantically relevant resume chunks from pgvector
  // before calling the LLM â€” true Retrieval-Augmented Generation.
  try {
    const streamResult = await chatWithResumeStream(
      message,
      _user.id, // userId â€” scopes vector search to this user
      supabase,        // authenticated client â€” passed to retrieval layer
      resumeText,      // full text â€” fallback if no embeddings stored yet
      jobDescription,
      targetRole,
      history,
    );

    const responseStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of streamResult.stream) {
            controller.enqueue(encoder.encode(chunk.text()));
          }
        } catch (streamErr) {
          logger.error("Chat stream error:", streamErr);
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
    logger.error("Chat API error:", err);
    const errorMsg = err instanceof Error ? (err as Error).message : "Chat failed";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
