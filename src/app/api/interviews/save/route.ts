import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { compileFinalInterviewScorecard } from "@/lib/ai";

export const maxDuration = 60; // Allow up to 60s for AI response

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const _user = await requireUser();
  const supabase = createServerComponentClient({ cookies });

    // 2. Parse request
    const body = await req.json();
    const {
      roleTitle,
      companyName,
      interviewType,
      difficulty,
      questions,
      transcripts,
    } = body;

    if (!roleTitle || !companyName || !interviewType || !difficulty || !questions || !transcripts) {
      return NextResponse.json(
        { success: false, error: "Missing required details to compile scorecard" },
        { status: 400 }
      );
    }

    // 3. Programmatically compute filler words usage
    const textAggregate = transcripts.map((t: Record<string, unknown>) => t.answer).join(" ").toLowerCase();
    const fillerWordsCounts: Record<string, number> = {};
    const fillerWordsList = ["um", "uh", "like", "so", "actually", "basically", "you know"];
    fillerWordsList.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, "g");
      const matches = textAggregate.match(regex);
      fillerWordsCounts[word] = matches ? matches.length : 0;
    });

    // 4. Call AI to compile overall scorecard
    const simpleTranscripts = transcripts.map((t: Record<string, unknown>) => ({
      question: t.question,
      answer: t.answer,
      score: t.score,
    }));
    const scorecard = await compileFinalInterviewScorecard(
      roleTitle,
      companyName,
      simpleTranscripts
    );

    // 5. Resiliently attempt to save to database
    let savedInDb = false;
    let dbError = null;
    let savedItem = null;

    try {
      const { data, error } = await supabase
        .from("mock_interviews")
        .insert({
          user_id: _user.id,
          role_title: roleTitle,
          company_name: companyName,
          interview_type: interviewType,
          difficulty,
          questions,
          transcripts, // Full detailed transcripts (with feedbacks, scores, stars)
          overall_score: scorecard.overallScore,
          star_mastery: scorecard.starMastery,
          filler_words: fillerWordsCounts,
          // We can put the strengths, weaknesses, feedback, etc. in a details or JSON payload, or just save the compiled scorecard
        })
        .select()
        .single();

      if (error) {
        dbError = (error instanceof Error ? error.message : String(error));
        logger.warn("Supabase interview save error (falling back to local storage):", error);
      } else {
        savedInDb = true;
        savedItem = data;
      }
    } catch (err: unknown) {
      dbError = (err instanceof Error ? (err as Error).message : String(err));
      logger.warn("Graceful DB exception caught on save, falling back to local storage:", err);
    }

    return NextResponse.json({
      success: true,
      savedInDb,
      dbError,
      scorecard,
      data: savedItem,
    });
  } catch (error: unknown) {
    logger.error("Scorecard compile & save route error:", error);
    return NextResponse.json(
      { success: false, error: (error instanceof Error ? (error as Error).message : String(error)) || "Failed to compile scorecard" },
      { status: 500 }
    );
  }
}
