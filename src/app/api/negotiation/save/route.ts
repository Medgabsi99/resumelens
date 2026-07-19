import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { createServerComponentClient } from "@/lib/supabase-server";
import { requireUser } from "@/lib/auth";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { evaluateNegotiationSession } from "@/lib/ai";

export const maxDuration = 60; // Allow up to 60s for AI response

export async function POST(req: NextRequest) {
  try {
    // ── 1. Auth check ────────────────────────────────────────
    const _user = await requireUser();
  const rateLimit = await checkRateLimit(_user.id, "negotiation-save");
  if (!rateLimit.success) {
    return rateLimitResponse();
  }
  const supabase = await createServerComponentClient();

    // ── 2. Parse request ──────────────────────────────────────
    const body = await req.json();
    const {
      resumeText,
      roleTitle,
      companyName,
      scenario,
      initialOffer,
      finalOffer,
      messageHistory,
      verdict,
      recruiterProfile,
    } = body;

    if (!resumeText) {
      return NextResponse.json(
        { success: false, error: "Resume text is required" },
        { status: 400 }
      );
    }

    if (!roleTitle || !companyName || !scenario || !initialOffer || !finalOffer || !messageHistory || !verdict || !recruiterProfile) {
      return NextResponse.json(
        { success: false, error: "Missing required details to compile scorecard" },
        { status: 400 }
      );
    }

    // ── 3. Call AI to evaluate session and generate scorecard ──
    const scorecard = await evaluateNegotiationSession(
      resumeText,
      roleTitle,
      companyName,
      scenario,
      initialOffer,
      finalOffer,
      messageHistory,
      verdict,
      recruiterProfile
    );

    // ── 4. Resiliently attempt to save to database ────────────
    let savedInDb = false;
    let dbError = null;
    let savedItem = null;

    try {
      const { data, error } = await supabase
        .from("salary_negotiations")
        .insert({
          user_id: _user.id,
          role_title: roleTitle,
          company_name: companyName,
          scenario,
          initial_offer: initialOffer,
          final_offer: finalOffer,
          score: scorecard.score,
          verdict,
          feedback: {
            ...scorecard,
            transcript: messageHistory,
          },
        })
        .select()
        .single();

      if (error) {
        dbError = (error instanceof Error ? error.message : String(error));
        logger.warn("Supabase save error (falling back to frontend storage):", error);
      } else {
        savedInDb = true;
        savedItem = data;
      }
    } catch (err: unknown) {
      dbError = (err instanceof Error ? (err as Error).message : String(err));
      logger.warn("Graceful DB exception caught, falling back to local storage:", err);
    }

    return NextResponse.json({
      success: true,
      savedInDb,
      dbError,
      scorecard,
      data: savedItem,
    });
  } catch (error: unknown) {
    logger.error("Scorecard save API error:", error);
    return NextResponse.json(
      { success: false, error: (error instanceof Error ? (error as Error).message : String(error)) || "Failed to evaluate scorecard" },
      { status: 500 }
    );
  }
}
