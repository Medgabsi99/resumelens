import { requireUser } from "@/lib/auth";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // ── 1. Auth check ────────────────────────────────────────
    const _user = await requireUser();

    // ── 2. Parse request ──────────────────────────────────────
    const body = await req.json();
    const {
      roleTitle,
      companyName,
      missingSkills,
      projectDetails,
      learningPath, // weekly milestones
    } = body;

    if (!roleTitle || !companyName || !missingSkills || !projectDetails || !learningPath) {
      return NextResponse.json(
        { success: false, error: "Missing required details to save learning path" },
        { status: 400 }
      );
    }

    // ── 3. Resiliently attempt to save to database ────────────
    let savedInDb = false;
    let dbError = null;
    let savedItem = null;

    try {
      const { data, error } = await supabase
        .from("learning_paths")
        .insert({
          user_id: _user.id,
          role_title: roleTitle,
          company_name: companyName,
          missing_skills: missingSkills,
          project_details: projectDetails,
          learning_path: learningPath,
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
      data: savedItem,
    });
  } catch (error: unknown) {
    logger.error("Learning path save API error:", error);
    return NextResponse.json(
      { success: false, error: (error instanceof Error ? error.message : String(error)) || "Failed to save learning path" },
      { status: 500 }
    );
  }
}
