// Signed "stop automatic reminders" links, so a member can opt out from the
// email without signing in. The signature is the only thing that proves the
// link is theirs.
import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { SITE_URL } from "@/lib/site";

function secret() {
  const s = process.env.PICK_REMINDER_SECRET;
  if (!s) throw new Error("PICK_REMINDER_SECRET is not set");
  return s;
}

function sign(groupId: string, userId: string) {
  return createHmac("sha256", secret())
    .update(`stop-auto-reminders:${groupId}:${userId}`)
    .digest("base64url");
}

export function reminderStopToken(groupId: string, userId: string) {
  return `${groupId}.${userId}.${sign(groupId, userId)}`;
}

export function reminderStopUrl(groupId: string, userId: string) {
  return `${SITE_URL}/reminders/stop?t=${reminderStopToken(groupId, userId)}`;
}

export function reminderOneClickUrl(groupId: string, userId: string) {
  return `${SITE_URL}/api/reminders/unsubscribe?t=${reminderStopToken(groupId, userId)}`;
}

export function verifyReminderStopToken(
  token: unknown
): { groupId: string; userId: string } | null {
  if (typeof token !== "string") return null;
  const [groupId, userId, sig] = token.split(".");
  if (!groupId || !userId || !sig) return null;
  const expected = Buffer.from(sign(groupId, userId));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return { groupId, userId };
}
