/**
 * Utility to validate, sanitize, and limit input strings.
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

  if (typeof text !== "string") {
    throw new Error(`${fieldName} must be a string.`);
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    if (required) {
      throw new Error(`${fieldName} cannot be empty.`);
    }
    return "";
  }

  if (trimmed.length > maxLength) {
    throw new Error(`${fieldName} exceeds the maximum allowed length of ${maxLength} characters.`);
  }

  // Neutralize common prompt injection instruction triggers
  const injectionPatterns = [
    /ignore\s+(?:all\s+|the\s+|above\s+)?instructions/gi,
    /system\s+override/gi,
    /forget\s+(?:your\s+)?instructions/gi,
    /you\s+are\s+now/gi,
    /new\s+instruction/gi,
    /bypass\s+(?:the\s+)?instructions/gi,
  ];

  let sanitized = trimmed;
  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, (match) => `[neutralized: ${match}]`);
  }

  return sanitized;
}
