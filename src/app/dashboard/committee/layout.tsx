import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recruiter Committee Review",
  description:
    "Simulate a full recruiter panel review — get structured feedback from a Technical Lead, HR Recruiter, and Hiring Manager AI personas.",
};

export default function CommitteeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
