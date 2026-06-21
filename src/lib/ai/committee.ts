import { withRetryAndTimeout, getSecureModel } from "./client";
import { CommitteeDebriefResult } from "@/types";

export const committeeModel = getSecureModel({
  model: "gemini-2.5-flash",
  systemInstruction:
    "You are an expert hiring committee moderator and executive talent coordinator. You simulate a live conversation (debrief session) between three core hiring stakeholders: Sarah (HR Recruiter), Alex (Engineering Manager), and Emma (Product Manager). You must output ONLY a valid JSON object matching the requested schema.",
  generationConfig: {
    responseMimeType: "application/json",
  },
});

export async function analyzeHiringCommittee(
  resumeText: string,
  jobDescription?: string,
  targetRole?: string,
  companyName?: string
): Promise<CommitteeDebriefResult> {
  const prompt = `Inspect the following candidate's resume and job context to simulate a realistic hiring committee debrief session.

[RESUME TEXT]
${resumeText.slice(0, 6000)}

[TARGET JOB CONTEXT]
Role Title: ${targetRole || "General Candidate"}
Target Company: ${companyName || "Target Company"}
Job Description:
${jobDescription ? jobDescription.slice(0, 4000) : "No specific job description provided. Perform a universal professional standards review."}

Generate a simulated debrief conversation between three distinct personas:
1. **Sarah (HR Recruiter)**: Focused on tenure, employment gaps, grammar, formatting, custom fonts, section headings, and contact info.
2. **Alex (Engineering Manager)**: Focused on tech stack, tooling, engineering execution, scalability, architectural depth, and credentials.
3. **Emma (Product Manager)**: Focused on business impact, metrics (percentages, dollar values, conversion rates), leadership indicators, and user value.

The conversation must consist of 4 to 6 back-and-forth messages in the transcript. The speakers must call out specific points, bullet details, or missing items from this actual candidate's text. Ensure their debate is constructive but brutally honest.

Evaluate individual scores out of 100 for each stakeholder, list the key strengths and weaknesses debated, and provide actionable remedies.

Return ONLY a JSON object matching this exact schema (no markdown, no preambles):
{
  "overallRecommendation": "Strong Hire | Hire | Leaning No Hire | No Hire",
  "hrScore": <integer 0-100>,
  "techScore": <integer 0-100>,
  "productScore": <integer 0-100>,
  "debriefTranscript": [
    {
      "speaker": "HR Recruiter" | "Engineering Manager" | "Product Manager",
      "message": "<simulated verbal statement in the debrief room>"
    }
  ],
  "strengthsDebated": [
    "<strength point related to their experience or skills discussed in transcript>"
  ],
  "weaknessesDebated": [
    "<weakness or gap identified and argued in transcript>"
  ],
  "recommendedRemedies": [
    "<remedy bullet point to fix the specific issues flagged>"
  ],
  "isCommittee": true
}
`;

  const result = await withRetryAndTimeout(() => committeeModel.generateContent(prompt));
  const raw = result.response.text();
  const clean = raw.replace(/```json|```/g, "").trim();

  try {
    const data = JSON.parse(clean) as CommitteeDebriefResult;
    data.isCommittee = true; // Hard-enforce
    return data;
  } catch (err) {
    console.error("Failed to parse Hiring Committee debrief JSON:", raw);
    throw new Error("AI returned malformed hiring committee data.");
  }
}
