import { withRetryAndTimeout, chatModel } from "./client";

export async function chatWithResume(
  message: string,
  resumeText: string,
  jobDescription?: string,
  targetRole?: string,
): Promise<string> {
  let context = `[RESUME START]\n${resumeText.slice(0, 6000)}\n[RESUME END]\n\n`;
  if (targetRole) context += `Target Role: ${targetRole}\n\n`;
  if (jobDescription)
    context += `[JOB DESCRIPTION START]\n${jobDescription.slice(0, 3000)}\n[JOB DESCRIPTION END]\n\n`;

  const prompt = `${context}[MESSAGE START]\n${message}\n[MESSAGE END]\n\nProvide a helpful, actionable, and specific response.`;

  const result = await withRetryAndTimeout(() => chatModel.generateContent(prompt));
  return result.response.text().trim();
}

export async function chatWithResumeStream(
  message: string,
  resumeText: string,
  jobDescription?: string,
  targetRole?: string,
) {
  let context = `[RESUME START]\n${resumeText.slice(0, 6000)}\n[RESUME END]\n\n`;
  if (targetRole) context += `Target Role: ${targetRole}\n\n`;
  if (jobDescription)
    context += `[JOB DESCRIPTION START]\n${jobDescription.slice(0, 3000)}\n[JOB DESCRIPTION END]\n\n`;

  const prompt = `${context}[MESSAGE START]\n${message}\n[MESSAGE END]\n\nProvide a helpful, actionable, and specific response.`;

  return withRetryAndTimeout(() => chatModel.generateContentStream(prompt));
}
