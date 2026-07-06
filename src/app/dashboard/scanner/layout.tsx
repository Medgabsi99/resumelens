import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ATS Score & Analysis",
};

export default function ScannerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
