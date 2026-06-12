import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { evaluateInterviewAnswer } from "@/lib/ai";
import { getUserProfile, canAnalyze } from "@/lib/auth";

export const maxDuration = 60; // Allow up to 60s for AI response

export async function POST(req: NextRequest) {
  try {
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

    // ── 2. Parse request ──────────────────────────────────────
    const body = await req.json();
    const { resumeText, question, answer, jobDescription } = body;

    if (!resumeText) {
      return NextResponse.json(
        { success: false, error: "Resume text required" },
        { status: 400 }
      );
    }

    if (!question || !answer) {
      return NextResponse.json(
        { success: false, error: "Question and answer text are required" },
        { status: 400 }
      );
    }

    // ── 3. Call AI to evaluate answer ─────────────────────────
    const evaluation = await evaluateInterviewAnswer(
      resumeText,
      question,
      answer,
      jobDescription || undefined
    );

    return NextResponse.json({ success: true, evaluation });
  } catch (error: unknown) {
    console.error("Answer evaluation API error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to evaluate answer";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
