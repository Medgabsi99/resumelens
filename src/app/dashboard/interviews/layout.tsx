import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mock Interview Simulator",
  description:
    "Practice real interview questions with AI — get instant feedback on your answers, confidence level, and areas to improve.",
};

export default function InterviewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
