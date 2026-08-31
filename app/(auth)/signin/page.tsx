"use client";
import { signIn } from "next-auth/react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function SignIn() {
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
