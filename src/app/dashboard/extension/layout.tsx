import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browser Extension",
  description:
    "Connect the ResumeLens browser extension to clip job listings, auto-match your resume, and generate tailored cover letters in one click.",
};

export default function ExtensionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
