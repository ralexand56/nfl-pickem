// Canonical public address, used for SEO metadata, the sitemap and
// structured data. Override per environment with NEXT_PUBLIC_SITE_URL.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://thepickemclub.com"
).replace(/\/$/, "");

export const SITE_NAME = "The Pick’em Club";
export const SITE_TAGLINE = "NFL Pick’em for Families & Friends";
export const SITE_DESCRIPTION =
  "Run a private NFL pick’em for your family or group: pick every NFL game, automatic scoring, a live leaderboard and Super Bowl squares. $10 per NFL season.";
