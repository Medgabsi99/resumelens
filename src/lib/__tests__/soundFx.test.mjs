import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { playSound, isSoundEnabled, setSoundEnabled, triggerHaptic } from "../soundFx.ts";

describe("Micro-Haptics & Sound FX Synthesis Engine", () => {
  test("playSound executes safely across all sound presets in headless environment", () => {
    const soundTypes = ["click", "apply", "success", "milestone90", "undo"];

    for (const type of soundTypes) {
      assert.doesNotThrow(() => {
        playSound(type);
      });
    }
  });

  test("triggerHaptic executes safely when navigator is unavailable", () => {
    assert.doesNotThrow(() => {
      triggerHaptic(10);
    });
  });

  test("sound preference getters and setters handle window absence gracefully", () => {
    assert.doesNotThrow(() => {
      const enabled = isSoundEnabled();
      assert.equal(typeof enabled, "boolean");
      setSoundEnabled(true);
    });
  });
});
