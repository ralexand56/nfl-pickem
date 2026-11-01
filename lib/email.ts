// Transactional email over the same SMTP server as the sign-in links
// (EMAIL_SERVER / EMAIL_FROM).
import "server-only";
import nodemailer from "nodemailer";
import { SITE_NAME, SITE_URL } from "@/lib/site";

let transport: nodemailer.Transporter | null = null;
function getTransport() {
  if (!process.env.EMAIL_SERVER) return null;
  transport ??= nodemailer.createTransport(process.env.EMAIL_SERVER);
  return transport;
}

async function send(to: string, subject: string, text: string) {
  const t = getTransport();
  if (!t) {
    console.warn(`EMAIL_SERVER not set; skipped "${subject}" to ${to}`);
    return;
  }
  await t.sendMail({ from: process.env.EMAIL_FROM, to, subject, text });
}

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Los_Angeles",
  });

// Sent right after someone opts in to auto-renewal (California's
// auto-renewal law requires this acknowledgment, with how to cancel).
export async function sendAutoRenewConfirmation(opts: {
  to: string;
  groupName: string;
  groupSlug: string;
  renewsAt: Date;
}) {
  await send(
    opts.to,
    `${SITE_NAME}: automatic renewal is on for ${opts.groupName}`,
    `Thanks for starting ${opts.groupName} on ${SITE_NAME}!

You chose to renew automatically each NFL season. Here's how it works:

- Your $10 payment today covers the current NFL season.
- On ${fmtDate(opts.renewsAt)}, and every year after that, we'll charge $10 to the same card for the next NFL season.
- We'll email you a reminder before each renewal.
- You can turn off automatic renewal any time, in one click, from your group's admin page:
  ${SITE_URL}/g/${opts.groupSlug}/admin
  Turning it off stops future charges; your current season stays active.

Questions or refunds: reply to this email or write to ralexand56@gmail.com.
Terms: ${SITE_URL}/terms
`
  );
}

// Sent 15–45 days before each automatic renewal.
export async function sendRenewalReminder(opts: {
  to: string;
  groupName: string;
  groupSlug: string;
  renewsAt: Date;
}) {
  await send(
    opts.to,
    `${SITE_NAME}: ${opts.groupName} renews on ${fmtDate(opts.renewsAt)}`,
    `Heads up: ${opts.groupName} is set to renew automatically for the next NFL season.

- On ${fmtDate(opts.renewsAt)} we'll charge $10 to the card on file.
- Nothing to do if you'd like to keep playing.
- To stop the renewal, turn off automatic renewal on your group's admin page before that date:
  ${SITE_URL}/g/${opts.groupSlug}/admin

Questions or refunds: write to ralexand56@gmail.com.
`
  );
}
