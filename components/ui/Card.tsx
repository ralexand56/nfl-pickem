import { clsx } from "clsx";
import type { HTMLAttributes } from "react";

// Tailwind doesn't let a later class win over an earlier one of the same kind,
// so the defaults step aside when the caller sets its own background, border
// color or padding (e.g. the dark call-to-action cards).
const has = (className: string | undefined, pattern: RegExp) =>
  !!className && pattern.test(className);

export default function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-card border shadow-card",
        !has(className, /(^|\s)bg-/) && "bg-surface",
        !has(className, /(^|\s)border-[a-z]/) && "border-border",
        !has(className, /(^|\s)p-\d/) && "p-4",
        className
      )}
      {...props}
    />
  );
}
