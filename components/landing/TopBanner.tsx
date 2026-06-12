"use client";

import { useState } from "react";

export function TopBanner() {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="top-banner relative">
      <div className="container-amana flex items-center justify-center gap-3 py-2.5 text-center">
        <p className="text-[13px]">
          <span className="font-medium">Introducing AMANA.</span>{" "}
          <span className="text-[var(--color-text-secondary)]">
            Treasury orchestration as a primitive on Mantle.
          </span>{" "}
          <a
            href="#cta"
            className="font-medium text-[var(--color-primary)] hover:underline inline-flex items-center gap-1"
          >
            Get started
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 5h8M5 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Dismiss"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
