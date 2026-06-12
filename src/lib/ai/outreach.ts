import { withRetryAndTimeout, outreachModel } from "./client";

export async function generateOutreachMessage(
  resumeText: string,
  jobDescription: string,
  jobTitle: string,
  companyName: string,
  recruiterName?: string,
  outreachType?: "recruiter" | "peer"
): Promise<string> {
  const namePart = recruiterName ? `addressed to ${recruiterName}` : "without a specific name (use a professional greeting like 'Hi there' or 'Hello')";
  const typeExplanation = outreachType === "peer"
    ? "casual, peer-to-peer, focusing on technical alignment, engineering projects, and coding topics. Collaborative and friendly tone."
    : "professional, direct, focusing on role requirements, qualifications alignment, and expressing interest in an active application. Clear and recruiter-friendly tone.";

  const prompt = `Draft a personalized cold outreach message for this job listing.
Job Title: ${jobTitle}
Company: ${companyName}
Target Recipient: ${typeExplanation}
Greeting style: ${namePart}

[RESUME START]
${resumeText.slice(0, 6000)}
[RESUME END]

[JOB DESCRIPTION START]
${jobDescription.slice(0, 3000)}
[JOB DESCRIPTION END]

Rules for the message:
1. Max length: 100-140 words (it must fit comfortably within a LinkedIn connection request note or a short email).
2. Avoid generic corporate jargon. Hook the reader immediately.
3. Reference EXACTLY 1 specific, relevant project, technology, or accomplishment from the resume that matches the job requirements.
4. Keep it direct: state the role you are interested in and ask for a quick chat.
5. Do NOT include placeholder fields like "[Date]" or "[Skills]" in the body — write a complete, ready-to-send message. Use placeholder "[Your Name]" only at the sign-off.
6. Return ONLY the message body, no markdown fences, no email subject lines, and no preambles.`;

  const result = await withRetryAndTimeout(() => outreachModel.generateContent(prompt));
  return result.response.text().trim();
}
