import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hiring Committee Simulator",
};

export default function CommitteeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
