import type { Metadata } from "next";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { getAutoReminderPref } from "@/lib/reminder-prefs";
import { verifyReminderStopToken } from "@/lib/reminder-links";
import { setAutoRemindersAction } from "./actions";

export const metadata: Metadata = {
  title: "Automatic reminders",
  robots: { index: false, follow: false },
};

// Linked from automatic reminder emails. The signed link is enough; no sign-in.
// The change needs a button press, so link scanners can't opt anyone out.
export default async function StopRemindersPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const who = verifyReminderStopToken(t);
  const pref = who ? await getAutoReminderPref(who.groupId, who.userId) : null;

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <Card className="p-6">
        <h1 className="text-xl font-bold text-text mb-2">Automatic reminders</h1>
        {!pref ? (
          <p className="text-text-muted">
            This link isn’t valid anymore. If you still get reminders, ask your
            group’s admin.
          </p>
        ) : (
          <form action={setAutoRemindersAction} className="space-y-4">
            <input type="hidden" name="t" value={t} />
            <input type="hidden" name="on" value={pref.off ? "true" : "false"} />
            <p className="text-text">
              {pref.off
                ? `Automatic pick reminders for ${pref.groupName} are off.`
                : `You’re getting an automatic email before picks lock in ${pref.groupName} when you’ve started but haven’t finished.`}
            </p>
            <Button type="submit" variant={pref.off ? "secondary" : "primary"}>
              {pref.off ? "Turn them back on" : "Stop automatic reminders"}
            </Button>
            <p className="text-sm text-text-muted">
              Your group’s admin can still send you a reminder by hand.
            </p>
          </form>
        )}
      </Card>
    </div>
  );
}
