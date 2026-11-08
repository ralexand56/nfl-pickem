"use server";

import { revalidatePath } from "next/cache";
import { setAutoReminders } from "@/lib/reminder-prefs";
import { verifyReminderStopToken } from "@/lib/reminder-links";

export async function setAutoRemindersAction(formData: FormData) {
  const who = verifyReminderStopToken(formData.get("t"));
  if (!who) throw new Error("This link isn't valid.");
  await setAutoReminders(who.groupId, who.userId, formData.get("on") === "true");
  revalidatePath("/reminders/stop");
}
