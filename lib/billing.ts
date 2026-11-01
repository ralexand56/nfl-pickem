// Turns a paid Stripe Checkout Session into a group (or a renewed season).
// Called from both the webhook and the success page, whichever runs first;
// the unique stripe_checkout_session_id makes the second call a no-op.
import "server-only";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { groupMembers, groupSeasons, groups, users } from "@/db/schema";
import { newInviteToken } from "@/lib/group";
import { NEW_GROUP_SETTINGS } from "@/lib/group-settings";
import { getStripe, SEASON_PRICE_CENTS } from "@/lib/stripe";
import { sendAutoRenewConfirmation } from "@/lib/email";
import { track } from "@vercel/analytics/server";

export type CheckoutMetadata =
  | { kind: "create"; userId: string; groupName: string; season: string }
  | { kind: "renew"; userId: string; groupId: string; season: string };

// When auto-renewal falls due for the season after `season`: Aug 15 at
// 10am Pacific, a few weeks before the NFL season starts.
export function renewalDate(season: number) {
  return new Date(Date.UTC(season + 1, 7, 15, 17));
}

const idOf = (v: string | { id: string } | null | undefined) =>
  typeof v === "string" ? v : (v?.id ?? null);

// First-touch fields the checkout route adds (see lib/attribution.ts).
type SourceMetadata = {
  src_source?: string;
  src_medium?: string;
  src_campaign?: string;
  src_landing?: string;
  src_at?: string;
};

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  // Random suffix: slugs are in URLs and must be unique across all groups.
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || "group"}-${suffix}`;
}

async function groupForSession(sessionId: string) {
  const [row] = await db
    .select({ slug: groups.slug })
    .from(groupSeasons)
    .innerJoin(groups, eq(groups.id, groupSeasons.groupId))
    .where(eq(groupSeasons.stripeCheckoutSessionId, sessionId));
  return row?.slug ?? null;
}

// Analytics only; never let it block fulfillment.
async function recordPurchase(
  kind: "create" | "renew",
  firstTouch: { source: string; medium: string } | null
) {
  await track("group_purchased", {
    kind,
    source: firstTouch?.source ?? "unknown",
    medium: firstTouch?.medium ?? "unknown",
  }).catch(() => {});
}

// Returns the group's slug, or null if the session isn't paid yet. With
// delayed payment methods checkout.session.completed arrives while still
// "unpaid"; async_payment_succeeded fulfills it later.
export async function fulfillCheckout(
  session: Stripe.Checkout.Session
): Promise<string | null> {
  if (session.payment_status === "unpaid") return null;
  // Auto-renew sessions bill the season up front alongside a free period
  // until the renewal date; never fulfill one that didn't actually charge.
  if (session.mode === "subscription" && (session.amount_total ?? 0) < SEASON_PRICE_CENTS) {
    throw new Error(`Subscription session ${session.id} charged nothing up front`);
  }

  const existing = await groupForSession(session.id);
  if (existing) return existing;

  const meta = session.metadata as (CheckoutMetadata & SourceMetadata) | null;
  const season = Number(meta?.season);
  if (!meta || !Number.isInteger(season)) {
    throw new Error(`Checkout session ${session.id} has no usable metadata`);
  }

  try {
    const firstTouch = meta.src_source
      ? {
          source: meta.src_source,
          medium: meta.src_medium ?? "",
          campaign: meta.src_campaign ?? "",
          landing: meta.src_landing ?? "",
          at: meta.src_at ?? "",
        }
      : null;

    const subscriptionId = session.mode === "subscription" ? idOf(session.subscription) : null;
    const renewsAt = subscriptionId ? renewalDate(season) : null;
    const autoRenewFields = subscriptionId
      ? {
          autoRenew: true,
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId: idOf(session.customer),
          renewsAt,
        }
      : {};

    if (meta.kind === "create") {
      const groupId = crypto.randomUUID();
      const slug = slugify(meta.groupName);
      // db.batch runs as one transaction on neon-http.
      await db.batch([
        db.insert(groups).values({
          id: groupId,
          slug,
          name: meta.groupName,
          inviteToken: newInviteToken(),
          settings: NEW_GROUP_SETTINGS,
          firstTouch,
          ...autoRenewFields,
          createdBy: meta.userId,
        }),
        db
          .insert(groupMembers)
          .values({ groupId, userId: meta.userId, role: "admin" }),
        db.insert(groupSeasons).values({
          groupId,
          season,
          status: "paid",
          stripeCheckoutSessionId: session.id,
        }),
      ]);
      await recordPurchase("create", firstTouch);
      if (renewsAt) await confirmAutoRenew(meta.userId, meta.groupName, slug, renewsAt);
      return slug;
    }

    await db
      .insert(groupSeasons)
      .values({
        groupId: meta.groupId,
        season,
        status: "paid",
        stripeCheckoutSessionId: session.id,
      })
      .onConflictDoNothing();
    await recordPurchase("renew", firstTouch);
    const [g] = await db
      .select({
        slug: groups.slug,
        name: groups.name,
        stripeSubscriptionId: groups.stripeSubscriptionId,
      })
      .from(groups)
      .where(eq(groups.id, meta.groupId));
    if (!g) return null;

    // A manual renewal after a failed automatic one: cancel the old
    // subscription so Stripe's retries can't charge them a second time.
    if (g.stripeSubscriptionId && g.stripeSubscriptionId !== subscriptionId) {
      await getStripe()
        .subscriptions.cancel(g.stripeSubscriptionId)
        .catch((e) => console.error("Failed to cancel replaced subscription", e));
    }
    await db
      .update(groups)
      .set(
        subscriptionId
          ? autoRenewFields
          : { autoRenew: false, stripeSubscriptionId: null, renewsAt: null }
      )
      .where(eq(groups.id, meta.groupId));
    if (renewsAt) await confirmAutoRenew(meta.userId, g.name, g.slug, renewsAt);
    return g.slug;
  } catch (error) {
    // Lost a race with the other caller: the session id is already recorded.
    const winner = await groupForSession(session.id);
    if (winner) return winner;
    throw error;
  }
}

// Email-only; a failure is logged, never thrown, so it can't undo a sale.
async function confirmAutoRenew(
  userId: string,
  groupName: string,
  groupSlug: string,
  renewsAt: Date
) {
  try {
    const [u] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId));
    if (u?.email) {
      await sendAutoRenewConfirmation({ to: u.email, groupName, groupSlug, renewsAt });
    }
  } catch (e) {
    console.error("Failed to send auto-renew confirmation", e);
  }
}

async function groupForSubscription(subscriptionId: string) {
  const [g] = await db
    .select({ id: groups.id })
    .from(groups)
    .where(eq(groups.stripeSubscriptionId, subscriptionId));
  return g ?? null;
}

// invoice.paid: an automatic renewal pays for the next season. The group
// is found through the invoice's subscription (Stripe's object graph), not
// metadata. The first invoice (billing_reason "subscription_create") is
// handled by fulfillCheckout.
export async function recordRenewalInvoice(invoice: Stripe.Invoice) {
  if (invoice.billing_reason === "subscription_create") return;
  if ((invoice.amount_paid ?? 0) < SEASON_PRICE_CENTS) return;
  const subscriptionId = idOf(invoice.parent?.subscription_details?.subscription);
  if (!subscriptionId || !invoice.id) return;
  const g = await groupForSubscription(subscriptionId);
  if (!g) {
    console.warn(`Renewal invoice ${invoice.id} for unknown subscription ${subscriptionId}`);
    return;
  }
  // Renewals fall due Aug 15, so the invoice's year is the season it buys.
  const season = new Date(invoice.created * 1000).getUTCFullYear();
  await db
    .insert(groupSeasons)
    .values({ groupId: g.id, season, status: "paid", stripeInvoiceId: invoice.id })
    .onConflictDoNothing();
  await db
    .update(groups)
    .set({ renewsAt: renewalDate(season) })
    .where(eq(groups.id, g.id));
  await recordPurchase("renew", null);
}

// customer.subscription.updated / .deleted: keep auto_renew in step with
// Stripe, including changes made in the Stripe Dashboard.
export async function syncSubscription(sub: Stripe.Subscription) {
  const g = await groupForSubscription(sub.id);
  if (!g) return;
  const ended = ["canceled", "incomplete_expired", "unpaid"].includes(sub.status);
  const nextCharge = sub.trial_end ?? sub.items.data[0]?.current_period_end ?? null;
  await db
    .update(groups)
    .set(
      ended
        ? { autoRenew: false, stripeSubscriptionId: null, renewsAt: null }
        : {
            autoRenew: !sub.cancel_at_period_end && !sub.cancel_at,
            renewsAt: nextCharge ? new Date(nextCharge * 1000) : null,
          }
    )
    .where(eq(groups.id, g.id));
}
