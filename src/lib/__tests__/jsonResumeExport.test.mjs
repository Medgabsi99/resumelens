import { test } from "node:test";
import assert from "node:assert/strict";
import { exportToJsonResumeSchema } from "../jsonResumeExport.ts";

test("exportToJsonResumeSchema - converts raw text to standard JSON Resume format", () => {
  const resume = `
    Alex Rivera
    Email: alex@example.com
    Phone: 555-123-4567
    LinkedIn: linkedin.com/in/arivera

    - Developed React web applications serving 100K users.
    - Optimized SQL queries reducing load time by 50%.
  `;

  const schema = exportToJsonResumeSchema(resume, "Senior Software Engineer", ["React", "SQL"]);

  assert.equal(schema.basics.name, "Alex Rivera");
  assert.equal(schema.basics.email, "alex@example.com");
  assert.equal(schema.basics.phone, "555-123-4567");
  assert.equal(schema.basics.label, "Senior Software Engineer");
  assert.ok(schema.skills[0].keywords.includes("React"));
  assert.ok(schema.work[0].highlights.length >= 2);
});
