import { test, describe } from "node:test";
import assert from "node:assert/strict";

const SAMPLE_XRAY_RESUME = `ALEXANDER RIVERA
Full Stack Engineer • alex@example.com • San Francisco, CA

PROFESSIONAL EXPERIENCE
Senior Software Engineer | Acme Cloud | 2021 – Present
• Responsible for designing microservices architecture in TypeScript.
• Spearheaded migration to Next.js reducing latency by 42%.
• Worked on database optimization and automated testing suites.
• Assisted with team mentoring and code reviews.

TECHNICAL SKILLS
TypeScript, React, Node.js, GraphQL, PostgreSQL, Docker, AWS`;

const WEAK_PHRASES = ["responsible for", "worked on", "assisted with", "helped", "participated in"];

describe("ATS X-Ray Highlighting & Visual Overlay Logic", () => {
  test("correctly identifies weak passive phrases in resume text", () => {
    const lower = SAMPLE_XRAY_RESUME.toLowerCase();
    const detected = [];

    WEAK_PHRASES.forEach((phrase) => {
      if (lower.includes(phrase)) {
        detected.push(phrase);
      }
    });

    assert.equal(detected.length, 3);
    assert.ok(detected.includes("responsible for"));
    assert.ok(detected.includes("worked on"));
    assert.ok(detected.includes("assisted with"));
  });

  test("correctly distinguishes quantified bullets from unquantified bullets", () => {
    const lines = SAMPLE_XRAY_RESUME.split("\n");
    const bullets = lines
      .map((l) => l.trim())
      .filter((l) => l.startsWith("•") || l.startsWith("-"));

    const unquantified = bullets.filter((b) => {
      const hasMetric = /\d+[%kKmMbB$]?|\$\d+|\b\d+\b/.test(b);
      return !hasMetric;
    });

    const quantified = bullets.filter((b) => {
      const hasMetric = /\d+[%kKmMbB$]?|\$\d+|\b\d+\b/.test(b);
      return hasMetric;
    });

    assert.equal(quantified.length, 1); // "reducing latency by 42%"
    assert.equal(unquantified.length, 3);
  });

  test("keyword matched set correctly filters target tokens", () => {
    const keywordsMatched = ["TypeScript", "React", "GraphQL", "Docker"];
    const matchedSet = new Set(keywordsMatched.map((k) => k.toLowerCase()));

    assert.equal(matchedSet.has("typescript"), true);
    assert.equal(matchedSet.has("react"), true);
    assert.equal(matchedSet.has("kubernetes"), false);
  });
});
