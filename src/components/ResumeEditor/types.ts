export interface ResumeVersion {
  id: string;
  version_name: string;
  resume_text: string;
  score: number | null;
  created_at: string;
}

export type TemplateId = "professional" | "modern" | "creative" | "minimal" | "executive";
