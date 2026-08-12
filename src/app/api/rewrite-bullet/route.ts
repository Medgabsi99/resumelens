import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { NextRequest } from "next/server";
import { requireUserWithQuota, incrementUsage } from "@/lib/auth";
import { getSecureModel } from "@/lib/ai/client";
import { createSSEResponse } from "@/lib/sse";

export const maxDuration = 30;

const bulletRewriteModel = getSecureModel({
  model: "gemini-2.5-flash",
  systemInstruction:
    "You are an expert resume writer. Generate powerful, quantified bullet point rewrites. Follow the exact output format requested. Never deviate from the format.",
});

export async function POST(req: NextRequest) {
  // Auth & Quota guard
  let _user;
  try {
    const session = await requireUserWithQuota();
    _user = session.user;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "QuotaExceeded") {
      return new Response(JSON.stringify({ error: "Upgrade required to run bullet rewrites" }), {
        status: 403,
      });
    }
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const rateLimit = await checkRateLimit(_user.id, "rewrite-bullet");
  if (!rateLimit.success) {
    return rateLimitResponse();
  }

  const { bullet, resumeContext, targetRole } = await req.json();

  if (!bullet || typeof bullet !== "string" || bullet.trim().length < 5) {
    return new Response(JSON.stringify({ error: "Invalid bullet text" }), { status: 400 });
  }

  // Increment usage counter
  await incrementUsage(_user.id);

  const contextSnippet = resumeContext
    ? `\n\nResume context (first 800 chars):\n${String(resumeContext).slice(0, 800)}`
    : "";

  const roleHint = targetRole ? ` targeting a ${targetRole} role` : "";

  const prompt = `You are an expert resume writer${roleHint}. A candidate has this weakness identified in their resume bullet point:

WEAK BULLET: "${bullet.trim()}"
${contextSnippet}

Generate exactly 3 powerful rewrites of this bullet point. Each rewrite should:
- Start with a strong, specific action verb
- Include quantified metrics wherever plausible (%, $, x faster, # of team members, etc.)
- Demonstrate clear business impact or outcome
- Be concise (one sentence, ≤20 words)
- Feel authentic and professional, NOT generic

Format your response EXACTLY like this (no extra text before or after):

REWRITE 1:
[rewrite here]

REWRITE 2:
[rewrite here]

REWRITE 3:
[rewrite here]`;

  return createSSEResponse(async (send) => {
    const result = await bulletRewriteModel.generateContentStream(prompt);
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        send(text);
      }
    }
  });
}
