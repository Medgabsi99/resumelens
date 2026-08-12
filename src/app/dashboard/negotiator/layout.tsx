import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Salary Negotiator",
  description:
    "Generate AI-powered salary negotiation scripts, counter-offer emails, and compensation strategy based on market data and your offer details.",
};

export default function NegotiatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
