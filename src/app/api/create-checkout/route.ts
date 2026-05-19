import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { stripe, PRICES } from "@/lib/stripe";
import { getUserProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { plan } = await req.json();
  if (!plan || !PRICES[plan as keyof typeof PRICES]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const priceConfig = PRICES[plan as keyof typeof PRICES];
  const profile = await getUserProfile(session.user.id);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  // ── Get or create Stripe customer ─────────────────────────
  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      metadata: { supabase_user_id: session.user.id },
    });
    customerId = customer.id;

    // Save customer ID to profile
    const admin = createAdminClient();
    await admin
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", session.user.id);
  }

  // ── Create checkout session ────────────────────────────────
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: priceConfig.mode,
    payment_method_types: ["card"],
    line_items: [{ price: priceConfig.id, quantity: 1 }],
    success_url: `${appUrl}/dashboard?upgraded=true`,
    cancel_url: `${appUrl}/pricing`,
    metadata: {
      supabase_user_id: session.user.id,
      plan,
    },
    // Pre-fill email
    customer_email: !customerId ? session.user.email : undefined,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
