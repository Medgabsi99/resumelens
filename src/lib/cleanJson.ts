/**
 * Safely cleans and parses JSON strings returned from LLM completions.
 * Handles markdown backticks, trailing commas, unescaped newlines, and partial objects.
 */
export function extractCleanJson<T = unknown>(rawText: string, fallback?: T): T {
  if (!rawText || typeof rawText !== "string") {
    if (fallback !== undefined) return fallback;
    throw new Error("Empty JSON payload");
  }

  // 1. Strip markdown codeblock fences if present
  let cleaned = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // 2. Extract substring between first '{' or '[' and last '}' or ']'
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");

  let startIdx = -1;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }

  if (startIdx !== -1) {
    const isObject = cleaned[startIdx] === "{";
    const lastEndChar = isObject ? "}" : "]";
    const endIdx = cleaned.lastIndexOf(lastEndChar);

    if (endIdx > startIdx) {
      cleaned = cleaned.slice(startIdx, endIdx + 1);
    }
  }

  // 3. Remove trailing commas in arrays/objects (common LLM artifact)
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // 4. Try repairing unescaped newlines inside strings
    try {
      const repaired = cleaned.replace(/([^\\])"\s*\n\s*"/g, '$1"\\n"');
      return JSON.parse(repaired) as T;
    } catch {
      if (fallback !== undefined) return fallback;
      throw new Error(`Failed to parse AI JSON response: ${rawText.slice(0, 100)}...`);
    }
  }
}
