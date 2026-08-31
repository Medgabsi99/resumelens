import { test } from "node:test";
import assert from "node:assert/strict";
import { DESIGN_TOKENS } from "../designTokens.ts";

test("DESIGN_TOKENS - exports valid presets with all required styling properties", () => {
  const presets = ["professional", "modern", "minimal", "creative", "executive"];

  for (const preset of presets) {
    const token = DESIGN_TOKENS[preset];
    assert.ok(token, `Preset ${preset} should exist`);
    assert.ok(token.primaryColor.startsWith("#"), "Primary color should be valid hex");
    assert.ok(token.fontFamily.length > 0, "Font family should be defined");
    assert.ok(token.fontSize.endsWith("pt"), "Font size should specify pt units");
    assert.ok(token.padding.length > 0, "Padding should be defined");
  }
});
