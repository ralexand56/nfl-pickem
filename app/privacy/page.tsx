import type { Metadata } from "next";
import Card from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPolicy() {
  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-text">Privacy Policy</h1>

      <Card className="space-y-4 text-text-muted">
        <p>
          The Pick&apos;em Club, operated by Rico Alexander, is an invite-only
          app that lets family and friends run a private weekly NFL pick&apos;em.
          This page explains what information the app collects and how it&apos;s
          used. Effective November 1, 2026.
        </p>

        <section>
          <h2 className="font-semibold text-text mb-1">Information we collect</h2>
          <p>
            When you sign in with Google, we receive your name, email address,
            and profile picture from Google. If you sign in with an email link,
            we store only your email address. We don&apos;t collect passwords.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-text mb-1">Payments</h2>
          <p>
            Group admins pay the season fee through Stripe. Your card details go
            directly to Stripe and never reach our servers; we only keep a record
            that the payment for your group&apos;s season was completed. The app
            does not process buy-ins or pots between members. It only records
            whether a member says they paid and how.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-text mb-1">How we use it</h2>
          <p>
            Your name and picture are shown next to your weekly picks and on
            the leaderboard so other players can see who picked what. Your
            email is used only to identify your account.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-text mb-1">Analytics and cookies</h2>
          <p>
            We use Vercel Web Analytics to count page visits and see which sites
            and search engines send visitors to us. It doesn&apos;t use cookies or
            track you across other websites, and we remove invite links and group
            names from what it records. We also set one first-party cookie,
            kept for 90 days, that remembers how you first found us (for example
            &quot;Google search&quot;). If you start a group, that source is saved
            with your purchase so we know which channels work. We don&apos;t sell
            this information or use it for advertising.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-text mb-1">Sharing</h2>
          <p>
            We don&apos;t sell or share your information with any third party.
            Your picks, tiebreaker guesses, payment status, and profile info
            are visible only to the other members of the groups you join. Group
            admins can also see members&apos; email addresses.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-text mb-1">Data deletion</h2>
          <p>
            To have your account and data removed, contact the app owner at{" "}
            <a href="mailto:ralexand56@gmail.com" className="text-brand-600 hover:underline">
              ralexand56@gmail.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-text mb-1">Contact</h2>
          <p>
            Questions about this policy or the app can be sent to{" "}
            <a href="mailto:ralexand56@gmail.com" className="text-brand-600 hover:underline">
              ralexand56@gmail.com
            </a>
            .
          </p>
        </section>
      </Card>
    </main>
  );
}
