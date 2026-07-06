import { logger } from "@/lib/logger";
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
  transcript?: { role: "user" | "recruiter"; content: string }[];
}

export interface RecruiterProfile {
  name: string;
  avatar: string;
  personality: "Stubborn" | "Friendly" | "Highly Analytical" | "Tough";
  description: string;
  hiddenCeilingBudget: number;
  concessionLimit: number;
  flexibility: number;
}

export async function generateNegotiationResponse(
  resumeText: string,
  roleTitle: string,
  companyName: string,
  scenario: string,
  initialOffer: NegotiationOffer,
  currentOffer: NegotiationOffer,
  messageHistory: { role: "user" | "recruiter"; content: string }[],
  userResponse: string,
  recruiterProfile: RecruiterProfile
): Promise<NegotiationTurnResponse> {
  const historyText = messageHistory
    .map((m) => `${m.role === "user" ? "Candidate" : "Recruiter"}: ${m.content}`)
    .join("\n");

  const prompt = `You are playing the role of ${recruiterProfile.name}, the Hiring Manager / Recruiter at ${companyName}.
Recruiter Profile:
- Personality: ${recruiterProfile.personality} (Characteristics: ${recruiterProfile.description})
- Hidden Base Salary Ceiling Budget: $${recruiterProfile.hiddenCeilingBudget.toLocaleString()} (NEVER exceed this base salary under any circumstances. If the candidate requests more than this, firmly state that you cannot go higher than this base salary ceiling or offer alternative perks like sign-on or equity if appropriate, depending on your personality. If they refuse to budge, you must hold the line or even withdraw/conclude the negotiation.)
- Flexibility: ${recruiterProfile.flexibility * 100}%
- Concession Limit: Max base salary increase of $${recruiterProfile.concessionLimit.toLocaleString()} per turn.

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
1. Formulate the Recruiter's in-character response to the candidate. Keep it concise (2-3 sentences), realistic, and professional, strictly matching the personality trait of "${recruiterProfile.personality}".
   - If the candidate accepts the offer, finalize the negotiation.
   - If the candidate asks for base salary numbers exceeding the Hidden Base Salary Ceiling Budget ($${recruiterProfile.hiddenCeilingBudget}), the recruiter must warn the candidate that they are at/exceeding corporate limits, and decline further base increases.
   - Concessions should be hard-won, depending on recruiter personality.
   - If the candidate references specific projects/skills from their resume that justify a higher salary, make a concession within your concession limit ($${recruiterProfile.concessionLimit}), provided the base salary does not exceed the ceiling ($${recruiterProfile.hiddenCeilingBudget}).
2. Evaluate the user's latest message:
   - Provide a brief coach tip (constructive feedback) on how they handled the communication.
   - Update the current offer based on this turn. Concessions must never breach the Hidden Base Salary Ceiling Budget ($${recruiterProfile.hiddenCeilingBudget}). Base salary increases should be incremental (max $${recruiterProfile.concessionLimit} per turn).
   - Set sentiment ("open", "impressed", "resistant", "offended").
   - Adjust leverage (0-100%).
3. Determine if the negotiation is concluded:
   - "accepted": if the user explicitly agrees to the offer.
   - "rejected" / "walk_away": if the user walks away, or if recruiter sentiment drops to offended repeatedly and they decide to rescind/walk away (especially Stubborn or Tough recruiters when pushed too hard past the ceiling).
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
    logger.error("Failed to parse negotiation response:", raw);
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
  verdict: string,
  recruiterProfile: RecruiterProfile
): Promise<NegotiationScorecard> {
  const historyText = messageHistory
    .map((m) => `${m.role === "user" ? "Candidate" : "Recruiter"}: ${m.content}`)
    .join("\n");

  const initialTotal = initialOffer.base + initialOffer.bonus + initialOffer.equity + initialOffer.signOn;
  const finalTotal = finalOffer.base + finalOffer.bonus + finalOffer.equity + finalOffer.signOn;
  const financialGain = Math.max(0, finalTotal - initialTotal);

  const prompt = `Analyze this salary negotiation transcript for the role of "${roleTitle}" at ${companyName}.
The negotiation was conducted with recruiter ${recruiterProfile.name} (Personality: ${recruiterProfile.personality}).
- Hidden Base Salary Ceiling Budget: $${recruiterProfile.hiddenCeilingBudget.toLocaleString()}

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
   - If the candidate accepted the offer, analyze if they "left money on the table". Compare their final base salary $${finalOffer.base} with the Recruiter's hidden base ceiling budget of $${recruiterProfile.hiddenCeilingBudget}. If the final base is $10k+ below the ceiling budget, explicitly coach the candidate on how they could have negotiated closer to the budget limit of $${recruiterProfile.hiddenCeilingBudget.toLocaleString()} without risking the offer, or what they did right if they maxed it out.

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
    logger.error("Failed to parse negotiation evaluation:", raw);
    throw new Error("AI returned malformed negotiation evaluation scorecard.");
  }
}
