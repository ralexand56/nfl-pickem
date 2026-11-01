"use client";
import { useEffect } from "react";
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { ATTRIBUTION_COOKIE, classifySource } from "@/lib/attribution";

// Invite tokens and Stripe session ids grant access, so they never leave the
// browser in analytics events; group slugs are collapsed so private group
// names aren't collected either.
function redact(event: BeforeSendEvent): BeforeSendEvent {
  const url = new URL(event.url);
  url.pathname = url.pathname
    .replace(/^\/join\/[^/]+/, "/join/[token]")
    .replace(/^\/g\/[^/]+/, "/g/[group]");
  url.searchParams.delete("session_id");
  return { ...event, url: url.toString() };
}

// First-touch attribution: remember where a visitor originally came from
// (search engine, campaign, site or direct) so a later purchase can be
// credited to it. First-party, 90 days, never overwritten.
function captureFirstTouch() {
  if (document.cookie.split("; ").some((c) => c.startsWith(`${ATTRIBUTION_COOKIE}=`))) {
    return;
  }
  const params = new URLSearchParams(window.location.search);
  let referrerHost = "";
  try {
    referrerHost = document.referrer ? new URL(document.referrer).hostname : "";
  } catch {}
  // Internal navigation isn't a source.
  if (referrerHost === window.location.hostname) referrerHost = "";
  const source = classifySource({
    referrerHost,
    utmSource: params.get("utm_source"),
    utmMedium: params.get("utm_medium"),
    utmCampaign: params.get("utm_campaign"),
    landingPath: window.location.pathname.replace(/^\/join\/[^/]+/, "/join"),
  });
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${ATTRIBUTION_COOKIE}=${encodeURIComponent(
    JSON.stringify(source)
  )}; Max-Age=${60 * 60 * 24 * 90}; Path=/; SameSite=Lax${secure}`;
}

export default function SiteAnalytics() {
  useEffect(() => {
    captureFirstTouch();
  }, []);
  return <Analytics beforeSend={redact} />;
}
