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

export type CheckoutMetadata =
  | { kind: "create"; userId: string; groupName: string; season: string }
  | { kind: "renew"; userId: string; groupId: string; season: string };

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

// Returns the group's slug, or null if the session isn't paid yet. With
// delayed payment methods checkout.session.completed arrives while still
// "unpaid"; async_payment_succeeded fulfills it later.
export async function fulfillCheckout(
  session: Stripe.Checkout.Session
): Promise<string | null> {
  if (session.payment_status === "unpaid") return null;

  const existing = await groupForSession(session.id);
  if (existing) return existing;

  const meta = session.metadata as CheckoutMetadata | null;
  const season = Number(meta?.season);
  if (!meta || !Number.isInteger(season)) {
    throw new Error(`Checkout session ${session.id} has no usable metadata`);
  }

  try {
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
