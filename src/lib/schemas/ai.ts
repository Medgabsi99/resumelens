/**
 * Zod schemas for all AI response shapes.
 *
 * These schemas are the single source of truth for what we expect
 * from the Gemini API. Using them for runtime validation means:
 *  - Structural errors in AI responses surface with safe fallbacks (no runtime crashes)
 *  - TypeScript types are derived from the schemas (no drift between type and runtime)
 *  - Invalid sub-fields (e.g. score: "high") are caught and coerced safely
 */

import { z } from "zod";

// ─── Shared Primitives ────────────────────────────────────────────────────────

/** Clamps an AI-provided integer score to [1, 100]. */
export const ScoreField = z.union([z.number(), z.string()]).transform((val) => {
  const n = typeof val === "number" ? Math.round(val) : parseInt(String(val), 10);
  return isNaN(n) ? 50 : Math.max(1, Math.min(100, n));
});

/** Normalizes a string field, falling back to a default on null/undefined. */
export const SafeString = (fallback = "") =>
  z
    .string()
    .optional()
    .nullable()
    .transform((v) => v ?? fallback);

// ─── Analysis Result ──────────────────────────────────────────────────────────

const SuggestionSchema = z.object({
  section: SafeString("General"),
  before: SafeString(""),
  after: SafeString(""),
});

const AtsBreakdownSchema = z.object({
  format: ScoreField,
  keywords: ScoreField,
  impact: ScoreField,
  readability: ScoreField,
});

export const AnalysisResultSchema = z.object({
  score: ScoreField,
  summary: z.string().min(1).catch("No summary provided."),
  strengths: z
    .array(z.string())
    .catch([])
    .transform((arr) => arr.slice(0, 5)),
  weaknesses: z
    .array(z.string())
    .catch([])
    .transform((arr) => arr.slice(0, 5)),
  keywords_matched: z
    .array(z.string())
    .optional()
    .catch([])
    .transform((arr) => arr?.slice(0, 30) ?? []),
  keywords_missing: z
    .array(z.string())
    .optional()
    .catch([])
    .transform((arr) => arr?.slice(0, 30) ?? []),
  suggestions: z
    .array(SuggestionSchema)
    .catch([])
    .transform((arr) => arr.slice(0, 5)),
  ats_breakdown: AtsBreakdownSchema.catch({
    format: 50,
    keywords: 50,
    impact: 50,
    readability: 50,
  }),
  ats_rules: z.unknown().optional(),
});

export type AnalysisResultShape = z.infer<typeof AnalysisResultSchema>;

// ─── Preview Result ───────────────────────────────────────────────────────────

export const PreviewResultSchema = z.object({
  score: ScoreField,
  summary: z.string().min(1).catch("No summary provided."),
  strengths: z
    .array(z.string())
    .catch([])
    .transform((arr) => arr.slice(0, 2)),
});

export type PreviewResultShape = z.infer<typeof PreviewResultSchema>;

// ─── Job Match Result ─────────────────────────────────────────────────────────

export const JobMatchResultSchema = z
  .object({
    overallScore: ScoreField,
    fitVerdict: z.string().catch("Unknown"),
    matchRationale: z.string().catch(""),
    keyStrengths: z
      .array(z.string())
      .catch([])
      .transform((arr) => arr.slice(0, 6)),
    criticalGaps: z
      .array(z.string())
      .catch([])
      .transform((arr) => arr.slice(0, 6)),
    keywordCoverage: z
      .object({
        matched: z.array(z.string()).catch([]),
        missing: z.array(z.string()).catch([]),
        coveragePercent: ScoreField,
      })
      .catch({ matched: [], missing: [], coveragePercent: 0 }),
    applicationRecommendation: z.string().catch(""),
    interviewFocusAreas: z
      .array(z.string())
      .catch([])
      .transform((arr) => arr.slice(0, 5)),
  })
  .passthrough();

export type JobMatchResultShape = z.infer<typeof JobMatchResultSchema>;

// ─── Structured Interview Questions ───────────────────────────────────────────

export const StructuredQuestionsSchema = z
  .union([
    z.array(z.string()),
    z.object({ questions: z.array(z.string()) }).transform((o) => o.questions),
  ])
  .catch([]);

// ─── Interview Evaluation & Scorecards ────────────────────────────────────────

export const EvaluateResponseSchema = z.object({
  score: ScoreField,
  feedback: SafeString("Good response. Keep focusing on concrete results."),
  starRating: z
    .object({
      situation: z.boolean().catch(false),
      task: z.boolean().catch(false),
      action: z.boolean().catch(false),
      result: z.boolean().catch(false),
    })
    .catch({ situation: false, task: false, action: false, result: false }),
  sampleAnswer: SafeString(""),
});

export type EvaluateResponseShape = z.infer<typeof EvaluateResponseSchema>;

export const MockInterviewScorecardSchema = z.object({
  overallScore: ScoreField,
  starMastery: ScoreField,
  feedback: SafeString("Solid performance across behavioral and technical metrics."),
  sentimentSummary: z
    .object({
      confidence: ScoreField,
      pacing: z.enum(["too-fast", "too-slow", "ideal"]).catch("ideal"),
      fillerWordsUsage: z.enum(["low", "moderate", "high"]).catch("low"),
    })
    .catch({ confidence: 75, pacing: "ideal", fillerWordsUsage: "low" }),
  strengths: z.array(z.string()).catch([]),
  weaknesses: z.array(z.string()).catch([]),
});

export type MockInterviewScorecardShape = z.infer<typeof MockInterviewScorecardSchema>;

export const NegotiationOfferSchema = z.object({
  base: z.number().catch(0),
  bonus: z.number().catch(0),
  equity: z.number().catch(0),
  signOn: z.number().catch(0),
  other: SafeString(""),
});

export const NegotiationTurnResponseSchema = z.object({
  recruiterMessage: SafeString("Thank you for your response. Let me discuss with the team."),
  sentiment: z.enum(["open", "impressed", "resistant", "offended"]).catch("open"),
  leverage: ScoreField,
  coachFeedback: SafeString("Keep focusing on value-based reasoning."),
  currentOffer: NegotiationOfferSchema.catch({
    base: 0,
    bonus: 0,
    equity: 0,
    signOn: 0,
    other: "",
  }),
  isConcluded: z.boolean().catch(false),
  conclusionVerdict: z.enum(["accepted", "rejected", "walk_away", "ongoing"]).catch("ongoing"),
});

export const NegotiationScorecardSchema = z.object({
  score: ScoreField,
  tacticsUsed: z.array(z.string()).catch(["Value Anchoring"]),
  strengths: z.array(z.string()).catch(["Polite communication"]),
  weaknesses: z.array(z.string()).catch([]),
  financialGain: z.number().catch(0),
  coachesNote: SafeString("Good overall negotiation strategy."),
});

export type NegotiationScorecardShape = z.infer<typeof NegotiationScorecardSchema>;

export const NegotiationEvaluationSchema = NegotiationScorecardSchema;
export type NegotiationEvaluationShape = z.infer<typeof NegotiationEvaluationSchema>;

// ─── Learning Path Schema ────────────────────────────────────────────────────

export const LearningStepSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((v) => String(v)),
  title: z.string().min(1).catch("Skill Milestone"),
  category: z.string().catch("Technical"),
  estimatedHours: z.number().catch(10),
  resources: z
    .array(
      z.object({
        name: z.string().catch("Resource"),
        url: z.string().catch("#"),
        type: z.string().catch("article"),
      })
    )
    .catch([]),
  projectIdea: SafeString(""),
});

export const SkillGapProjectPhaseSchema = z.object({
  title: z.string().catch("Phase"),
  description: z.string().catch(""),
  tasks: z.array(z.string()).catch([]),
});

export const StarterSnippetSchema = z.object({
  filePath: z.string().catch("index.ts"),
  language: z.string().catch("typescript"),
  code: z.string().catch("// Starter implementation"),
  explanation: z.string().catch(""),
});

export const LearningMilestoneSchema = z.object({
  week: z.number().catch(1),
  title: z.string().catch("Weekly Milestone"),
  objective: z.string().catch(""),
  topics: z.array(z.string()).catch([]),
  resources: z
    .array(
      z.object({
        name: z.string().catch("Resource"),
        url: z.string().catch("#"),
      })
    )
    .catch([]),
  handsOnExercise: z.string().catch(""),
});

export const SkillGapPathResultSchema = z.object({
  roleTitle: z.string().catch("Target Role"),
  companyName: z.string().catch("Target Company"),
  missingSkills: z.array(z.string()).catch([]),
  project: z
    .object({
      title: z.string().catch("Hands-On Mastery Project"),
      description: z.string().catch(""),
      techStack: z.array(z.string()).catch([]),
      architecture: z.string().catch(""),
      phases: z.array(SkillGapProjectPhaseSchema).catch([]),
      starterSnippet: StarterSnippetSchema.catch({
        filePath: "main.ts",
        language: "typescript",
        code: "// Project Entrypoint",
        explanation: "Main project file",
      }),
    })
    .catch({
      title: "Hands-On Mastery Project",
      description: "Build a production-grade application exercising your missing skills.",
      techStack: [],
      architecture: "Modular architecture",
      phases: [],
      starterSnippet: {
        filePath: "main.ts",
        language: "typescript",
        code: "// Project Entrypoint",
        explanation: "Main project file",
      },
    }),
  milestones: z.array(LearningMilestoneSchema).catch([]),
});

export type SkillGapPathResultShape = z.infer<typeof SkillGapPathResultSchema>;
