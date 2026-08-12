import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Your ResumeLens command centre — resume scores, application tracker, AI interview prep, and all career tools in one place.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
