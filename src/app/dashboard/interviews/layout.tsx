import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mock Interview Workspace",
};

export default function InterviewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
