// app/admin/refresh/SubmitButton.tsx
"use client";
import { useFormStatus } from "react-dom";

export default function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 rounded-xl border shadow-sm disabled:opacity-50"
    >
      {pending ? "Refreshing…" : "Refresh Scores"}
    </button>
  );
}
