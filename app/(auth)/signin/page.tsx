"use client";
import { signIn } from "next-auth/react";

export default function SignIn() {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="rounded-2xl p-8 shadow-xl max-w-sm w-full bg-white">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign in</h1>
        <button
          className="w-full rounded-xl py-3 mb-3 bg-black text-white"
          onClick={() => signIn("google", { callbackUrl: "/" })}
        >
          Continue with Google
        </button>
        <button
          className="w-full rounded-xl py-3 bg-[#4267B2] text-white"
          onClick={() => signIn("facebook", { callbackUrl: "/" })}
        >
          Continue with Facebook
        </button>
      </div>
    </div>
  );
}
