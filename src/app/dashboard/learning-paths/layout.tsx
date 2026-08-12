import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learning Paths",
  description:
    "Get a personalized AI skill roadmap — identify gaps for your target role and get structured learning milestones to close them.",
};

export default function LearningPathsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
