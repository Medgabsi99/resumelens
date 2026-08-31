/**
 * Tests for AI Response Zod Schemas (src/lib/schemas/ai.ts).
 * Verifies parsing, coercion, clamping, and graceful degradation
 * for all AI output shapes without requiring the Next.js runtime.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";

// ─── Inline schema definitions (mirrors ai.ts) ────────────────────────────────

const ScoreField = z
  .union([z.number(), z.string()])
  .transform((val) => {
    const n = typeof val === "number" ? Math.round(val) : parseInt(String(val), 10);
    return isNaN(n) ? 50 : Math.max(1, Math.min(100, n));
  });

const SafeString = (fallback = "") =>
  z.string().optional().nullable().transform((v) => v ?? fallback);

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

const AnalysisResultSchema = z.object({
  score: ScoreField,
  summary: z.string().min(1).catch("No summary provided."),
  strengths: z.array(z.string()).catch([]).transform((arr) => arr.slice(0, 5)),
  weaknesses: z.array(z.string()).catch([]).transform((arr) => arr.slice(0, 5)),
  keywords_matched: z.array(z.string()).optional().catch([]).transform((arr) => arr?.slice(0, 30) ?? []),
  keywords_missing: z.array(z.string()).optional().catch([]).transform((arr) => arr?.slice(0, 30) ?? []),
  suggestions: z.array(SuggestionSchema).catch([]).transform((arr) => arr.slice(0, 5)),
  ats_breakdown: AtsBreakdownSchema.catch({ format: 50, keywords: 50, impact: 50, readability: 50 }),
  ats_rules: z.unknown().optional(),
});

const PreviewResultSchema = z.object({
  score: ScoreField,
  summary: z.string().min(1).catch("No summary provided."),
  strengths: z.array(z.string()).catch([]).transform((arr) => arr.slice(0, 2)),
});

const StructuredQuestionsSchema = z
  .union([
    z.array(z.string()),
    z.object({ questions: z.array(z.string()) }).transform((o) => o.questions),
  ])
  .catch([]);

const EvaluateResponseSchema = z.object({
  score: ScoreField,
  feedback: SafeString("Good response."),
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

const MockInterviewScorecardSchema = z.object({
  overallScore: ScoreField,
  starMastery: ScoreField,
  feedback: SafeString("Solid performance."),
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

const NegotiationTurnResponseSchema = z.object({
  recruiterMessage: SafeString("Response received."),
  sentiment: z.enum(["open", "impressed", "resistant", "offended"]).catch("open"),
  leverage: ScoreField,
  coachFeedback: SafeString("Keep negotiating."),
  isConcluded: z.boolean().catch(false),
  conclusionVerdict: z.enum(["accepted", "rejected", "walk_away", "ongoing"]).catch("ongoing"),
});

// ─── Test Data ────────────────────────────────────────────────────────────────

const VALID_ANALYSIS = {
  score: 72,
  summary: "Strong technical background with good impact metrics.",
  strengths: ["Led cross-functional team of 8", "Reduced deployment time by 40%", "Full-stack expertise"],
  weaknesses: ["No leadership examples in recent roles", "Cover letter not tailored"],
  keywords_matched: ["React", "TypeScript", "Node.js"],
  keywords_missing: ["GraphQL", "Kubernetes"],
  suggestions: [
    { section: "Experience — Acme Corp 2022", before: "Worked on APIs", after: "Designed 5 RESTful APIs serving 1M+ requests/day, reducing p99 latency by 30%." },
    { section: "Skills", before: "JavaScript", after: "TypeScript (5 years) — authored internal library adopted by 3 teams." },
    { section: "Summary", before: "Experienced developer", after: "Senior Full-Stack Engineer with 7 years delivering scalable Node.js and React systems." },
  ],
  ats_breakdown: { format: 85, keywords: 70, impact: 68, readability: 80 },
};

// ─── AnalysisResultSchema Tests ───────────────────────────────────────────────

describe("AnalysisResultSchema — valid input", () => {
  test("parses a perfect AI response without modification", () => {
    const result = AnalysisResultSchema.parse(VALID_ANALYSIS);
    assert.equal(result.score, 72);
    assert.equal(result.summary, "Strong technical background with good impact metrics.");
    assert.equal(result.strengths.length, 3);
    assert.equal(result.suggestions.length, 3);
    assert.equal(result.ats_breakdown.format, 85);
  });

  test("clamps score above 100 to 100", () => {
    const result = AnalysisResultSchema.parse({ ...VALID_ANALYSIS, score: 150 });
    assert.equal(result.score, 100);
  });

  test("clamps score below 1 to 1", () => {
    const result = AnalysisResultSchema.parse({ ...VALID_ANALYSIS, score: -10 });
    assert.equal(result.score, 1);
  });

  test("coerces string score to integer", () => {
    const result = AnalysisResultSchema.parse({ ...VALID_ANALYSIS, score: "78" });
    assert.equal(result.score, 78);
  });
});

describe("StructuredQuestionsSchema", () => {
  test("parses flat array of questions", () => {
    const questions = ["Q1", "Q2", "Q3"];
    const result = StructuredQuestionsSchema.parse(questions);
    assert.deepEqual(result, questions);
  });

  test("normalizes object with questions key into string array", () => {
    const obj = { questions: ["Q1", "Q2", "Q3"] };
    const result = StructuredQuestionsSchema.parse(obj);
    assert.deepEqual(result, ["Q1", "Q2", "Q3"]);
  });

  test("falls back to empty array on invalid format", () => {
    const result = StructuredQuestionsSchema.parse("invalid");
    assert.deepEqual(result, []);
  });
});

describe("EvaluateResponseSchema", () => {
  test("parses evaluation response with STAR ratings", () => {
    const data = {
      score: 8,
      feedback: "Great answer with metrics.",
      starRating: { situation: true, task: true, action: true, result: true },
      sampleAnswer: "At my previous company...",
    };
    const result = EvaluateResponseSchema.parse(data);
    assert.equal(result.score, 8);
    assert.equal(result.starRating.situation, true);
  });

  test("handles missing STAR fields gracefully", () => {
    const data = { score: "7" };
    const result = EvaluateResponseSchema.parse(data);
    assert.equal(result.score, 7);
    assert.equal(result.starRating.situation, false);
    assert.equal(result.feedback, "Good response.");
  });
});

describe("MockInterviewScorecardSchema", () => {
  test("parses scorecard and sentiment summary", () => {
    const data = {
      overallScore: 88,
      starMastery: 90,
      feedback: "Excellent clarity and structure.",
      sentimentSummary: {
        confidence: 85,
        pacing: "ideal",
        fillerWordsUsage: "low",
      },
      strengths: ["Strong technical examples"],
      weaknesses: ["Brief on error handling"],
    };
    const result = MockInterviewScorecardSchema.parse(data);
    assert.equal(result.overallScore, 88);
    assert.equal(result.sentimentSummary.pacing, "ideal");
  });
});

describe("NegotiationTurnResponseSchema", () => {
  test("parses negotiation turn response", () => {
    const data = {
      recruiterMessage: "We can increase the base salary by $5,000.",
      sentiment: "impressed",
      leverage: 75,
      coachFeedback: "Great push on the base.",
      isConcluded: false,
      conclusionVerdict: "ongoing",
    };
    const result = NegotiationTurnResponseSchema.parse(data);
    assert.equal(result.sentiment, "impressed");
    assert.equal(result.leverage, 75);
  });
});
