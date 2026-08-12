import test from "node:test";
import assert from "node:assert/strict";
import { fixTechStackCapitalization } from "../techStackFixer.ts";

test("fixTechStackCapitalization - fixes technical term capitalization", () => {
  const input = "I worked on javascript, reactjs, and postgres with nodejs.";
  const { text, replacementsCount } = fixTechStackCapitalization(input);
  assert.equal(text, "I engineered JavaScript, React, and PostgreSQL with Node.js.");
  assert.ok(replacementsCount >= 4);
});
