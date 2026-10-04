import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// /admin is deliberately not named here (it is unlinked and sends X-Robots-Tag: noindex itself).
export default function robots(): MetadataRoute.Robots {
  const base = site.url.replace(/\/$/, "");
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
