import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { fulfillCheckout } from "@/lib/billing";

// Stripe -> us. Configure the endpoint in the Stripe dashboard for
// checkout.session.completed, checkout.session.async_payment_succeeded and
// checkout.session.async_payment_failed,
// and put its signing secret in STRIPE_WEBHOOK_SECRET.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "Not configured" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    // The signature covers the raw body, so read it as text, not JSON.
    event = getStripe().webhooks.constructEvent(await req.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    try {
      await fulfillCheckout(event.data.object);
    } catch (error) {
      console.error("Failed to fulfill checkout:", error);
      // Non-2xx makes Stripe retry later.
      return NextResponse.json({ error: "Fulfillment failed" }, { status: 500 });
    }
  }

  if (event.type === "checkout.session.async_payment_failed") {
    // Nothing was granted (fulfillment waits for a paid session); the buyer
    // can simply start checkout again.
    console.warn("Async payment failed for checkout session", event.data.object.id);
  }

  return NextResponse.json({ received: true });
}
