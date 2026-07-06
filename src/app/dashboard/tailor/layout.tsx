import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Auto-Tailor Resume",
};

export default function TailorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
