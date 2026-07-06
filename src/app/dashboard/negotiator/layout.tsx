import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Salary Negotiator",
};

export default function NegotiatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
