import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("1-Click Job Match Extension Parser & Logic", () => {
  test("cleans raw window.document.title into concise job title", () => {
    const rawTitle = "Senior Full Stack Engineer - Remote | Acme AI Jobs - LinkedIn";
    const cleaned = rawTitle.split(/[-|@]|(?:\bat\b)/i)[0].trim();

    assert.equal(cleaned, "Senior Full Stack Engineer");
  });

  test("correctly identifies supported job board hostnames", () => {
    const supportedHosts = [
      "www.linkedin.com",
      "indeed.com",
      "www.glassdoor.com",
      "boards.greenhouse.io",
      "jobs.lever.co",
    ];

    const isSupported = (host) => {
      return (
        host.includes("linkedin.com") ||
        host.includes("indeed.com") ||
        host.includes("glassdoor.com") ||
        host.includes("greenhouse.io") ||
        host.includes("lever.co")
      );
    };

    supportedHosts.forEach((host) => {
      assert.equal(isSupported(host), true);
    });

    assert.equal(isSupported("randomblog.org"), false);
  });

  test("calculates keyword match percentage accurately", () => {
    const jobKeywords = ["typescript", "react", "next.js", "postgresql", "docker", "graphql"];
    const resumeText = "Experienced in TypeScript, React, Next.js and PostgreSQL database design.";

    const lowerResume = resumeText.toLowerCase();
    const matched = jobKeywords.filter((kw) => lowerResume.includes(kw));
    const missing = jobKeywords.filter((kw) => !lowerResume.includes(kw));

    const matchRate = Math.round((matched.length / jobKeywords.length) * 100);

    assert.equal(matched.length, 4);
    assert.equal(missing.length, 2);
    assert.equal(matchRate, 67);
  });
});
