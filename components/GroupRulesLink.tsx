"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The footer is shared by every page; inside a group it also links to that
// group's rules.
export default function GroupRulesLink() {
  const slug = usePathname()?.match(/^\/g\/([^/]+)/)?.[1];
  if (!slug) return null;
  return (
    <Link href={`/g/${slug}/rules`} className="font-medium text-text hover:underline">
      Group rules
    </Link>
  );
}
