import Link from "next/link";
import GroupRulesLink from "@/components/GroupRulesLink";

// Shown on every page. Signed-in members are normally sent from / straight
// to their group, so their "About" link adds ?home; everyone else (including
// search engines) gets plain /, so ?home never gets crawled as a duplicate.
const LINKS: [string, string][] = [
  ["/", "About The Pick’em Club"],
  ["/pick-sheets", "Free pick sheets"],
  ["/super-bowl-squares", "Squares guide"],
  ["/terms", "Terms"],
  ["/privacy", "Privacy"],
];

export default function SiteFooter({ signedIn }: { signedIn: boolean }) {
  return (
    <footer className="border-t border-border bg-surface print:hidden">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-text-muted">
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          <GroupRulesLink />
          {LINKS.map(([href, label]) => (
            <Link
              key={href}
              href={href === "/" && signedIn ? "/?home" : href}
              className="hover:underline"
            >
              {label}
            </Link>
          ))}
        </nav>
        <p>Not affiliated with the NFL.</p>
      </div>
    </footer>
  );
}
