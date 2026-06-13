import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Catch-all for any unmatched route under a locale (e.g. /en/does-not-exist).
 * Without this, Next.js falls back to its bare default 404 instead of the
 * branded app/[locale]/not-found.tsx. Calling notFound() here renders that
 * custom boundary inside the locale layout (navbar + footer + chrome).
 */
export default function CatchAllNotFound() {
  notFound();
}
