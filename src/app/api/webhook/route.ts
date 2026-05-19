import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase";
import { PLAN_LIMITS } from "@/lib/stripe";
import Stripe from "stripe";

// Required: raw body for Stripe signature verification
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook error";
    console.error("Stripe webhook error:", message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  const admin = createAdminClient();

  // ── Handle events ─────────────────────────────────────────
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.CheckoutSession;
      const userId = session.metadata?.supabase_user_id;
      const plan = session.metadata?.plan as "one_time" | "monthly";

      if (!userId || !plan) break;

      await admin.from("profiles").update({
        plan,
        analyses_limit: PLAN_LIMITS[plan],
        analyses_used: 0, // reset counter on upgrade
      }).eq("id", userId);

      console.log(`✓ Upgraded user ${userId} to ${plan}`);
      break;
    }

    case "customer.subscription.deleted": {
      // Subscription cancelled — downgrade to free
      const subscription = event.data.object as Stripe.Subscription;
      const customer = await stripe.customers.retrieve(
        subscription.customer as string
      ) as Stripe.Customer;
      const userId = customer.metadata?.supabase_user_id;

      if (!userId) break;

      await admin.from("profiles").update({
        plan: "free",
        analyses_limit: PLAN_LIMITS.free,
      }).eq("id", userId);

      console.log(`✓ Downgraded user ${userId} to free (subscription cancelled)`);
      break;
    }

    case "invoice.payment_failed": {
      // Optionally email user about failed payment
      const invoice = event.data.object as Stripe.Invoice;
      console.warn(`Payment failed for customer ${invoice.customer}`);
      break;
    }

    default:
      // Ignore other events
      break;
  }

  return NextResponse.json({ received: true });
}
