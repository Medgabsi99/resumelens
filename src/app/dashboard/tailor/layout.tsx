import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Auto-Tailor Resume",
  description:
    "Automatically tailor your resume to any job description with AI — rewrites bullets, highlights matching skills, and boosts ATS score.",
};

export default function TailorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
