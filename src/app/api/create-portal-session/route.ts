import { requireUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getUserProfile } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const profile = await getUserProfile(user.id);

    if (!profile || !profile.stripe_customer_id) {
      return NextResponse.json(
        { error: "No active billing profile found. Upgrade first." },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${appUrl}/dashboard/settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err: any) {
    console.error("Portal session error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create portal session" },
      { status: 500 }
    );
  }
}
