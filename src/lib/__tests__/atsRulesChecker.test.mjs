import { test } from "node:test";
import assert from "node:assert/strict";
import { runAtsChecks } from "../atsRulesChecker.ts";

test("runAtsChecks - produces high compliance score for complete resume", () => {
  const resume = `
    Alex Rivera
    Email: alex.rivera@example.com
    Phone: (555) 987-6543
    LinkedIn: linkedin.com/in/arivera

    SUMMARY
    Senior Full Stack Engineer with 7+ years of experience architecting high-availability cloud systems.

    EXPERIENCE
    Lead Engineer - Tech Corp (2021 - Present)
    - Architected scalable payment service handling 5,000 requests/sec with 99.99% uptime.
    - Led team of 6 engineers to launch new SaaS platform, driving $2.5M ARR in Year 1.
    - Automated deployment pipelines reducing cycle time by 45%.

    EDUCATION
    BS in Computer Science - University of California, Berkeley (GPA: 3.8/4.0)

    SKILLS
    React, Node.js, TypeScript, PostgreSQL, AWS, Docker, Kubernetes
  `;

  const result = runAtsChecks(resume);

  assert.ok(result.deterministicScore >= 80, "Compliance score should be >= 80");
  assert.ok(result.passCount > result.failCount, "Pass count should exceed fail count");
  assert.ok(result.checks.length >= 10, "Should evaluate at least 10 criteria");
});

test("runAtsChecks - flags missing contact info and weak bullet points", () => {
  const weakResume = `
    Jane Doe
    No contact details provided.

    Work History
    - Responsible for working on software applications and helping the team.
    - Did stuff with database queries.
  `;

  const result = runAtsChecks(weakResume);

  assert.ok(result.deterministicScore < 60, "Compliance score should be low");
  assert.ok(result.failCount >= 2, "Should have multiple failure flags");
  
  const emailCheck = result.checks.find((c) => c.id === "contact_email");
  assert.equal(emailCheck?.status, "fail");
});
