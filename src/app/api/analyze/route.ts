import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { validateAndSanitizeInput } from "@/lib/validation";
import { after, NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { analyzeResume, previewAnalyzeResume, extractTextFromBuffer } from "@/lib/ai";
import { generateAndStoreEmbeddings } from "@/lib/ai/embedPipeline";
import { requireUser, getUserProfile, canAnalyze, incrementUsage } from "@/lib/auth";
import { runAtsChecks } from "@/lib/atsRulesChecker";
import { AnalyzeResponse } from "@/types";
import { extractResumeStyle } from "@/lib/ai/extractResumeStyle";
import { DEFAULT_STYLE_TOKENS } from "@/lib/resumeStyleDefaults";
import type { ResumeStyleTokens } from "@/types";

export const maxDuration = 60; // Allow up to 60s for AI response

export async function POST(req: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
  // ── 1. Auth check ────────────────────────────────────────
  let _user;
  try {
    _user = await requireUser();
  } catch {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(_user.id, "analyze");
  if (!rateLimit.success) {
    return rateLimitResponse();
  }

  const userId = _user.id;

  // ── 2. Load user profile & check quota ───────────────────
  const profile = await getUserProfile(userId);
  if (!profile) {
    return NextResponse.json({ success: false, error: "Profile not found" }, { status: 400 });
  }

  // ── 3. Parse request (multipart or JSON) ─────────────────
  let resumeText = "";
  let jobDescription: string | undefined;
  let targetRole: string | undefined;
  let fileBuffer: Buffer | null = null;
  let fileMimeType = "";

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    // File upload path
    const form = await req.formData();
    const file = form.get("file") as File | null;
    jobDescription = (form.get("jobDescription") as string) || undefined;
    targetRole = (form.get("targetRole") as string) || undefined;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File too large (max 10MB)" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    fileBuffer = buffer;
    fileMimeType = file.type;
    try {
      resumeText = await extractTextFromBuffer(buffer, file.type);
    } catch (err) {
      return NextResponse.json(
        { success: false, error: "Could not read file. Try PDF or DOCX." },
        { status: 400 }
      );
    }
  } else {
    // JSON path (plain text paste)
    const body = await req.json();
    resumeText = body.resumeText || "";
    jobDescription = body.jobDescription;
    targetRole = body.targetRole;
  }

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

  if (resumeText.trim().length < 100) {
    return NextResponse.json(
      { success: false, error: "Resume text is too short or empty." },
      { status: 400 }
    );
  }

  // ── 4. Free tier — return preview only ───────────────────
  if (!canAnalyze(profile)) {
    // Run a lightweight preview (score + summary only) - gates the API call itself to avoid full token expense
    try {
      const preview = await previewAnalyzeResume(resumeText, jobDescription, targetRole);
      return NextResponse.json({
        success: true,
        requiresUpgrade: true,
        preview: {
          score: preview.score,
          summary: preview.summary,
          strengths: preview.strengths,
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? (err as Error).message : "Preview generation failed";
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }

  // ── 5. Full analysis — AI + deterministic rules run in parallel ───────────
  let result;
  let resumeStyleTokens: ResumeStyleTokens = DEFAULT_STYLE_TOKENS;
  try {
    // Run AI analysis + ATS rules + style extraction all in parallel
    const [aiResult, atsRules, styleTokens] = await Promise.all([
      analyzeResume(resumeText, jobDescription, targetRole),
      Promise.resolve(runAtsChecks(resumeText, jobDescription)),
      fileBuffer
        ? extractResumeStyle(fileBuffer, fileMimeType).catch(() => DEFAULT_STYLE_TOKENS)
        : Promise.resolve(DEFAULT_STYLE_TOKENS),
    ]);
    result = { ...aiResult, ats_rules: atsRules };
    resumeStyleTokens = styleTokens;
  } catch (err: unknown) {
    const message = err instanceof Error ? (err as Error).message : "Analysis failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }

  // ── 6. Persist analysis + increment usage ─────────────────
  // Use admin client (service role) for the insert — the route-handler
  // client uses anon+session which hits RLS (no INSERT policy for users).
  const adminClient = createAdminClient();
  const [insertResult] = await Promise.all([
    adminClient
      .from("analyses")
      .insert({
        user_id: userId,
        score: result.score,
        result_json: JSON.stringify(result),
        target_role: targetRole || null,
        resume_text: resumeText,
        job_description: jobDescription || null,
      })
      .select("id"),
    incrementUsage(userId),
  ]);

  if (insertResult.error) {
    logger.error("[analyze] DB insert failed:", insertResult.error.message);
  }

  // ── 7. Safe Background Task: embed resume chunks into pgvector ─
  // Uses Next.js after() to guarantee background execution finishes
  // without being terminated prematurely by the serverless runtime.
  const insertedId = insertResult.data?.[0]?.id;
  if (!insertResult.error && insertedId) {
    if (typeof after === "function") {
      after(async () => {
        await generateAndStoreEmbeddings({
          userId,
          resumeText,
          analysisId: insertedId,
        });
      });
    } else {
      generateAndStoreEmbeddings({
        userId,
        resumeText,
        analysisId: insertedId,
      }).catch((err) => {
        logger.warn("[analyze] Background embed failed (non-fatal):", err?.message);
      });
    }
  }

  return NextResponse.json({
    success: true,
    data: result,
    extractedText: resumeText,
    resumeStyleTokens,
  });
}
