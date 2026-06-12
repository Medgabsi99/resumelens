import { validateAndSanitizeInput } from "@/lib/validation";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase";
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
    let {
      resumeText,
      roleTitle,
      companyName,
      scenario,
      initialOffer,
      currentOffer,
      messageHistory,
      userResponse,
    } = body;

    try {
      resumeText = validateAndSanitizeInput(resumeText, 15000, "Resume text", true);
      roleTitle = validateAndSanitizeInput(roleTitle, 200, "Role title", true);
      companyName = validateAndSanitizeInput(companyName, 200, "Company name", true);
      scenario = validateAndSanitizeInput(scenario, 4000, "Scenario", true);
      userResponse = validateAndSanitizeInput(userResponse, 4000, "User response", true);

      const validateOffer = (offer: any, name: string) => {
        if (!offer || typeof offer !== "object") {
          throw new Error(`${name} must be an object.`);
        }
        if (typeof offer.base !== "number" || typeof offer.bonus !== "number" || typeof offer.equity !== "number" || typeof offer.signOn !== "number") {
          throw new Error(`${name} base, bonus, equity, and signOn must be numbers.`);
        }
        if (offer.other !== undefined && offer.other !== null) {
          offer.other = validateAndSanitizeInput(offer.other, 1000, `${name} other field`);
        }
      };

      validateOffer(initialOffer, "Initial offer");
      validateOffer(currentOffer, "Current offer");

      if (messageHistory && !Array.isArray(messageHistory)) {
        throw new Error("Message history must be an array.");
      }
      if (messageHistory) {
        for (let i = 0; i < messageHistory.length; i++) {
          const m = messageHistory[i];
          if (!m || typeof m !== "object") {
            throw new Error(`Message history entry at index ${i} is invalid.`);
          }
          if (m.role !== "user" && m.role !== "recruiter") {
            throw new Error(`Message history entry role at index ${i} must be 'user' or 'recruiter'.`);
          }
          m.content = validateAndSanitizeInput(m.content, 4000, `Message history content at index ${i}`, true);
        }
      }
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 });
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
    logger.error("Salary negotiation API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to negotiate" },
      { status: 500 }
    );
  }
}
