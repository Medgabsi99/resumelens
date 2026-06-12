import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { evaluateNegotiationSession } from "@/lib/ai";

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
    const {
      resumeText,
      roleTitle,
      companyName,
      scenario,
      initialOffer,
      finalOffer,
      messageHistory,
      verdict,
    } = body;

    if (!resumeText) {
      return NextResponse.json(
        { success: false, error: "Resume text is required" },
        { status: 400 }
      );
    }

    if (!roleTitle || !companyName || !scenario || !initialOffer || !finalOffer || !messageHistory || !verdict) {
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
      verdict
    );

    // ── 4. Resiliently attempt to save to database ────────────
    let savedInDb = false;
    let dbError = null;
    let savedItem = null;

    try {
      const { data, error } = await supabase
        .from("salary_negotiations")
        .insert({
          user_id: session.user.id,
          role_title: roleTitle,
          company_name: companyName,
          scenario,
          initial_offer: initialOffer,
          final_offer: finalOffer,
          score: scorecard.score,
          verdict,
          feedback: scorecard,
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
      dbError = (err instanceof Error ? err.message : String(err));
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
      { success: false, error: (error instanceof Error ? error.message : String(error)) || "Failed to evaluate scorecard" },
      { status: 500 }
    );
  }
}
