import { clsx } from "clsx";
import type { HTMLAttributes } from "react";

type Tone = "neutral" | "success" | "danger" | "warning" | "brand";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-surface-muted text-text-muted",
  success: "bg-success-muted text-success",
  danger: "bg-danger-muted text-danger",
  warning: "bg-warning-muted text-warning",
  brand: "bg-brand-100 text-brand-700",
};

export default function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        TONE_CLASSES[tone],
        className
      )}
      {...props}
    />
  );
}
