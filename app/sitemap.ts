import type { MetadataRoute } from "next";

const BASE = "https://atma-iota.vercel.app";
const LOCALES = ["en", "id"] as const;
const AGENT_SLUGS = ["allocator", "risk", "reporter"] as const;
const ROUTES = [
  "",
  "/vault",
  "/backtest",
  "/compare",
  "/anomaly",
  "/ab-test",
  "/skills",
  "/reports",
  "/network",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Cross-product locales × static routes
  const staticEntries: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    ROUTES.map((route) => ({
      url: `${BASE}/${locale}${route}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.7,
    })),
  );

  // Locales × agent profile pages
  const agentEntries: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    AGENT_SLUGS.map((slug) => ({
      url: `${BASE}/${locale}/agents/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  );

  return [...staticEntries, ...agentEntries];
}
