/**
 * resumeStyleDefaults.ts — CLIENT-SAFE
 *
 * Contains only the default ResumeStyleTokens constant.
 * Kept separate from extractResumeStyle.ts (which is server-only)
 * so that client components can import this without pulling in
 * Node.js-only modules (pdf-parse, fs, etc.).
 */
import type { ResumeStyleTokens } from "@/types";

export const DEFAULT_STYLE_TOKENS: ResumeStyleTokens = {
  accentColor: "#0f766e",
  inkColor: "#1a1a1a",
  fontFamily: "Inter",
  sectionStyle: "colored-underline",
  headerAlignment: "left",
  datePosition: "inline-right",
  hasPhoto: false,
  hasSeparatorLine: true,
  layout: "single-column",
  nameSizeCategory: "large",
  bulletStyle: "dot",
  backgroundColor: "#ffffff",
};
