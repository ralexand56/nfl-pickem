// Turns a paid Stripe Checkout Session into a group (or a renewed season).
// Called from both the webhook and the success page, whichever runs first;
// the unique stripe_checkout_session_id makes the second call a no-op.
import "server-only";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { groupMembers, groupSeasons, groups } from "@/db/schema";
import { newInviteToken } from "@/lib/group";
import { NEW_GROUP_SETTINGS } from "@/lib/group-settings";
import { track } from "@vercel/analytics/server";

export type CheckoutMetadata =
  | { kind: "create"; userId: string; groupName: string; season: string }
  | { kind: "renew"; userId: string; groupId: string; season: string };

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
      .select({ slug: groups.slug })
      .from(groups)
      .where(eq(groups.id, meta.groupId));
    return g?.slug ?? null;
  } catch (error) {
    // Lost a race with the other caller: the session id is already recorded.
    const winner = await groupForSession(session.id);
    if (winner) return winner;
    throw error;
  }
}
