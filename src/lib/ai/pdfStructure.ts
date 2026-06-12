import { withRetryAndTimeout, pdfStructureModel } from "./client";

export interface AtsStructureCheck {
  status: "pass" | "warn" | "fail";
  details: string;
}

export interface AtsZoneHighlight {
  zone: "header" | "columns" | "ratings" | "tables" | "graphics" | "headings";
  severity: "info" | "warn" | "error";
  message: string;
  remedy: string;
}

export interface AtsStructureResult {
  atsScore: number;
  checklist: {
    singleColumn: AtsStructureCheck;
    textExtractable: AtsStructureCheck;
    headerFooterSafety: AtsStructureCheck;
    tableTextboxSafety: AtsStructureCheck;
    headingsStandard: AtsStructureCheck;
    graphicalElements: AtsStructureCheck;
  };
  highlightedZones: AtsZoneHighlight[];
}

export async function analyzePdfStructure(resumeText: string): Promise<AtsStructureResult> {
  const prompt = `Inspect the following parsed resume text for formatting, structure, and readability flags that affect ATS parser success.

[RESUME START]
${resumeText.slice(0, 6000)}
[RESUME END]

Analyze the text structure to determine:
1. Column Layout: Detect signs of dual columns (e.g. side-by-side keywords or contacts, or mixed lines of text).
2. Text Extractability: Confirm if text is coherent, parseable, and not empty or jumbled symbols.
3. Header/Footer Safety: Look for emails, phones, or links that appear isolated at the extreme top or bottom, indicating they might be trapped in header/footer layers.
4. Tables & Textboxes: Detect complex layout elements like text boxes or charts.
5. Headings Standard: Verify if headings match standard titles (e.g., "Experience", "Skills", "Education") or use custom/invented titles (e.g., "Superpowers", "My Journey").
6. Graphical Elements: Find symbols indicative of graphical ratings (e.g. circles, filled dots, stars like "●●●○○", "5/5" for skills).

Formulate warnings into zones for visual rendering on a mockup. Valid zones are: 'header', 'columns', 'ratings', 'tables', 'graphics', 'headings'.
Map any issues to their severity (info, warn, error) and suggest a direct remedy.

Return ONLY a JSON object with this exact structure (no markdown fences, no preambles):
{
  "atsScore": <integer 0-100 — based on checklist results>,
  "checklist": {
    "singleColumn": { "status": "<pass | warn | fail>", "details": "<short details string>" },
    "textExtractable": { "status": "<pass | warn | fail>", "details": "<short details string>" },
    "headerFooterSafety": { "status": "<pass | warn | fail>", "details": "<short details string>" },
    "tableTextboxSafety": { "status": "<pass | warn | fail>", "details": "<short details string>" },
    "headingsStandard": { "status": "<pass | warn | fail>", "details": "<short details string>" },
    "graphicalElements": { "status": "<pass | warn | fail>", "details": "<short details string>" }
  },
  "highlightedZones": [
    {
      "zone": "<one of: header | columns | ratings | tables | graphics | headings>",
      "severity": "<one of: info | warn | error>",
      "message": "<description of formatting issue detected>",
      "remedy": "<remedy text explaining how to fix the issue>"
    }
  ]
}
`;

  const result = await withRetryAndTimeout(() => pdfStructureModel.generateContent(prompt));
  const raw = result.response.text();
  const clean = raw.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean) as AtsStructureResult;
  } catch (err) {
    console.error("Failed to parse ATS structure scan:", raw);
    throw new Error("AI returned malformed ATS structure result.");
  }
}
