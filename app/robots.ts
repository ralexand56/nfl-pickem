import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Private group pages also send noindex; this keeps crawlers out of the
// API and site-owner tools entirely.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/admin/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
