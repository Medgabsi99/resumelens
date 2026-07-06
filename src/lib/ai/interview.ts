import { logger } from "@/lib/logger";
import {
  withRetryAndTimeout,
  interviewModel,
  structuredQuestionsModel,
  interviewEvaluatorModel,
  simulatorQuestionsModel,
  finalScorecardModel,
} from "./client";

export interface EvaluateResponse {
  score: number;
  feedback: string;
  starRating: {
    situation: boolean;
    task: boolean;
    action: boolean;
    result: boolean;
  };
  sampleAnswer: string;
}

export interface MockInterviewTranscriptEntry {
  question: string;
  answer: string;
  score: number;
  feedback: string;
  starRating: {
    situation: boolean;
    task: boolean;
    action: boolean;
    result: boolean;
  };
  sampleAnswer: string;
}

export interface MockInterviewScorecard {
  overallScore: number;
  starMastery: number;
  feedback: string;
  sentimentSummary: {
    confidence: number;
    pacing: "too-fast" | "too-slow" | "ideal";
    fillerWordsUsage: "low" | "moderate" | "high";
  };
  strengths: string[];
  weaknesses: string[];
}

export async function generateInterviewQuestions(
  resumeText: string,
  jobDescription?: string,
  targetRole?: string,
): Promise<string> {
  let prompt = `Based on the following resume`;
  if (targetRole) prompt += ` and the target role of "${targetRole}"`;
  if (jobDescription) prompt += ` and the job description provided`;
  prompt += `, generate 8-10 targeted interview questions that a hiring manager would likely ask.

The questions should:
- Test both technical skills and behavioral competencies
- Reference specific experiences or projects from the resume
- Include follow-up probes for deeper exploration
- Cover areas like: technical depth, problem-solving, teamwork, leadership, and cultural fit
- Be specific to this candidate, not generic interview questions

Format the output as a numbered list with each question on its own line. For questions with follow-ups, indent the follow-up with a dash.

[RESUME START]
${resumeText.slice(0, 6000)}
[RESUME END]`;

  if (jobDescription) {
    prompt += `\n\n[JOB DESCRIPTION START]\n${jobDescription.slice(0, 3000)}\n[JOB DESCRIPTION END]`;
  }

  const result = await withRetryAndTimeout(() => interviewModel.generateContent(prompt));
  return result.response.text().trim();
}

export async function generateInterviewQuestionsStream(
  resumeText: string,
  jobDescription?: string,
  targetRole?: string,
) {
  let prompt = `Based on the following resume`;
  if (targetRole) prompt += ` and the target role of "${targetRole}"`;
  if (jobDescription) prompt += ` and the job description provided`;
  prompt += `, generate 8-10 targeted interview questions that a hiring manager would likely ask.

The questions should:
- Test both technical skills and behavioral competencies
- Reference specific experiences or projects from the resume
- Include follow-up probes for deeper exploration
- Cover areas like: technical depth, problem-solving, teamwork, leadership, and cultural fit
- Be specific to this candidate, not generic interview questions

Format the output as a numbered list with each question on its own line. For questions with follow-ups, indent the follow-up with a dash.

[RESUME START]
${resumeText.slice(0, 6000)}
[RESUME END]`;

  if (jobDescription) {
    prompt += `\n\n[JOB DESCRIPTION START]\n${jobDescription.slice(0, 3000)}\n[JOB DESCRIPTION END]`;
  }

  return withRetryAndTimeout(() => interviewModel.generateContentStream(prompt));
}

export async function generateStructuredQuestions(
  resumeText: string,
  jobDescription?: string,
  targetRole?: string,
): Promise<string[]> {
  let prompt = `Generate exactly 5 targeted, high-value interview questions for this candidate based on their resume.`;
  if (targetRole) prompt += ` They are interviewing for the role of "${targetRole}".`;
  if (jobDescription) prompt += ` The job description is:\n[JOB DESCRIPTION START]\n${jobDescription.slice(0, 3000)}\n[JOB DESCRIPTION END]`;

  prompt += `\n\n[RESUME START]\n${resumeText.slice(0, 6000)}\n[RESUME END]

Return ONLY a JSON array of 5 strings (no preamble, no markdown fences):
[
  "Question 1...",
  "Question 2...",
  "Question 3...",
  "Question 4...",
  "Question 5..."
]

Ensure each question:
- References specific projects, experiences, or technologies on their resume where possible.
- Focuses on technical choices, design/architecture decisions, behavioral scenarios, or job requirement gaps.
- Avoids generic questions like 'tell me about yourself' — focus on high-impact queries.`;

  const result = await withRetryAndTimeout(() => structuredQuestionsModel.generateContent(prompt));
  const raw = result.response.text();
  const clean = raw.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean) as string[];
  } catch {
    // Fail-safe manual fallback if parsing errors out
    return [
      "Can you describe a challenging technical project you led and how you resolved the obstacles?",
      "How do you evaluate and choose technology stack architectures for new features?",
      "Describe a situation where you had a disagreement with a team member. How did you resolve it?",
      "How do you ensure code quality, testing coverage, and performance scaling in your applications?",
      "What is your approach to learning and adopting new engineering practices and tools?"
    ];
  }
}

export async function evaluateInterviewAnswer(
  resumeText: string,
  question: string,
  answer: string,
  jobDescription?: string,
): Promise<EvaluateResponse> {
  const prompt = `Evaluate the candidate's answer to this interview question. 

QUESTION:
${question}

[MESSAGE START]
${answer}
[MESSAGE END]

[RESUME START]
${resumeText.slice(0, 5000)}
[RESUME END]
${jobDescription ? `\n[JOB DESCRIPTION START]\n${jobDescription.slice(0, 3000)}\n[JOB DESCRIPTION END]` : ""}

Return ONLY a JSON object with this exact structure (no preamble, no markdown fences):
{
  "score": <integer 1-10 based on structure, clarity, metrics, and alignment>,
  "feedback": "<2-3 sentences of direct, actionable feedback. Identify if they rambled, lacked detail, or hit a home run.>",
  "starRating": {
    "situation": <boolean: did they outline the background/situation?>,
    "task": <boolean: did they specify their task/responsibility?>,
    "action": <boolean: did they describe the specific actions THEY took?>,
    "result": <boolean: did they state the outcome, impact, or quantified metric?>
  },
  "sampleAnswer": "<a sample strong response (100-150 words) that the candidate could have given, utilizing factual achievements/details from their resume.>"
}
`;

  const result = await withRetryAndTimeout(() => interviewEvaluatorModel.generateContent(prompt));
  const raw = result.response.text();
  const clean = raw.replace(/```json|```/g, "").trim();

  let parsed: EvaluateResponse;
  try {
    parsed = JSON.parse(clean);
  } catch {
    throw new Error("AI returned malformed JSON for answer evaluation. Please try again.");
  }

  // Validate fields
  parsed.score = Math.max(1, Math.min(10, parseInt(String(parsed.score)) || 5));
  if (!parsed.feedback) parsed.feedback = "Response received and evaluated.";
  if (!parsed.starRating) {
    parsed.starRating = { situation: false, task: false, action: false, result: false };
  }
  if (!parsed.sampleAnswer) parsed.sampleAnswer = "Aim to answer using the STAR method.";

  return parsed;
}

export async function generateSimulatorQuestions(
  resumeText: string,
  targetRole: string,
  companyName: string,
  jobDescription?: string,
  interviewType: string = "behavioral",
  difficulty: string = "mid"
): Promise<string[]> {
  const prompt = `Generate exactly 5 customized interview questions for a candidate.
  
  CANDIDATE PROFILE:
  - Resume context: [RESUME START] ${resumeText.slice(0, 5000)} [RESUME END]
  ${jobDescription ? `- Target Job Description: [JOB DESCRIPTION START] ${jobDescription.slice(0, 3000)} [JOB DESCRIPTION END]` : ""}
  
  INTERVIEW PROFILE:
  - Target Role: ${targetRole}
  - Target Company: ${companyName}
  - Interview Focus: ${interviewType} (behavioral, technical, or screening)
  - Target Candidate Seniority Level: ${difficulty} (junior, mid, senior)

  Ensure questions match the Focus style:
  - 'behavioral': focus on STAR methodology prompts (e.g., 'Tell me about a time...', 'Describe a situation where...').
  - 'technical': focus on coding choices, system design tradeoffs, tools, and technical problem-solving.
  - 'screening': focus on past accomplishments, background verification, high-level project goals, and general alignment.

  Return ONLY a JSON array of 5 strings:
  [
    "Question 1...",
    "Question 2...",
    "Question 3...",
    "Question 4...",
    "Question 5..."
  ]
  `;

  const result = await withRetryAndTimeout(() => simulatorQuestionsModel.generateContent(prompt));
  const raw = result.response.text();
  const clean = raw.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean) as string[];
  } catch (err) {
    logger.error("Failed to parse simulator questions:", raw);
    if (interviewType === "technical") {
      return [
        "Explain how you design scalable system architectures for microservices.",
        "How do you approach debugging memory leaks or performance bottlenecks in code?",
        "Describe a complex technical challenge you solved using your core language stack.",
        "How do you evaluate databases or API protocols (GraphQL vs REST) for a new project?",
        "Explain how you implement automated testing strategies for mission-critical code."
      ];
    } else {
      return [
        "Describe a challenging technical project you led and how you resolved the obstacles.",
        "How do you prioritize features or tasks when working under tight deadlines?",
        "Describe a situation where you had a disagreement with a team member. How did you resolve it?",
        "How do you ensure code quality, testing coverage, and performance scaling in your applications?",
        "What is your approach to learning and adopting new engineering practices and tools?"
      ];
    }
  }
}

export async function compileFinalInterviewScorecard(
  roleTitle: string,
  companyName: string,
  transcripts: { question: string; answer: string; score: number }[]
): Promise<MockInterviewScorecard> {
  const prompt = `Evaluate the candidate's performance across this mock interview for the role of "${roleTitle}" at "${companyName}".
  
  TRANSCRIPT:
  ${JSON.stringify(transcripts, null, 2)}
  
  Based on their answers:
  1. Determine an overall score (0-100) combining the question grades.
  2. Grade their STAR format utilization (0-100 STAR mastery).
  3. Compile 3 distinct strengths of their communication or experience.
  4. Compile 3 distinct areas to improve or weaknesses.
  5. Provide a summary feedback coaches note (2-3 sentences).
  6. Rate confidence (0-100), pacing, and filler word usage.

  Return ONLY a JSON object with this structure (no markdown fences):
  {
    "overallScore": <integer 0-100>,
    "starMastery": <integer 0-100>,
    "feedback": "<coaches note summary>",
    "sentimentSummary": {
      "confidence": <integer 0-100>,
      "pacing": "<one of: too-fast, too-slow, ideal>",
      "fillerWordsUsage": "<one of: low, moderate, high>"
    },
    "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
    "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"]
  }
  `;

  const result = await withRetryAndTimeout(() => finalScorecardModel.generateContent(prompt));
  const raw = result.response.text();
  const clean = raw.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean) as MockInterviewScorecard;
  } catch (err) {
    logger.error("Failed to parse compiled final scorecard:", raw);
    const totalScore = transcripts.reduce((acc, t) => acc + t.score, 0);
    const avgScore = transcripts.length ? Math.round((totalScore / (transcripts.length * 10)) * 100) : 0;
    return {
      overallScore: avgScore,
      starMastery: 75,
      feedback: "You demonstrated solid technical and communication competency throughout the session.",
      sentimentSummary: {
        confidence: 80,
        pacing: "ideal",
        fillerWordsUsage: "moderate"
      },
      strengths: ["Clear technical descriptions", "Aligned well with job expectations", "Provided contextual examples"],
      weaknesses: ["Could expand on quantified results", "Reduce use of generic filler words", "Structure answers more tightly"]
    };
  }
}
