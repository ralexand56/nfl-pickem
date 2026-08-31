"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    await signIn("email", { email, callbackUrl: "/", redirect: false });
    setSent(true);
  }

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-bg">
      <Card className="max-w-sm w-full p-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-text">Sign in</h1>
        <Button
          variant="primary"
          className="w-full py-3"
          onClick={() => signIn("google", { callbackUrl: "/" })}
        >
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 my-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-text-muted">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {sent ? (
          <p className="text-sm text-text-muted text-center">
            Check <span className="text-text font-medium">{email}</span> for a
            sign-in link.
          </p>
        ) : (
          <form onSubmit={sendMagicLink} className="space-y-3">
            <Input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
            />
            <Button type="submit" variant="outline" className="w-full py-3">
              Continue with Email
            </Button>
          </form>
        )}

        {/* Facebook login disabled - requires manually adding every user as
            a Tester or Business Verification to let the public log in.
            Re-enable in app/api/auth/[...nextauth]/route.ts if that changes.
        <Button
          className="w-full py-3 mt-3 bg-[#4267B2] text-white hover:opacity-90 border-transparent"
          onClick={() => signIn("facebook", { callbackUrl: "/" })}
        >
          Continue with Facebook
        </Button>
        */}
      </Card>
    </div>
  );
}
