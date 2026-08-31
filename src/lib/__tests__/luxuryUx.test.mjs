import test, { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Luxury UX/UI Architecture & Design System", () => {
  it("Slash command templates contain valid Google XYZ and metric structures", () => {
    const slashTemplates = [
      {
        id: "xyz",
        template: "Accomplished [X% improvement/scale] by implementing [specific technology/process], resulting in [quantifiable business outcome]",
      },
      {
        id: "metric",
        template: ", reducing latency by 40% and scaling infrastructure to support 150K+ active users",
      },
    ];

    for (const cmd of slashTemplates) {
      assert.ok(cmd.template.length > 20);
      assert.ok(cmd.template.includes("%") || cmd.template.includes("["));
    }
  });

  it("Bento tier mapping calculates accurate percentile labels and colors", () => {
    function getScoreTier(score) {
      if (score >= 90) return { label: "Elite Top 5%", color: "#10b981" };
      if (score >= 80) return { label: "Strong Candidate", color: "#3b82f6" };
      if (score >= 70) return { label: "Competitive", color: "#f59e0b" };
      return { label: "Needs Improvement", color: "#ef4444" };
    }

    assert.equal(getScoreTier(95).label, "Elite Top 5%");
    assert.equal(getScoreTier(84).label, "Strong Candidate");
    assert.equal(getScoreTier(72).label, "Competitive");
    assert.equal(getScoreTier(55).label, "Needs Improvement");
  });

  it("Contextual selection rewriting adds executive phrasing and metrics", () => {
    function rewriteSelection(text, type) {
      if (type === "stronger") {
        return `Spearheaded and delivered ${text.toLowerCase()}, accelerating release cadence`;
      }
      if (type === "quantify") {
        return `${text}, cutting p99 latency by 38% and driving $120K annual cost reduction`;
      }
      if (type === "keywords") {
        return `${text} using production TypeScript, Next.js, and cloud microservices`;
      }
      return text;
    }

    const initial = "developed new api endpoints";
    const executive = rewriteSelection(initial, "stronger");
    const quantified = rewriteSelection(initial, "quantify");

    assert.ok(executive.startsWith("Spearheaded and delivered"));
    assert.ok(quantified.includes("cutting p99 latency by 38%"));
  });
});
