import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { NextRequest, NextResponse } from "next/server";
import { requireUserWithQuota, incrementUsage } from "@/lib/auth";
import { getSecureModel } from "@/lib/ai/client";

export const maxDuration = 60;

const recruiterModel = getSecureModel({
  model: "gemini-2.5-flash",
  systemInstruction: `You are an experienced senior recruiter and hiring manager with 15+ years of experience across tech, finance, and consulting. You review hundreds of resumes per week. You think critically, practically, and honestly. Your job is to simulate exactly what goes through a recruiter's mind in the first 30 seconds of reading a resume — the instinctive reactions, red flags, green flags, and gut-feel callback probability.

Always respond with valid JSON only. No markdown, no code fences, no extra text.`,
});

export async function POST(req: NextRequest) {
  // ── 1. Auth & Quota ───────────────────────────────────────
  let _user;
  try {
    const session = await requireUserWithQuota();
    _user = session.user;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "QuotaExceeded") {
      return NextResponse.json(
        { success: false, error: "Upgrade required to use Recruiter Sandbox" },
        { status: 403 }
      );
    }
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(_user.id, "recruiter-review");
  if (!rateLimit.success) return rateLimitResponse();

  // ── 2. Parse request ──────────────────────────────────────
  const body = await req.json();
  const { resumeText, jobDescription, targetRole } = body;

  if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length < 50) {
    return NextResponse.json(
      { success: false, error: "Resume text is too short or missing." },
      { status: 400 }
    );
  }

  // ── 3. Build prompt ───────────────────────────────────────
  const roleContext = targetRole ? `The candidate is targeting: ${targetRole}.` : "";
  const jdContext = jobDescription
    ? `\n\nJOB DESCRIPTION (what they applied to):\n${jobDescription.slice(0, 3000)}`
    : "";

  const prompt = `You are reviewing this resume as a senior recruiter making a real hiring decision. ${roleContext}

RESUME:
${resumeText.slice(0, 6000)}
${jdContext}

Analyze this resume exactly as a recruiter would. Be honest, direct, and practical. Return ONLY a JSON object with these exact fields:

{
  "callbackScore": <integer 0-100, probability this resume gets a callback>,
  "callbackVerdict": <one of: "Very Likely" | "Likely" | "Maybe" | "Unlikely" | "Very Unlikely">,
  "firstImpression": <string, 2-3 sentences — the gut reaction in the first 6 seconds of scanning>,
  "recruiterThought": <string, 1 sentence — the single most important thought that goes through the recruiter's mind>,
  "redFlags": [
    { "issue": <string>, "severity": <"high" | "medium" | "low">, "detail": <string, one sentence explanation> }
  ],
  "greenFlags": [
    { "strength": <string>, "detail": <string, one sentence explanation> }
  ],
  "interviewQuestions": [
    <string — a real question a recruiter/interviewer would ask>
  ],
  "quickWins": [
    { "action": <string, short imperative>, "impact": <string, why this helps>, "effort": <"easy" | "medium" | "hard"> }
  ],
  "hiringDecision": <"Pass to interview" | "Maybe — needs review" | "Reject — not qualified" | "Strong hire">,
  "standoutFactor": <string or null, the ONE thing that makes this resume memorable, or null if nothing stands out>
}

Rules:
- redFlags: 2–5 items
- greenFlags: 2–5 items  
- interviewQuestions: exactly 5 items
- quickWins: 3–5 items
- Be honest — if the resume is weak, say so. If strong, say so.`;

  // ── 4. Generate ───────────────────────────────────────────
  try {
    await incrementUsage(_user.id);

    const result = await recruiterModel.generateContent(prompt);
    const raw = result.response.text().trim();

    // Strip markdown code fences if present
    const jsonStr = raw
      .replace(/^```(?:json)?\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json(
        { success: false, error: "AI returned invalid JSON. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: parsed });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Recruiter review failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
