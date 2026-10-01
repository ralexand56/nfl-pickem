"use client";
import type { ReactNode } from "react";
import { Toaster, toast } from "sonner";

// Thin wrapper around Sonner so call sites use one small API.
// Using the message as the id makes a repeated message replace the
// existing toast instead of stacking copies.
const api = {
  success: (message: string) => toast.success(message, { id: message, duration: 2500 }),
  error: (message: string) => toast.error(message, { id: message, duration: 5000 }),
};

export function useToast() {
  return api;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="top-center" richColors closeButton theme="system" visibleToasts={3} />
    </>
  );
}
