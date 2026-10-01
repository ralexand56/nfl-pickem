// app/providers.tsx
"use client";

import { SessionProvider } from "next-auth/react"; // Or your custom context provider
import { ToastProvider } from "@/components/Toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>{children}</ToastProvider>
    </SessionProvider>
  );
}
