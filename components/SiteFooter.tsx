import Link from "next/link";

// Shown on every page. "About" links to the marketing home with ?home so
// signed-in members (who are normally sent straight to their group) can see it.
const LINKS: [string, string][] = [
  ["/?home", "About The Pick’em Club"],
  ["/pick-sheets", "Free pick sheets"],
  ["/super-bowl-squares", "Squares guide"],
  ["/terms", "Terms"],
  ["/privacy", "Privacy"],
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface print:hidden">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-text-muted">
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} className="hover:underline">
              {label}
            </Link>
          ))}
        </nav>
        <p>Not affiliated with the NFL.</p>
      </div>
    </footer>
  );
}
