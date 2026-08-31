import { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { requireUser, getUserProfile, canAnalyze, incrementUsage } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-server";
import { formatSseEvent, streamAnalyzeResume } from "@/lib/ai/streamAnalyze";
import { generateAndStoreEmbeddings } from "@/lib/ai/embedPipeline";
import { logger } from "@/lib/logger";

export const maxDuration = 60;

export async function POST(req: NextRequest): Promise<Response> {
  // ── 1. Auth check ──────────────────────────────────────────
  let user;
  try {
    user = await requireUser();
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rateLimit = await checkRateLimit(user.id, "analyze");
  if (!rateLimit.success) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  const profile = await getUserProfile(user.id);
  if (!profile || !canAnalyze(profile)) {
    return new Response(JSON.stringify({ error: "Plan limit reached" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { resumeText, jobDescription, targetRole } = body;
  if (!resumeText || typeof resumeText !== "string") {
    return new Response(JSON.stringify({ error: "No resume text provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── 2. Create ReadableStream for SSE ────────────────────────
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const finalResult = await streamAnalyzeResume(
          resumeText,
          jobDescription,
          targetRole,
          (event, data) => {
            controller.enqueue(encoder.encode(formatSseEvent(event, data)));
          }
        );

        // Persist analysis and increment usage in DB
        const adminClient = createAdminClient();
        const [insertResult] = await Promise.all([
          adminClient
            .from("analyses")
            .insert({
              user_id: user.id,
              score: finalResult.score,
              result_json: JSON.stringify(finalResult),
              target_role: targetRole || null,
              resume_text: resumeText,
              job_description: jobDescription || null,
            })
            .select("id"),
          incrementUsage(user.id),
        ]);

        const insertedId = insertResult.data?.[0]?.id;

        // Emit final completion metadata
        controller.enqueue(
          encoder.encode(
            formatSseEvent("done", {
              analysisId: insertedId,
              finalResult,
            })
          )
        );

        // Background embeddings
        if (insertedId) {
          generateAndStoreEmbeddings({
            userId: user.id,
            resumeText,
            analysisId: insertedId,
          }).catch((e) => logger.warn("[stream] Embed failed non-fatal:", e?.message));
        }

        controller.close();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Streaming analysis failed";
        controller.enqueue(encoder.encode(formatSseEvent("error", { message })));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
