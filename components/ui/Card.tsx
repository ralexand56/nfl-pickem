import { clsx } from "clsx";
import type { HTMLAttributes } from "react";

export default function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-card border border-border bg-surface shadow-card p-4",
        className
      )}
      {...props}
    />
  );
}
