import { test } from "node:test";
import assert from "node:assert/strict";
import { simulateAtsVendors } from "../atsSimulatorEngine.ts";

test("simulateAtsVendors - returns valid ATS vendor profiles and scores", () => {
  const sampleResume = `
    Jane Smith
    email: jane@example.com
    phone: (555) 123-4567
    LinkedIn: linkedin.com/in/janesmith

    EXPERIENCE
    Senior Software Engineer - Stripe (01/2021 - Present)
    - Led a team of 5 engineers to build a payment service processing $10M daily.
    - Automated CI/CD pipelines reducing deployment time by 40%.

    EDUCATION
    BS Computer Science, Stanford University (2016 - 2020)

    SKILLS
    React, Node.js, TypeScript, PostgreSQL, AWS, Docker
  `;

  const result = simulateAtsVendors(sampleResume);

  assert.ok(result.overallVendorScore > 0, "overallVendorScore should be positive");
  assert.ok(result.profiles.workday, "Workday profile should exist");
  assert.ok(result.profiles.greenhouse, "Greenhouse profile should exist");
  assert.ok(result.profiles.lever, "Lever profile should exist");
  assert.ok(result.profiles.taleo, "Taleo profile should exist");
  assert.ok(result.profiles.icims, "iCIMS profile should exist");

  assert.equal(typeof result.topVendorName, "string");
  assert.equal(typeof result.lowestVendorName, "string");
  assert.equal(typeof result.universalFixesCount, "number");
});

test("simulateAtsVendors - flags missing contact info and headers", () => {
  const weakResume = "Just a short raw text with no headers or contact details.";
  const result = simulateAtsVendors(weakResume);

  assert.ok(result.overallVendorScore < 60, "Weak resume score should be low");
  assert.ok(result.universalFixesCount >= 1, "Should report universal fixes");
});
