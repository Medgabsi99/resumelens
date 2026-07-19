import { z } from "zod";

/**
 * Neutralizes common prompt injection instruction triggers.
 */
export function sanitizePromptInjection(text: string): string {
  const injectionPatterns = [
    /ignore\s+(?:all\s+|the\s+|above\s+)?instructions/gi,
    /system\s+override/gi,
    /forget\s+(?:your\s+)?instructions/gi,
    /you\s+are\s+now/gi,
    /new\s+instruction/gi,
    /bypass\s+(?:the\s+)?instructions/gi,
  ];

  let sanitized = text;
  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, (match) => `[neutralized: ${match}]`);
  }
  return sanitized;
}

/**
 * Creates a reusable Zod schema for validating, trimming, and sanitizing strings.
 */
export function createStringSchema(fieldName: string, maxLength: number, required = false) {
  let schema = z.string({
    message: `${fieldName} must be a string.`,
  });

  if (required) {
    schema = schema.refine((val) => val.trim().length > 0, {
      message: `${fieldName} cannot be empty.`,
    });
  }

  return schema
    .max(maxLength, {
      message: `${fieldName} exceeds the maximum allowed length of ${maxLength} characters.`,
    })
    .transform((val) => sanitizePromptInjection(val.trim()));
}

/**
 * Utility to validate, sanitize, and limit input strings using Zod under the hood.
 * Throws a descriptive validation error if validation fails.
 */
export function validateAndSanitizeInput(
  text: unknown,
  maxLength: number,
  fieldName: string,
  required = false
): string {
  if (text === undefined || text === null) {
    if (required) {
      throw new Error(`${fieldName} is required.`);
    }
    return "";
  }

  const schema = createStringSchema(fieldName, maxLength, required);
  const result = schema.safeParse(text);
  if (!result.success) {
    throw new Error(result.error.issues[0].message);
  }
  return result.data;
}

// ─── Example Schemas with Inferred Types ─────────────────────────────────────

export const AnalyzeRouteSchema = z.object({
  resumeText: createStringSchema("Resume text", 15000, true),
  jobDescription: createStringSchema("Job description", 10000).optional(),
  targetRole: createStringSchema("Target role", 200).optional(),
});

export type AnalyzeRouteInput = z.infer<typeof AnalyzeRouteSchema>;

