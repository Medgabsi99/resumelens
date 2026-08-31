import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runPreFlightAudit } from "../preflightAuditor.ts";
import { evaluateCompanyFit, COMPANY_RUBRICS } from "../ai/companyCultureRubrics.ts";
import { executeWithMultiLlmFallback } from "../ai/multiLlmFallback.ts";

describe("Transcendent Tier Luxury Suite Tests", () => {
  describe("Innovation 3: Tier-1 FAANG Culture Rubrics", () => {
    it("Evaluates Amazon leadership principles with customer obsession focus", () => {
      const sampleResume = "Software Engineer with deep customer obsession. Spearheaded cloud architecture saving $120K.";
      const evalResult = evaluateCompanyFit(sampleResume, "amazon");

      assert.equal(evalResult.rubric.id, "amazon");
      assert.ok(evalResult.score >= 70);
      assert.ok(evalResult.matchedPrinciples.length > 0);
      assert.ok(evalResult.rubric.sampleCultureRewrite.after.length > 20);
    });

    it("Evaluates Google distributed system constraints and complexity", () => {
      const sampleResume = "Architected large-scale distributed systems and Kubernetes clusters.";
      const evalResult = evaluateCompanyFit(sampleResume, "google");

      assert.equal(evalResult.rubric.id, "google");
      assert.ok(evalResult.score >= 70);
    });
  });

  describe("Innovation 4: Pre-Flight Launchpad Auditor", () => {
    it("Audits clean resume with 6-point checks and generates verified certificate ID", () => {
      const resume = `Alex Morgan
alex.morgan@email.com | (555) 019-2834 | linkedin.com/in/alexmorgan

EXPERIENCE
Senior Software Engineer, Acme Corp
• Architected real-time notification engine with Node.js & Redis, reducing p99 latency by 45%.
• Spearheaded migration of 18 microservices to AWS EKS, cutting infrastructure spend by $120K annually.
• Mentored 6 associate engineers, boosting squad velocity by 28% across 4 quarters.

SKILLS
TypeScript, React, Next.js, Node.js, AWS, Kubernetes, PostgreSQL, Redis`;

      const audit = runPreFlightAudit(resume);

      assert.ok(audit.readinessScore >= 80);
      assert.ok(audit.certificateId.startsWith("RL-"));
      assert.ok(audit.certificateId.endsWith("-VERIFIED"));
      assert.equal(audit.items.length, 6);

      const contactItem = audit.items.find((i) => i.id === "contact");
      assert.ok(contactItem);
      assert.equal(contactItem.passed, true);

      const atsItem = audit.items.find((i) => i.id === "ats");
      assert.ok(atsItem);
      assert.equal(atsItem.passed, true);

      const metricsItem = audit.items.find((i) => i.id === "metrics");
      assert.ok(metricsItem);
      assert.equal(metricsItem.passed, true);
    });
  });

  describe("Innovation 5: Multi-LLM Fallback & Self-Healing Circuit Breaker", () => {
    it("Transparently falls back to secondary provider when primary throws", async () => {
      const primaryFail = async () => {
        throw new Error("HTTP 429 Rate limit exceeded");
      };
      const secondaryPass = async () => {
        return { message: "Claude 3.5 Haiku executed successfully" };
      };

      const result = await executeWithMultiLlmFallback(primaryFail, secondaryPass);

      assert.equal(result.providerUsed, "claude-3.5-haiku");
      assert.equal(result.fellBack, true);
      assert.equal(result.data.message, "Claude 3.5 Haiku executed successfully");
    });

    it("Transparently falls back to deterministic heuristics when all APIs fail", async () => {
      const primaryFail = async () => {
        throw new Error("Gemini down");
      };
      const secondaryFail = async () => {
        throw new Error("Claude down");
      };
      const tertiaryFail = async () => {
        throw new Error("OpenAI down");
      };
      const localHeuristics = () => ({ status: "Deterministic safety net" });

      const result = await executeWithMultiLlmFallback(
        primaryFail,
        secondaryFail,
        tertiaryFail,
        localHeuristics
      );

      assert.equal(result.providerUsed, "deterministic-fallback");
      assert.equal(result.fellBack, true);
      assert.equal(result.data.status, "Deterministic safety net");
    });
  });
});
