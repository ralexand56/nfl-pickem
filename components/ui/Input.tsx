import { clsx } from "clsx";
import type { InputHTMLAttributes } from "react";

export default function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "rounded-control border border-border bg-surface px-3 py-2 text-text",
        "focus:outline-none focus:ring-2 focus:ring-brand-400",
        className
      )}
      {...props}
    />
  );
}
