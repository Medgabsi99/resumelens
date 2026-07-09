import { logger } from "@/lib/logger";
import { requireUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { getUserProfile } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

export async function POST() {
  try {
    const _user = await requireUser();
    const profile = await getUserProfile(_user.id);

    // 1. Delete customer in Stripe (this cancels all active subscriptions automatically)
    if (profile?.stripe_customer_id) {
      try {
        await stripe.customers.del(profile.stripe_customer_id);
      } catch (stripeErr) {
        logger.error("Failed to delete Stripe customer:", stripeErr);
        // Continue deleting the auth user even if Stripe deletion fails
      }
    }

    // 2. Delete the user from Supabase Auth via the Admin client
    // Due to ON DELETE CASCADE on profiles/resumes/analyses tables, this will cascade and wipe all DB tables clean.
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(_user.id);

    if (error) {
      logger.error("Supabase Admin deleteUser error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    logger.error("Delete account API error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to delete account" },
      { status: 500 }
    );
  }
}
