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
  const prompt = `You are an expert personal branding strategist. Based on the resume below, generate a premium, conversion-optimized portfolio website content structure.

IMPORTANT INSTRUCTIONS:
- Write the "headline" as a SHORT, punchy action phrase (max 8 words) that immediately tells what the candidate BUILDS or DOES. Examples: "Building AI-Powered Developer Tools", "Designing World-Class Mobile Experiences", "Engineering Scalable Cloud Architectures".
- Write the "aboutMe" as a 3–4 sentence first-person bio that is warm, confident, and specific. Mention real technologies, industries, or impact metrics from the resume.
- For "skills", create 3–5 meaningful categories (e.g., Frontend, Backend, DevOps, Data & ML, Cloud, Design Tools, Soft Skills). Each category should have 4–8 specific skill items.
- For "experience", include every role found in the resume. Write the "description" as 2 crisp, impactful sentences focusing on what they built, led, or delivered — not generic responsibilities.
- For "projects", include every project found. If fewer than 2 projects are listed, infer 1–2 plausible side projects based on their tech stack. Descriptions should highlight the problem solved and the technical approach.
- Make all copy professional, energetic, and specific — avoid vague filler words like "various", "leveraged", "utilized".

[RESUME START]
${resumeText.slice(0, 7000)}
[RESUME END]

Return ONLY a valid JSON object with this exact structure (no preamble, no markdown fences, no trailing commas):
{
  "fullName": "<candidate's full name>",
  "headline": "<punchy action phrase, max 8 words>",
  "subheading": "<1 sentence expanding on specialization and value proposition>",
  "aboutMe": "<3-4 sentence first-person bio, warm and specific>",
  "email": "<email from resume, or 'hello@example.com'>",
  "githubUrl": "<GitHub URL from resume, or empty string>",
  "linkedinUrl": "<LinkedIn URL from resume, or empty string>",
  "skills": [
    { "category": "<category name>", "items": ["<skill>", "<skill>", "<skill>", "<skill>"] }
  ],
  "experience": [
    { "role": "<job title>", "company": "<company name>", "dates": "<start – end>", "description": "<2 impactful sentences>" }
  ],
  "projects": [
    { "title": "<project name>", "description": "<2 sentences: problem + approach>", "tags": ["<tech>", "<tech>", "<tech>"], "githubUrl": "<url or empty string>", "liveUrl": "<url or empty string>" }
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
