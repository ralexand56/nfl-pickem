import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { fulfillCheckout, recordRenewalInvoice, syncSubscription } from "@/lib/billing";

// Stripe -> us. Configure the endpoint in the Stripe dashboard for:
//   checkout.session.completed, checkout.session.async_payment_succeeded,
//   checkout.session.async_payment_failed,
//   invoice.paid, invoice.payment_failed,
//   customer.subscription.updated, customer.subscription.deleted,
//   charge.refunded, charge.dispute.created, radar.early_fraud_warning.created
//
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

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await fulfillCheckout(event.data.object);
        break;
      // Automatic renewals pay for the next season.
      case "invoice.paid":
        await recordRenewalInvoice(event.data.object);
        break;
      // Stripe retries and emails the customer to update their card; the
      // season stays unpaid (members see the renew banner) until it succeeds.
      case "invoice.payment_failed":
        console.warn("Renewal payment failed for invoice", event.data.object.id);
        break;
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object);
        break;
      // Money moving back: nothing to undo automatically, but these need a
      // human look (and a reply to any dispute in the Stripe Dashboard).
      case "charge.refunded":
      case "charge.dispute.created":
      case "radar.early_fraud_warning.created":
        console.warn(`Stripe ${event.type}:`, event.data.object.id);
        break;
    }
  } catch (error) {
    console.error(`Failed to handle ${event.type}:`, error);
    // Non-2xx makes Stripe retry later.
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  if (event.type === "checkout.session.async_payment_failed") {
    // Nothing was granted (fulfillment waits for a paid session); the buyer
    // can simply start checkout again.
    console.warn("Async payment failed for checkout session", event.data.object.id);
  }

  return NextResponse.json({ received: true });
}
