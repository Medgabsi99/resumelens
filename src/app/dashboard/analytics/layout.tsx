import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics",
  description:
    "Track your resume performance over time — score trends, application funnel metrics, and career progress insights.",
};

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
