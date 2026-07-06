export interface DesignToken {
  primaryColor: string;
  fontFamily: string;
  fontFamilyPdf: string;
  textColor: string;
  fontSize: string;
  lineHeight: string;
  padding: string;
}

export const DESIGN_TOKENS: Record<string, DesignToken> = {
  professional: {
    primaryColor: "#1e3a8a", // Classic deep corporate blue
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontFamilyPdf: "Lora",
    textColor: "#1a1a1a",
    fontSize: "11pt",
    lineHeight: "1.6",
    padding: "56px 48px",
  },
  modern: {
    primaryColor: "#0f172a", // Sleek dark slate
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    fontFamilyPdf: "Inter",
    textColor: "#1e293b",
    fontSize: "10pt",
    lineHeight: "1.55",
    padding: "40px 24px",
  },
  minimal: {
    primaryColor: "#111827",
    fontFamily: "Helvetica, Arial, sans-serif",
    fontFamilyPdf: "Helvetica",
    textColor: "#111827",
    fontSize: "10pt",
    lineHeight: "1.5",
    padding: "36px 32px",
  },
  creative: {
    primaryColor: "#c2410c", // Warm burnt orange
    fontFamily: "Montserrat, Arial, sans-serif",
    fontFamilyPdf: "Montserrat",
    textColor: "#0b1220",
    fontSize: "10pt",
    lineHeight: "1.6",
    padding: "26px",
  },
  executive: {
    primaryColor: "#111827",
    fontFamily: "Times New Roman, Times, Georgia, serif",
    fontFamilyPdf: "Times-Roman",
    textColor: "#111827",
    fontSize: "10pt",
    lineHeight: "1.6",
    padding: "40px",
  }
};
