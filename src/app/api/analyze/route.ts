import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { analyzeResume, extractTextFromBuffer } from "@/lib/ai";
import { getUserProfile, canAnalyze, incrementUsage } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase";
import { AnalyzeResponse } from "@/types";

export const maxDuration = 60; // Allow up to 60s for AI response

export async function POST(req: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
  // ── 1. Auth check ────────────────────────────────────────
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  // ── 2. Load user profile & check quota ───────────────────
  const profile = await getUserProfile(userId);
  if (!profile) {
    return NextResponse.json(
      { success: false, error: "Profile not found" },
      { status: 400 }
    );
  }

  // ── 3. Parse request (multipart or JSON) ─────────────────
  let resumeText = "";
  let jobDescription: string | undefined;
  let targetRole: string | undefined;

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    // File upload path
    const form = await req.formData();
    const file = form.get("file") as File | null;
    jobDescription = (form.get("jobDescription") as string) || undefined;
    targetRole = (form.get("targetRole") as string) || undefined;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File too large (max 10MB)" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
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

  if (!resumeText || resumeText.trim().length < 100) {
    return NextResponse.json(
      { success: false, error: "Resume text is too short or empty." },
      { status: 400 }
    );
  }

  // ── 4. Free tier — return preview only ───────────────────
  if (!canAnalyze(profile)) {
    // Run a lightweight preview (score + summary only)
    const full = await analyzeResume(resumeText, jobDescription, targetRole);
    return NextResponse.json({
      success: true,
      requiresUpgrade: true,
      preview: {
        score: full.score,
        summary: full.summary,
        strengths: full.strengths.slice(0, 2),
      },
    });
  }

  // ── 5. Full analysis ──────────────────────────────────────
  let result;
  try {
    result = await analyzeResume(resumeText, jobDescription, targetRole);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }

  // ── 6. Persist analysis + increment usage ─────────────────
  const admin = createAdminClient();
  await Promise.all([
    admin.from("analyses").insert({
      user_id: userId,
      score: result.score,
      result_json: JSON.stringify(result),
      target_role: targetRole || null,
    }),
    incrementUsage(userId),
  ]);

  return NextResponse.json({ success: true, data: result });
}
