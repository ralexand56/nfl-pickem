import Card from "@/components/ui/Card";

export const metadata = {
  title: "Privacy Policy - Alexander NFL Pick'em",
};

export default function PrivacyPolicy() {
  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-text">Privacy Policy</h1>

      <Card className="space-y-4 text-text-muted">
        <p>
          Alexander NFL Pick&apos;em is a small, invite-only app for making
          weekly NFL picks with friends and family. This page explains what
          information the app collects and how it&apos;s used.
        </p>

        <section>
          <h2 className="font-semibold text-text mb-1">Information we collect</h2>
          <p>
            When you sign in with Google or Facebook, we receive your name,
            email address, and profile picture from that provider. We don&apos;t
            collect passwords - authentication is handled entirely by Google
            or Facebook.
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
          <h2 className="font-semibold text-text mb-1">Sharing</h2>
          <p>
            We don&apos;t sell or share your information with any third party.
            Your picks, tiebreaker guesses, and profile info are visible only
            to other signed-in players of this app.
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
