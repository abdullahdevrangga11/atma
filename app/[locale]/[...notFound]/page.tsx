import NotFound from "../not-found";

export const dynamic = "force-dynamic";

/**
 * Catch-all for any unmatched route under a locale (e.g. /en/does-not-exist).
 * With next-intl's middleware, calling notFound() here resolves to Next's bare
 * default 404 rather than the branded app/[locale]/not-found.tsx boundary, so
 * we render the branded component directly. It carries the navbar, footer, and
 * quick links so a bad URL stays on-brand instead of dropping to a black page.
 */
export default function CatchAllNotFound() {
  return <NotFound />;
}
