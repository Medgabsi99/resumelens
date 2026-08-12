import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "A/B Resume Testing",
  description:
    "Compare two versions of your resume side-by-side with AI scoring to discover which performs better for your target role.",
};

export default function AbTestingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
