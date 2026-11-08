import { NextResponse } from "next/server";
import { setAutoReminders } from "@/lib/reminder-prefs";
import { verifyReminderStopToken } from "@/lib/reminder-links";

// One-click unsubscribe (RFC 8058) from the email's List-Unsubscribe header.
// POST only: mail scanners follow links with GET, which must not unsubscribe.
export async function POST(req: Request) {
  const who = verifyReminderStopToken(new URL(req.url).searchParams.get("t"));
  if (!who) return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  await setAutoReminders(who.groupId, who.userId, false);
  return NextResponse.json({ ok: true });
}
