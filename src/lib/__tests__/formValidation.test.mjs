import { test } from "node:test";
import assert from "node:assert/strict";
import {
  required,
  minLength,
  maxLength,
  isEmail,
  noScript,
  compose,
  checkPasswordStrength,
} from "../formValidation.ts";

test("formValidation - required rule checks empty and non-empty inputs", () => {
  const req = required("Username");
  assert.equal(req(""), "Username is required.");
  assert.equal(req("   "), "Username is required.");
  assert.equal(req("alex"), null);
});

test("formValidation - minLength and maxLength rules", () => {
  const min = minLength(5, "Password");
  const max = maxLength(10, "Password");

  assert.equal(min("1234"), "Password must be at least 5 characters.");
  assert.equal(min("12345"), null);

  assert.equal(max("12345678901"), "Password must be at most 10 characters.");
  assert.equal(max("1234567890"), null);
});

test("formValidation - isEmail validates properly", () => {
  const emailValidator = isEmail();
  assert.equal(emailValidator("test@example.com"), null);
  assert.equal(emailValidator("not-an-email"), "Please enter a valid email address.");
  assert.equal(emailValidator("user@domain"), "Please enter a valid email address.");
});

test("formValidation - noScript blocks XSS script tags", () => {
  const xssValidator = noScript();
  assert.equal(xssValidator("<script>alert(1)</script>"), "Invalid characters detected.");
  assert.equal(xssValidator("Clean text without scripts"), null);
});

test("formValidation - compose evaluates rules sequentially", () => {
  const composed = compose(required("Email"), isEmail());
  assert.equal(composed(""), "Email is required.");
  assert.equal(composed("invalid"), "Please enter a valid email address.");
  assert.equal(composed("valid@example.com"), null);
});

test("formValidation - checkPasswordStrength scores accurately", () => {
  const weak = checkPasswordStrength("1234");
  assert.equal(weak.level, "too-short");

  const strong = checkPasswordStrength("Str0ng!P@ssw0rd2026");
  assert.ok(strong.score >= 3);
  assert.ok(strong.level === "strong" || strong.level === "very-strong");
});
