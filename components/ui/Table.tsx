import { clsx } from "clsx";
import type { HTMLAttributes, TableHTMLAttributes } from "react";

export function TableContainer({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("overflow-x-auto", className)} {...props} />;
}

export default function Table({
  className,
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table
      className={clsx("w-full border-separate border-spacing-y-2", className)}
      {...props}
    />
  );
}
