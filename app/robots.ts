import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The API endpoints are not interesting to crawlers + they're rate-limited
        disallow: ["/api/"],
      },
    ],
    sitemap: "https://amana-iota.vercel.app/sitemap.xml",
    host: "https://amana-iota.vercel.app",
  };
}
