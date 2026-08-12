import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Manage your ResumeLens account, subscription, notification preferences, and profile information.",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
