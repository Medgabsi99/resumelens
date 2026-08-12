import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare Resumes",
  description:
    "Compare two resumes against the same job description to identify which positions you better and why.",
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
