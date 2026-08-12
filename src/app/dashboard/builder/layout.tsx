import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resume Builder",
  description:
    "Build a professionally formatted resume with AI-powered live preview. Choose from multiple templates and export to PDF instantly.",
};

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
