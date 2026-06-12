/**
 * Locale-scoped loading state. Fires while the new route's data is
 * resolving — keeps the dissolve transition smooth on slower routes
 * (skills loads markdown from disk, agents/[slug] reads stats, etc).
 *
 * Intentionally minimal: a single pulsing violet dot. The dissolve grid
 * on top usually fully covers the page during this period anyway; this
 * is the safety net for direct navigation or hard refresh.
 */
export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="min-h-[60vh] flex items-center justify-center"
    >
      <span
        className="block w-3 h-3 rounded-full bg-[var(--color-primary)] pulse-soft"
        aria-label="Loading"
      />
    </main>
  );
}
