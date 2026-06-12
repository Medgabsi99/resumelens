import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { generateNegotiationResponse } from "@/lib/ai";

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
      currentOffer,
      messageHistory,
      userResponse,
    } = body;

    if (!resumeText) {
      return NextResponse.json(
        { success: false, error: "Resume text is required" },
        { status: 400 }
      );
    }

    if (!roleTitle || !companyName || !scenario || !initialOffer || !currentOffer || !userResponse) {
      return NextResponse.json(
        { success: false, error: "Missing required negotiation details" },
        { status: 400 }
      );
    }

    // ── 3. Call AI ───────────────────────────────────────────
    const turn = await generateNegotiationResponse(
      resumeText,
      roleTitle,
      companyName,
      scenario,
      initialOffer,
      currentOffer,
      messageHistory || [],
      userResponse
    );

    return NextResponse.json({ success: true, turn });
  } catch (error: any) {
    console.error("Salary negotiation API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to negotiate" },
      { status: 500 }
    );
  }
}
