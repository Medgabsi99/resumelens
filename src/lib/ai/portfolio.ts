import { withRetryAndTimeout, portfolioModel } from "./client";

export interface PortfolioData {
  fullName: string;
  headline: string;
  subheading: string;
  aboutMe: string;
  email: string;
  githubUrl?: string;
  linkedinUrl?: string;
  skills: { category: string; items: string[] }[];
  experience: { role: string; company: string; dates: string; description: string }[];
  projects: { title: string; description: string; tags: string[]; githubUrl?: string; liveUrl?: string }[];
}

export async function generatePortfolio(resumeText: string): Promise<PortfolioData> {
  const prompt = `Based on the following resume text, generate a premium personal portfolio website content structure.
Enhance and rephrase the copy to be engaging, professional, and optimized for an online portfolio. Create compelling descriptions, list categorized skills, and format the experience and projects.

[RESUME START]
${resumeText.slice(0, 6000)}
[RESUME END]

Return ONLY a JSON object matching this exact structure (no preamble, no markdown fences):
{
  "fullName": "<candidate's full name>",
  "headline": "<compelling headline, e.g., 'Building Scalable Full Stack Applications' or 'Designing Next-Gen User Experiences'>",
  "subheading": "<1-sentence subheading expanding on their expertise>",
  "aboutMe": "<creative, friendly professional bio in first-person (e.g. 'I am a software engineer passionate about...') that connects with the visitor>",
  "email": "<email if found in resume, otherwise placeholder>",
  "githubUrl": "<GitHub link if found in resume, otherwise placeholder or empty string>",
  "linkedinUrl": "<LinkedIn link if found in resume, otherwise placeholder or empty string>",
  "skills": [
    {
      "category": "<e.g., Frontend, Backend, DevOps, Tools, Soft Skills>",
      "items": ["<skill>", "<skill>"]
    }
  ],
  "experience": [
    {
      "role": "<job title>",
      "company": "<company name>",
      "dates": "<dates>",
      "description": "<1-2 sentence high-level summary of responsibilities and achievements in this role>"
    }
  ],
  "projects": [
    {
      "title": "<project name>",
      "description": "<compelling 1-2 sentence description of what the project does and its business/technical impact>",
      "tags": ["<tech tag>", "<tech tag>"],
      "githubUrl": "<mock or parsed github link>",
      "liveUrl": "<mock or parsed demo link>"
    }
  ]
}
`;

  const result = await withRetryAndTimeout(() => portfolioModel.generateContent(prompt));
  const raw = result.response.text();
  const clean = raw.replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(clean) as PortfolioData;
    
    // Fallback checks
    if (!parsed.fullName) parsed.fullName = "Professional Candidate";
    if (!parsed.skills) parsed.skills = [];
    if (!parsed.experience) parsed.experience = [];
    if (!parsed.projects) parsed.projects = [];
    
    return parsed;
  } catch (err) {
    throw new Error("AI returned malformed JSON for portfolio generation. Please try again.");
  }
}
