import { withRetryAndTimeout, skillGapModel } from "./client";

export interface ProjectPhase {
  title: string;
  description: string;
  tasks: string[];
}

export interface StarterSnippet {
  filePath: string;
  language: string;
  code: string;
  explanation: string;
}

export interface LearningMilestone {
  week: number;
  title: string;
  objective: string;
  topics: string[];
  resources: { name: string; url: string }[];
  handsOnExercise: string;
}

export interface SkillGapPathResult {
  roleTitle: string;
  companyName: string;
  missingSkills: string[];
  project: {
    title: string;
    description: string;
    techStack: string[];
    architecture: string;
    phases: ProjectPhase[];
    starterSnippet: StarterSnippet;
  };
  milestones: LearningMilestone[];
}

export async function generateSkillGapPath(
  resumeText: string,
  jobDescription: string,
  roleTitle: string,
  companyName: string
): Promise<SkillGapPathResult> {
  const prompt = `Analyze this candidate's resume against the target job description to build a custom skill-gap project and learning path.

Role: ${roleTitle}
Company: ${companyName}

[RESUME START]
${resumeText.slice(0, 5000)}
[RESUME END]

[JOB DESCRIPTION START]
${jobDescription.slice(0, 3000)}
[JOB DESCRIPTION END]

Perform these tasks:
1. Identify the top 2-3 most critical missing technical skills or tools that the JD asks for but the resume lacks.
2. Design a **Tailored Portfolio Project** that directly utilizes these missing skills.
   - Design a realistic project (e.g. "Distributed Task Queue", "Multi-Tenant Metrics Dashboard").
   - Break it into 3 phases (e.g., Core API, Cache/Messaging, Containerization/Deploy).
   - Provide a starter code file snippet (e.g., main configuration, a server router, or database models) that is functional and relevant.
3. Construct a **4-Week Milestone Learning Path** to master the missing skills chronologically.
   - Define a weekly milestone (Week 1, Week 2, Week 3, Week 4).
   - Include study topics, curated resource recommendations (with official doc names/links like 'https://react.dev' or 'https://go.dev/doc/'), and hands-on exercises.

Return ONLY a JSON object with this exact structure (no markdown fences, no preambles):
{
  "roleTitle": "${roleTitle}",
  "companyName": "${companyName}",
  "missingSkills": ["<skill 1>", "<skill 2>"],
  "project": {
    "title": "<project title>",
    "description": "<project description>",
    "techStack": ["<tech 1>", "<tech 2>"],
    "architecture": "<high-level architectural blueprint description>",
    "phases": [
      {
        "title": "Phase 1: ...",
        "description": "<description>",
        "tasks": ["<task>", "<task>"]
      }
    ],
    "starterSnippet": {
      "filePath": "<file path, e.g. main.go or server.js>",
      "language": "<language, e.g. go or javascript>",
      "code": "<starter boilerplate code implementation>",
      "explanation": "<explanation of the starter code>"
    }
  },
  "milestones": [
    {
      "week": 1,
      "title": "<milestone title>",
      "objective": "<milestone objective>",
      "topics": ["<topic 1>", "<topic 2>"],
      "resources": [
        { "name": "<official resource name>", "url": "<url>" }
      ],
      "handsOnExercise": "<hands-on exercise description>"
    }
  ]
}
`;

  const result = await withRetryAndTimeout(() => skillGapModel.generateContent(prompt));
  const raw = result.response.text();
  const clean = raw.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean) as SkillGapPathResult;
  } catch (err) {
    console.error("Failed to parse skill gap learning path:", raw);
    throw new Error("AI returned malformed skill gap project JSON.");
  }
}
