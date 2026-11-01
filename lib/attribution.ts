// Where a visitor first came from. Client-safe: set by SiteAnalytics in the
// browser, read by the checkout route and attached to the Stripe session.

export const ATTRIBUTION_COOKIE = "pc_src";

export type FirstTouch = {
  source: string; // "google", "bing", a utm_source, a referring site, or "direct"
  medium: string; // "organic", "referral", a utm_medium, or "none"
  campaign: string;
  landing: string; // first page they landed on
  at: string; // ISO date of the first visit
};

const SEARCH_ENGINES: [RegExp, string][] = [
  [/(^|\.)google\./, "google"],
  [/(^|\.)bing\.com$/, "bing"],
  [/(^|\.)duckduckgo\.com$/, "duckduckgo"],
  [/(^|\.)yahoo\./, "yahoo"],
  [/(^|\.)search\.brave\.com$/, "brave"],
  [/(^|\.)ecosia\.org$/, "ecosia"],
];

const clip = (v: string | null | undefined, n = 80) => (v ?? "").slice(0, n);

export function classifySource(input: {
  referrerHost: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  landingPath: string;
}): FirstTouch {
  const base = { campaign: clip(input.utmCampaign), landing: clip(input.landingPath), at: new Date().toISOString() };
  if (input.utmSource) {
    return { ...base, source: clip(input.utmSource), medium: clip(input.utmMedium) || "campaign" };
  }
  const engine = SEARCH_ENGINES.find(([re]) => re.test(input.referrerHost));
  if (engine) return { ...base, source: engine[1], medium: "organic" };
  if (input.referrerHost) return { ...base, source: clip(input.referrerHost), medium: "referral" };
  return { ...base, source: "direct", medium: "none" };
}

// Parses the cookie value; anything malformed is treated as unknown.
export function parseFirstTouch(raw: string | undefined): FirstTouch | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(decodeURIComponent(raw));
    if (typeof v?.source !== "string") return null;
    return {
      source: clip(v.source),
      medium: clip(v.medium),
      campaign: clip(v.campaign),
      landing: clip(v.landing),
      at: clip(v.at, 30),
    };
  } catch {
    return null;
  }
}
