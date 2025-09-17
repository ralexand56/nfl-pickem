// app/providers.tsx
"use client";

import { SessionProvider } from "next-auth/react"; // Or your custom context provider

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>; // Or your custom context provider
}
