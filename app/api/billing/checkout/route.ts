import { NextResponse, type NextRequest } from "next/server";
import { getStripe, SEASON_PRICE_CENTS } from "@/lib/stripe";
import type { CheckoutMetadata } from "@/lib/billing";
import {
  getViewerId,
  isSeasonActive,
  recordTermsAccepted,
  requireGroupAdmin,
  type GroupContext,
} from "@/lib/group";
import { groupErrorResponse } from "@/lib/api";
import { getCurrentNfl } from "@/lib/server";

// Starts a $10 Stripe Checkout: { kind: "create", name } for a new group, or
// { kind: "renew", group: slug } for an admin renewing the current season.
export async function POST(req: NextRequest) {
  const userId = await getViewerId();
  if (!userId) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const season = String(
    (await getCurrentNfl()).season ?? new Date().getFullYear()
  );
  const origin = req.nextUrl.origin;

  let metadata: CheckoutMetadata;
  let description: string;
  let cancelUrl: string;

  if (body.kind === "create") {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 60) {
      return NextResponse.json(
        { error: "Group name must be 1–60 characters." },
        { status: 400 }
      );
    }
    if (body.agreed !== true) {
      return NextResponse.json(
        { error: "Please confirm you're 18 or older and agree to the Terms." },
        { status: 400 }
      );
    }
    await recordTermsAccepted(userId);
    metadata = { kind: "create", userId, groupName: name, season };
    description = `${name} · ${season} season`;
    cancelUrl = `${origin}/start`;
  } else if (body.kind === "renew") {
    let ctx: GroupContext;
    try {
      ctx = await requireGroupAdmin(body.group);
    } catch (error) {
      return groupErrorResponse(error);
    }
    if (await isSeasonActive(ctx.group.id, Number(season))) {
      return NextResponse.json(
        { error: `${ctx.group.name} is already active for ${season}.` },
        { status: 409 }
      );
    }
    metadata = { kind: "renew", userId, groupId: ctx.group.id, season };
    description = `${ctx.group.name} · ${season} season`;
    cancelUrl = `${origin}/g/${ctx.group.slug}/admin`;
  } else {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: SEASON_PRICE_CENTS,
            product_data: {
              name: "The Pick'em Club · NFL season",
              description,
            },
          },
        },
      ],
      client_reference_id: userId,
      // Labels these sessions in the Stripe Dashboard.
      integration_identifier: "pickem-season-qhtwmzrk",
      metadata,
      success_url: `${origin}/start/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Failed to create checkout session:", error);
    return NextResponse.json(
      { error: "Couldn't start checkout. Please try again." },
      { status: 500 }
    );
  }
}
