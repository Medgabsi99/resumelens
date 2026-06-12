import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { chatWithResume } from "@/lib/ai";
import { getUserProfile, canAnalyze } from "@/lib/auth";

export const maxDuration = 60; // Allow up to 60s for AI response

export async function POST(req: NextRequest) {
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

  // ── 2. Load user profile & check quota ───────────────────
  const profile = await getUserProfile(session.user.id);
  if (!profile || !canAnalyze(profile)) {
    return NextResponse.json(
      { success: false, error: "Upgrade required to use chat" },
      { status: 403 }
    );
  }

  // ── 3. Parse request ──────────────────────────────────────
  const body = await req.json();
  const { message, resumeText, jobDescription, targetRole } = body;

  if (!message || !resumeText) {
    return NextResponse.json(
      { success: false, error: "Message and resume text are required" },
      { status: 400 }
    );
  }

  // ── 4. Chat with AI ───────────────────────────────────────
  try {
    const reply = await chatWithResume(message, resumeText, jobDescription, targetRole);
    return NextResponse.json({ success: true, data: reply });
  } catch (err: unknown) {
    logger.error("Chat API error:", err);
    const errorMsg = err instanceof Error ? err.message : "Chat failed";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
