import { test } from "node:test";
import assert from "node:assert/strict";
import { auditLinkedInProfile } from "../linkedinOptimizer.ts";

test("auditLinkedInProfile - calculates high score for fully optimized profile", () => {
  const headline = "Senior Software Engineer | React, Node.js & AWS | Scaling High-Throughput APIs ($50M+ ARR)";
  const about = "Passionate Senior Full Stack Engineer with 8+ years of experience architecting enterprise SaaS platforms. Reduced system latency by 35% across microservices and scaled databases to handle over 1,000,000 active daily users. Proven track record of leading high-performing teams of 8+ engineers, implementing modern CI/CD pipelines, and driving product velocity. Specializing in TypeScript, Node.js, GraphQL, PostgreSQL, and AWS cloud infrastructure. Open to staff engineering opportunities. Reach out directly at alex.rivera@example.com.";
  const role = "Senior Software Engineer";

  const audit = auditLinkedInProfile(headline, about, role);

  assert.ok(audit.seoScore >= 70, `Expected seoScore >= 70, got ${audit.seoScore}`);
  assert.ok(audit.headline.score >= 70, `Expected headline score >= 70, got ${audit.headline.score}`);
  assert.ok(audit.about.score >= 70, `Expected about score >= 70, got ${audit.about.score}`);
  assert.ok(audit.headline.suggestedHeadlines.length >= 2, "Should return alternative suggested headlines");
});

test("auditLinkedInProfile - penalizes empty about section and short headline", () => {
  const headline = "Software Engineer";
  const about = "";
  const role = "Software Engineer";

  const audit = auditLinkedInProfile(headline, about, role);

  assert.ok(audit.seoScore <= 40, `Expected weak score <= 40, got ${audit.seoScore}`);
  assert.equal(audit.about.score, 0, "Empty about section should score 0");
  assert.ok(audit.about.feedback.some((f) => f.includes("empty")), "Should provide feedback on empty about section");
});
