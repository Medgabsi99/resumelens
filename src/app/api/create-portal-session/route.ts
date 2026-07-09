import { logger } from "@/lib/logger";
import { requireUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getUserProfile } from "@/lib/auth";

export async function POST() {
  try {
    const _user = await requireUser();
    const profile = await getUserProfile(_user.id);

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
  } catch (err: unknown) {
    logger.error("Portal session error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to create portal session" },
      { status: 500 }
    );
  }
}
