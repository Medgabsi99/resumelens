import { withRetryAndTimeout, coverLetterModel } from "./client";

export async function generateCoverLetter(
  resumeText: string,
  jobDescription?: string,
  targetRole?: string,
): Promise<string> {
  let prompt = `Write a professional, compelling, and modern cover letter based on the following resume.
Keep it to 3 or 4 concise paragraphs. Make it impactful and engaging, avoiding overly robotic language.
Do NOT include placeholder addresses like "[Your Address]" or "[Company Address]" — just write the body of the letter and sign off with "[Your Name]".`;

  if (targetRole) prompt += `\n\nThe target role is: ${targetRole}`;
  if (jobDescription) {
    prompt += `\n\nEnsure the cover letter specifically addresses these job requirements and highlights relevant matching experience:\n[JOB DESCRIPTION START]\n${jobDescription.slice(0, 3000)}\n[JOB DESCRIPTION END]`;
  }

  prompt += `\n\n[RESUME START]\n${resumeText.slice(0, 6000)}\n[RESUME END]\n\nReturn ONLY the cover letter text.`;

  const result = await withRetryAndTimeout(() => coverLetterModel.generateContent(prompt));
  return result.response.text().trim();
}

export async function generateCoverLetterStream(
  resumeText: string,
  jobDescription?: string,
  targetRole?: string,
) {
  let prompt = `Write a professional, compelling, and modern cover letter based on the following resume.
Keep it to 3 or 4 concise paragraphs. Make it impactful and engaging, avoiding overly robotic language.
Do NOT include placeholder addresses like "[Your Address]" or "[Company Address]" — just write the body of the letter and sign off with "[Your Name]".`;

  if (targetRole) prompt += `\n\nThe target role is: ${targetRole}`;
  if (jobDescription) {
    prompt += `\n\nEnsure the cover letter specifically addresses these job requirements and highlights relevant matching experience:\n[JOB DESCRIPTION START]\n${jobDescription.slice(0, 3000)}\n[JOB DESCRIPTION END]`;
  }

  prompt += `\n\n[RESUME START]\n${resumeText.slice(0, 6000)}\n[RESUME END]\n\nReturn ONLY the cover letter text.`;

  return withRetryAndTimeout(() => coverLetterModel.generateContentStream(prompt));
}
