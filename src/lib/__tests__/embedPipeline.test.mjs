import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { chunkResume } from "../ai/chunker.ts";

describe("RAG embed pipeline - chunkResume", () => {
  const sampleResume = `
Jane Doe
Senior Full-Stack Engineer
jane@example.com | San Francisco, CA

SUMMARY
Experienced software engineer with 8 years designing distributed systems in Node.js and TypeScript.

EXPERIENCE
Staff Engineer — Acme Corp (2021 – Present)
• Architected event-driven microservices processing 50M events daily with Kafka and Redis.
• Reduced API p99 latency by 35% through query optimization and caching.

Senior Developer — Beta Tech (2018 – 2021)
• Built customer-facing dashboard in React and GraphQL.
• Led migration from monolith to Dockerized containers on AWS.

EDUCATION
B.S. in Computer Science — Stanford University (2014 – 2018)

SKILLS
TypeScript, React, Node.js, PostgreSQL, Docker, Kubernetes, AWS, GraphQL
`;

  test("chunks a full resume into labeled sections", () => {
    const chunks = chunkResume(sampleResume);
    assert.ok(chunks.length >= 3, `Expected at least 3 chunks, got ${chunks.length}`);

    const types = chunks.map((c) => c.type);
    assert.ok(types.includes("experience") || types.includes("summary") || types.includes("education"), "Should include standard section types");

    chunks.forEach((c) => {
      assert.ok(c.content.length > 0, "Chunk content must not be empty");
      assert.ok(typeof c.index === "number", "Chunk must have a numeric index");
    });
  });

  test("returns empty array for empty or whitespace-only text", () => {
    const chunks = chunkResume("   \n\n  ");
    assert.equal(chunks.length, 0);
  });
});
