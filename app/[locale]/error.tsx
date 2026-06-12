"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Locale-scoped error boundary. Triggered when a server component throws
 * or a client component error bubbles up past its local boundary. Keep it
 * minimal and on-brand so judges hitting a transient error during the demo
 * see a controlled recovery surface, not a stack trace.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface in the browser console for triaging
    console.error("[ATMA error boundary]", error);
  }, [error]);

  return (
    <main className="min-h-[100svh] flex items-center justify-center px-6">
      <div className="max-w-[560px] text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-5">
          // error · something went sideways
        </p>
        <h1 className="display-3 mb-5 leading-[1.05]">
          Caught it before you did.
        </h1>
        <p className="text-[15px] text-[var(--color-text-secondary)] max-w-[480px] mx-auto mb-2 leading-relaxed">
          A component threw mid-render. The orchestrator, vault, and run store are unaffected.
        </p>
        {error.digest && (
          <p className="font-mono text-[11px] text-[var(--color-text-muted)] mb-10">
            digest: <span className="text-[var(--color-text)]">{error.digest}</span>
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 h-11 rounded-full bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors text-[14px] font-medium"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M3 6.5a3.5 3.5 0 1 0 1-2.5M3 1v3h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 h-11 rounded-full bg-white border border-[var(--color-border-strong)] hover:border-[var(--color-text)] hover:bg-[var(--color-bg-soft)] transition-colors text-[14px] font-medium"
          >
            Back to landing
          </Link>
        </div>
      </div>
    </main>
  );
}
