import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateSkillRadarData } from "../skillRadarEngine.ts";

test("calculateSkillRadarData - returns 6 axes with sensible defaults for empty text", () => {
  const result = calculateSkillRadarData("", "senior");
  assert.equal(result.axes.length, 6);
  assert.equal(result.selectedLevel, "senior");
  assert.ok(result.overallFitScore >= 0 && result.overallFitScore <= 100);
});

test("calculateSkillRadarData - scores strong senior profile with high tech and architecture scores", () => {
  const resume = `
    Staff Software Engineer with expertise in Kubernetes, Docker, React, TypeScript, GraphQL, Python, AWS, PostgreSQL, Redis.
    - Architected distributed microservices platform processing 25,000 requests/sec with 99.999% uptime.
    - Mentored 12 junior and mid-level engineers, established engineering hiring rubrics.
    - Increased revenue by $4.2M through automated latency reductions of 60%.
    - Spearheaded agile CI/CD pipelines with automated unit tests and integration tests.
    - Led product roadmap and aligned with stakeholders on SLA and KPI deliverables.
  `;

  const seniorResult = calculateSkillRadarData(resume, "senior");
  assert.equal(seniorResult.axes.length, 6);
  assert.ok(seniorResult.overallFitScore >= 50, "Strong senior profile should score >= 50");
  
  const techAxis = seniorResult.axes.find((a) => a.key === "tech");
  const archAxis = seniorResult.axes.find((a) => a.key === "arch");
  assert.ok(techAxis && techAxis.score >= 60, "Tech score should be >= 60");
  assert.ok(archAxis && archAxis.score >= 50, "Arch score should be >= 50");
});

test("calculateSkillRadarData - adapts benchmarks by seniority level", () => {
  const resume = "Software developer with React, Node.js and Git experience.";
  const juniorResult = calculateSkillRadarData(resume, "junior");
  const staffResult = calculateSkillRadarData(resume, "staff");

  const juniorTech = juniorResult.axes.find((a) => a.key === "tech");
  const staffTech = staffResult.axes.find((a) => a.key === "tech");

  assert.ok((juniorTech?.targetScore || 0) < (staffTech?.targetScore || 0));
  assert.ok(juniorResult.overallFitScore >= staffResult.overallFitScore);
});
