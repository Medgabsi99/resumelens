/**
 * Lightweight client-side validation library — no external dependencies.
 * Mirrors the shape of the server-side validateAndSanitizeInput so that both
 * sides speak the same language.
 */

export type ValidationRule<T = string> = (value: T) => string | null;

export interface FieldError {
  field: string;
  message: string;
}

/** Compose multiple rules for a single field. Returns the first failing message or null. */
export function compose<T>(...rules: ValidationRule<T>[]): ValidationRule<T> {
  return (value: T) => {
    for (const rule of rules) {
      const msg = rule(value);
      if (msg) return msg;
    }
    return null;
  };
}

// ─── Common rules ───────────────────────────────────────────────────────────

export const required =
  (label = "This field"): ValidationRule =>
  (v) =>
    v.trim().length === 0 ? `${label} is required.` : null;

export const minLength =
  (n: number, label = "Value"): ValidationRule =>
  (v) =>
    v.trim().length < n ? `${label} must be at least ${n} characters.` : null;

export const maxLength =
  (n: number, label = "Value"): ValidationRule =>
  (v) =>
    v.trim().length > n ? `${label} must be at most ${n} characters.` : null;

export const isEmail = (): ValidationRule => (v) => {
  // RFC 5322-lite — covers the real-world cases that users actually type
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return re.test(v.trim()) ? null : "Please enter a valid email address.";
};

export const matchesField =
  (other: string, label = "Passwords"): ValidationRule =>
  (v) =>
    v !== other ? `${label} do not match.` : null;

export const noScript = (): ValidationRule => (v) =>
  /<script[\s>]/i.test(v) ? "Invalid characters detected." : null;

// ─── Password strength ────────────────────────────────────────────────────

export type StrengthLevel = "too-short" | "weak" | "fair" | "strong" | "very-strong";

export interface PasswordStrength {
  level: StrengthLevel;
  score: number; // 0–4
  label: string;
  color: string;
  suggestions: string[];
}

export function checkPasswordStrength(password: string): PasswordStrength {
  if (password.length < 6) {
    return {
      level: "too-short",
      score: 0,
      label: "Too short",
      color: "#ef4444",
      suggestions: ["At least 6 characters required."],
    };
  }

  let score = 0;
  const suggestions: string[] = [];

  if (password.length >= 8) score++;
  else suggestions.push("Use 8+ characters.");

  if (/[A-Z]/.test(password)) score++;
  else suggestions.push("Add uppercase letters.");

  if (/[0-9]/.test(password)) score++;
  else suggestions.push("Add numbers.");

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else suggestions.push("Add special characters (!@#$...).");

  const levels: Record<number, Omit<PasswordStrength, "score" | "suggestions">> = {
    0: { level: "weak", label: "Weak", color: "#ef4444" },
    1: { level: "weak", label: "Weak", color: "#ef4444" },
    2: { level: "fair", label: "Fair", color: "#f59e0b" },
    3: { level: "strong", label: "Strong", color: "#10b981" },
    4: { level: "very-strong", label: "Very strong", color: "#6366f1" },
  };

  return { ...levels[score], score, suggestions };
}

// ─── Form-level validator ─────────────────────────────────────────────────

type RuleMap<T extends Record<string, string>> = {
  [K in keyof T]?: ValidationRule;
};

export function validateForm<T extends Record<string, string>>(
  values: T,
  rules: RuleMap<T>
): Record<keyof T, string | null> {
  const errors = {} as Record<keyof T, string | null>;
  for (const key of Object.keys(rules) as (keyof T)[]) {
    const rule = rules[key];
    errors[key] = rule ? rule(values[key] ?? "") : null;
  }
  return errors;
}

/** Returns true if the errors object has any non-null entry */
export function hasErrors<T extends Record<string, string | null>>(errors: T): boolean {
  return Object.values(errors).some((v) => v !== null);
}
