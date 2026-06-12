import type { Metadata } from "next";

const BASE = "https://atma-iota.vercel.app";

type PageMetaInput = {
  title: string;
  description: string;
  /** Path without locale prefix, e.g. "/vault". Used for canonical + og.url */
  path: string;
};

/**
 * Builds consistent per-page Metadata. Locale layout supplies the
 * site-wide defaults (metadataBase, twitter handle, OG image fallback,
 * etc); this just overrides what's unique per route.
 */
export function pageMetadata({ title, description, path }: PageMetaInput): Metadata {
  const url = `${BASE}${path}`;
  return {
    title,
    description,
    openGraph: {
      title: `${title} · AMANA`,
      description,
      url,
      type: "website",
      siteName: "AMANA",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · AMANA`,
      description,
      creator: "@abdullahdevrang",
    },
    alternates: {
      canonical: url,
    },
  };
}
