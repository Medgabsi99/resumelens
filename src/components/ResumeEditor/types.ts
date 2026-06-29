export interface ResumeVersion {
  id: string;
  version_name: string;
  resume_text: string;
  score: number | null;
  created_at: string;
}

export type TemplateId = "professional" | "modern" | "creative" | "minimal" | "executive";

export interface ResumeCustomStyle {
  fontFamily: "serif" | "sans" | "mono";
  fontSize: "10pt" | "10.5pt" | "11pt" | "12pt";
  lineHeight: "1.4" | "1.5" | "1.6" | "1.7";
  padding: "36px 32px" | "56px 48px" | "76px 64px";
  primaryColor: string;
}
