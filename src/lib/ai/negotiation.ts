import {
  withRetryAndTimeout,
  negotiationResponseModel,
  negotiationEvaluationModel,
} from "./client";

export interface NegotiationOffer {
  base: number;
  bonus: number;
  equity: number;
  signOn: number;
  other: string;
}

export interface NegotiationTurnResponse {
  recruiterMessage: string;
  sentiment: "open" | "impressed" | "resistant" | "offended";
  leverage: number;
  coachFeedback: string;
  currentOffer: NegotiationOffer;
  isConcluded: boolean;
  conclusionVerdict: "accepted" | "rejected" | "walk_away" | "ongoing";
}

export interface NegotiationScorecard {
  score: number;
  tacticsUsed: string[];
  strengths: string[];
  weaknesses: string[];
  financialGain: number;
  coachesNote: string;
}

export async function generateNegotiationResponse(
  resumeText: string,
  roleTitle: string,
  companyName: string,
  scenario: string,
  initialOffer: NegotiationOffer,
  currentOffer: NegotiationOffer,
  messageHistory: { role: "user" | "recruiter"; content: string }[],
  userResponse: string
): Promise<NegotiationTurnResponse> {
  const historyText = messageHistory
    .map((m) => `${m.role === "user" ? "Candidate" : "Recruiter"}: ${m.content}`)
    .join("\n");

  const prompt = `You are playing the role of the Recruiter/Hiring Manager at ${companyName} negotiating with a candidate for the role of "${roleTitle}".

Negotiation Scenario: ${scenario}
Initial Offer: Base $${initialOffer.base}, Bonus $${initialOffer.bonus}, Equity $${initialOffer.equity}, Sign-on $${initialOffer.signOn}, Other: "${initialOffer.other}"
Current Active Offer: Base $${currentOffer.base}, Bonus $${currentOffer.bonus}, Equity $${currentOffer.equity}, Sign-on $${currentOffer.signOn}, Other: "${currentOffer.other}"

[RESUME START]
${resumeText.slice(0, 5000)}
[RESUME END]

Conversation History so far:
${historyText}

Candidate's Latest Message:
[MESSAGE START]
${userResponse}
[MESSAGE END]

Perform these tasks:
1. Formulate the Recruiter's in-character response to the candidate. Keep it concise (2-3 sentences), realistic, and professional.
   - If the candidate accepts the offer, finalize the negotiation.
   - If the candidate asks for unreasonable numbers (e.g. +50% base salary) without strong justifications or behaves rudely, the recruiter sentiment should drop, and they should negotiate firmly or walk away.
   - If the candidate references specific projects/skills from their resume that justify a higher salary, make a small concession (e.g., increase base by $5k-$10k, or add a $5k sign-on bonus).
2. Evaluate the user's latest message:
   - Provide a brief coach tip (constructive feedback) on how they handled the communication.
   - Update the current offer based on this turn. Concessions should be hard-won. Base salary increases should rarely exceed $15,000 total from initial offer.
   - Set sentiment ("open", "impressed", "resistant", "offended").
   - Adjust leverage (0-100%).
3. Determine if the negotiation is concluded:
   - "accepted": if the user explicitly agrees to the offer.
   - "rejected" / "walk_away": if the user walks away, or if recruiter sentiment drops to offended repeatedly and they decide to rescind the offer.
   - "ongoing": if negotiation continues.
   - Maximum turns limit: if the history has 6 or more turns, the recruiter must present their final best offer and set isConcluded = true on the next candidate refusal.

Return ONLY a JSON object with this exact structure:
{
  "recruiterMessage": "<string: recruiter's reply>",
  "sentiment": "<one of: open | impressed | resistant | offended>",
  "leverage": <integer 0-100>,
  "coachFeedback": "<string: actionable coaching tip>",
  "currentOffer": {
    "base": <integer>,
    "bonus": <integer>,
    "equity": <integer>,
    "signOn": <integer>,
    "other": "<string>"
  },
  "isConcluded": <boolean>,
  "conclusionVerdict": "<one of: accepted | rejected | walk_away | ongoing>"
}
`;

  const result = await withRetryAndTimeout(() => negotiationResponseModel.generateContent(prompt));
  const raw = result.response.text();
  const clean = raw.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean) as NegotiationTurnResponse;
  } catch (err) {
    console.error("Failed to parse negotiation response:", raw);
    throw new Error("AI returned malformed negotiation response.");
  }
}

export async function evaluateNegotiationSession(
  resumeText: string,
  roleTitle: string,
  companyName: string,
  scenario: string,
  initialOffer: NegotiationOffer,
  finalOffer: NegotiationOffer,
  messageHistory: { role: "user" | "recruiter"; content: string }[],
  verdict: string
): Promise<NegotiationScorecard> {
  const historyText = messageHistory
    .map((m) => `${m.role === "user" ? "Candidate" : "Recruiter"}: ${m.content}`)
    .join("\n");

  const initialTotal = initialOffer.base + initialOffer.bonus + initialOffer.equity + initialOffer.signOn;
  const finalTotal = finalOffer.base + finalOffer.bonus + finalOffer.equity + finalOffer.signOn;
  const financialGain = Math.max(0, finalTotal - initialTotal);

  const prompt = `Analyze this salary negotiation transcript for the role of "${roleTitle}" at ${companyName}.

Scenario: ${scenario}
Initial Offer: Base $${initialOffer.base}, Bonus $${initialOffer.bonus}, Equity $${initialOffer.equity}, Sign-on $${initialOffer.signOn}, Other: "${initialOffer.other}"
Final Negotiated Offer: Base $${finalOffer.base}, Bonus $${finalOffer.bonus}, Equity $${finalOffer.equity}, Sign-on $${finalOffer.signOn}, Other: "${finalOffer.other}"
Negotiation Outcome Verdict: ${verdict}
Financial Gain calculated: $${financialGain}

[RESUME START]
${resumeText.slice(0, 5000)}
[RESUME END]

Complete Transcript:
${historyText}

Evaluate the candidate's negotiation performance. Determine:
1. Negotiation Score (1-100) based on politeness, professionalism, value metrics cited, pushback strength, and final offer outcome.
2. Tactics used by the candidate (e.g. "Polite Anchoring", "Resume Value Anchoring", "Competing Offer leverage", "Collaborative Tone", "Silent Pause", "Benefit Package Countering"). Give 2-4 tactics.
3. Specific Strengths in their messages.
4. Specific Weaknesses or missed opportunities.
5. A detailed, encouraging coach's note providing high-value salary advice.

Return ONLY a JSON object with this exact structure:
{
  "score": <integer 1-100>,
  "tacticsUsed": ["<string>", "<string>"],
  "strengths": ["<string>", "<string>"],
  "weaknesses": ["<string>", "<string>"],
  "financialGain": <integer>,
  "coachesNote": "<string: detailed coaching note paragraph>"
}
`;

  const result = await withRetryAndTimeout(() => negotiationEvaluationModel.generateContent(prompt));
  const raw = result.response.text();
  const clean = raw.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean) as NegotiationScorecard;
  } catch (err) {
    console.error("Failed to parse negotiation evaluation:", raw);
    throw new Error("AI returned malformed negotiation evaluation scorecard.");
  }
}
