import test from "node:test";
import assert from "node:assert/strict";
import { extractCleanJson } from "../cleanJson.ts";

test("extractCleanJson - parses clean JSON object", () => {
  const result = extractCleanJson('{"score": 95, "name": "Alex"}');
  assert.deepEqual(result, { score: 95, name: "Alex" });
});

test("extractCleanJson - strips markdown codeblock fences", () => {
  const raw = "```json\n{\n  \"match\": true\n}\n```";
  const result = extractCleanJson(raw);
  assert.deepEqual(result, { match: true });
});

test("extractCleanJson - removes trailing commas in object", () => {
  const raw = '{"skills": ["React", "Node",], "total": 2,}';
  const result = extractCleanJson(raw);
  assert.deepEqual(result, { skills: ["React", "Node"], total: 2 });
});

test("extractCleanJson - returns fallback on invalid JSON if provided", () => {
  const result = extractCleanJson("invalid json", { fallback: true });
  assert.deepEqual(result, { fallback: true });
});
