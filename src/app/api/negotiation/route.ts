import { requireUser } from "@/lib/auth";
import { validateAndSanitizeInput } from "@/lib/validation";
import logger from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { generateNegotiationResponse } from "@/lib/ai";

export const maxDuration = 60; // Allow up to 60s for AI response

export async function POST(req: NextRequest) {
  try {
    // ── 1. Auth check ────────────────────────────────────────
    await requireUser();

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
      recruiterProfile,
    } = body;

    try {
      resumeText = validateAndSanitizeInput(resumeText, 15000, "Resume text", true);
      roleTitle = validateAndSanitizeInput(roleTitle, 200, "Role title", true);
      companyName = validateAndSanitizeInput(companyName, 200, "Company name", true);
      scenario = validateAndSanitizeInput(scenario, 4000, "Scenario", true);
      userResponse = validateAndSanitizeInput(userResponse, 4000, "User response", true);

      const validateOffer = (offer: Record<string, unknown>, name: string) => {
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

      if (!recruiterProfile || typeof recruiterProfile !== "object") {
        throw new Error("Recruiter profile is required and must be an object.");
      }
      if (
        typeof recruiterProfile.name !== "string" ||
        typeof recruiterProfile.avatar !== "string" ||
        !["Stubborn", "Friendly", "Highly Analytical", "Tough"].includes(recruiterProfile.personality) ||
        typeof recruiterProfile.description !== "string" ||
        typeof recruiterProfile.hiddenCeilingBudget !== "number" ||
        typeof recruiterProfile.concessionLimit !== "number" ||
        typeof recruiterProfile.flexibility !== "number"
      ) {
        throw new Error("Recruiter profile contains invalid or missing properties.");
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? (err as Error).message : String(err);
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
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
      userResponse,
      recruiterProfile
    );

    return NextResponse.json({ success: true, turn });
  } catch (error: unknown) {
    logger.error("Salary negotiation API error:", error);
    return NextResponse.json(
      { success: false, error: (error instanceof Error ? (error as Error).message : String(error)) || "Failed to negotiate" },
      { status: 500 }
    );
  }
}
