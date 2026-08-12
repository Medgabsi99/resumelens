import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ATS Score & Analysis",
  description:
    "Instantly score your resume against ATS systems, detect formatting issues, keyword gaps, and get actionable improvement suggestions.",
};

export default function ScannerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
