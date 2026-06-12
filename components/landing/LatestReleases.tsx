"use client";

import Link from "next/link";
import { Reveal, Up, WordMask } from "@/components/animations/Reveal";
import { cn } from "@/lib/utils/cn";

/**
 * Build log laid out as a bento — one featured "latest" tile on the left
 * spanning two rows, and a tight monospace changelog of older entries on
 * the right. Reuses the page's neutral / violet palette so it sits next
 * to the agent + diagram sections instead of fighting them.
 */

type LogEntry = {
  /** ISO date used for sorting + display */
  date: string;
  /** Commit-style short hash for flavour */
  sha: string;
  /** Conventional-commit-style category */
  kind: "feat" | "fix" | "chore" | "refactor" | "docs";
  /** Imperative title */
  title: string;
  /** Longer body — shown on featured + as a tagline on the compact list */
  body: string;
  /** Optional: prebuilt diff stats `+xxx / -yyy` */
  stats?: { added: number; removed: number };
  /** Where this entry links to */
  href: string;
};

const ENTRIES: LogEntry[] = [
  {
    date: "2026-06-11",
    sha: "a700794",
    kind: "feat",
    title: "Token-streaming Claude + agent debate loop",
    body: "Allocator → Risk → Reporter chain now streams Claude's reasoning per agent. When Risk vetoes, Allocator re-drafts with the veto baked into its system prompt. The vault state machine animates through 11 states live.",
    stats: { added: 1297, removed: 621 },
    href: "/vault",
  },
  {
    date: "2026-06-11",
    sha: "57ce667",
    kind: "feat",
    title: "Agent identity profiles + anomaly playground + showdown",
    body: "Each agent gets a /agents/[slug] identity page with ERC-8004 capsule. Anomaly playground stress-tests RiskAgent. Compare runs 3 policies in parallel.",
    stats: { added: 1518, removed: 1 },
    href: "/agents/allocator",
  },
  {
    date: "2026-06-11",
    sha: "83ae7f1",
    kind: "feat",
    title: "Backtest sandbox + system prompt inspector",
    body: "Replay 2-12 weeks of orchestration with live Claude reasoning. /skills page exposes the exact bytes sent to the model.",
    stats: { added: 1255, removed: 41 },
    href: "/backtest",
  },
  {
    date: "2026-06-10",
    sha: "a07963a",
    kind: "feat",
    title: "Orchestrator engine + SSE streaming + run store",
    body: "Single endpoint runs all three agents in sequence. Server-sent events expose each step as it lands. Real attestation history powers /reports.",
    stats: { added: 1815, removed: 320 },
    href: "/reports",
  },
  {
    date: "2026-06-10",
    sha: "f981216",
    kind: "refactor",
    title: "HeroShowcase rewritten on GSAP",
    body: "Single master timeline orchestrates the cascade. Zero React re-renders during the 1.6s reveal. shimmer-wipe + chip-slide-in + card-lift live in code, not CSS.",
    stats: { added: 321, removed: 344 },
    href: "/",
  },
];

const KIND_META: Record<
  LogEntry["kind"],
  { label: string; bg: string; fg: string }
> = {
  feat:     { label: "feat",     bg: "#ede9fe", fg: "#5b3df0" },
  fix:      { label: "fix",      bg: "#fee2e2", fg: "#b91c1c" },
  chore:    { label: "chore",    bg: "#f4f4f4", fg: "#5e5e5e" },
  refactor: { label: "refactor", bg: "#ecfccb", fg: "#3f6212" },
  docs:     { label: "docs",     bg: "#fef9c3", fg: "#854d0e" },
};

export function LatestReleases() {
  const [featured, ...rest] = ENTRIES;

  return (
    <section className="section bg-[var(--color-bg)]">
      <div className="container-atma">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-3">
                // build log
              </p>
              <h2 className="display-3 font-medium max-w-[560px]">
                <WordMask text="Shipped, not slidewared." staggerMs={70} />
              </h2>
            </div>
            <Up delay={400}>
              <Link
                href="https://github.com/abdullahdevrangga11/atma/commits/master"
                target="_blank"
                rel="noreferrer"
                className="btn-outline whitespace-nowrap inline-flex items-center gap-2"
              >
                Full git history
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 9l6-6M9 3H4M9 3v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </Up>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Featured entry — left, tall, full content. Col-span lives on
                this wrapper because Up clones its single child and merges
                className onto the child element, not its own wrapper. */}
            <div className="lg:col-span-7">
              <Up delay={300}>
                <FeaturedCard entry={featured} />
              </Up>
            </div>

            {/* Right column — compact ledger of older entries */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              {rest.map((e, i) => (
                <Up key={e.sha} delay={420 + i * 100}>
                  <CompactRow entry={e} />
                </Up>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ───────────────────────────────────────────────────────────
//  Featured card
// ───────────────────────────────────────────────────────────

function FeaturedCard({ entry }: { entry: LogEntry }) {
  const k = KIND_META[entry.kind];
  return (
    <Link
      href={entry.href}
      className={cn(
        "group block h-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card-soft)]",
        "p-7 md:p-9 transition-all duration-300",
        "hover:bg-white hover:border-[var(--color-border-strong)] hover:shadow-[0_18px_56px_-20px_rgba(91,61,240,0.15)]",
      )}
    >
      {/* Eyebrow row — sha, kind, date */}
      <div className="flex items-center gap-3 mb-7">
        <span
          className="font-mono text-[10px] uppercase tracking-[0.08em] px-2 py-0.5 rounded"
          style={{ background: k.bg, color: k.fg }}
        >
          {k.label}
        </span>
        <span className="font-mono text-[11px] text-[var(--color-text-muted)]">
          {entry.sha}
        </span>
        <span className="font-mono text-[11px] text-[var(--color-text-muted)] ml-auto">
          {entry.date}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-[24px] md:text-[28px] font-medium text-[var(--color-text)] leading-[1.18] tracking-[-0.01em] mb-4">
        {entry.title}
      </h3>

      {/* Body */}
      <p className="text-[14px] md:text-[15px] text-[var(--color-text-secondary)] leading-relaxed mb-7 max-w-[520px]">
        {entry.body}
      </p>

      {/* Diff stat strip — rendered as a real "changes" bar so it reads as a code-review chip */}
      {entry.stats && (
        <div className="flex items-center gap-3 mb-7">
          <DiffBar stats={entry.stats} />
          <span className="font-mono text-[11px] text-[var(--color-text-muted)]">
            +{entry.stats.added.toLocaleString()} / −{entry.stats.removed.toLocaleString()}
          </span>
        </div>
      )}

      {/* Footer — synthesised file paths that read like a commit touched list */}
      <div className="pt-5 border-t border-[var(--color-border)] flex flex-wrap gap-x-4 gap-y-2">
        {[
          "lib/agents/Orchestrator.ts",
          "app/api/orchestrate/stream/route.ts",
          "components/vault/VaultDemo.tsx",
        ].map((path) => (
          <span
            key={path}
            className="font-mono text-[10.5px] text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors"
          >
            {path}
          </span>
        ))}
      </div>
    </Link>
  );
}

function DiffBar({ stats }: { stats: { added: number; removed: number } }) {
  const total = stats.added + stats.removed;
  const greenPct = (stats.added / total) * 100;
  return (
    <div className="flex h-1.5 w-[120px] rounded-full overflow-hidden bg-[var(--color-bg-soft)]">
      <span style={{ width: `${greenPct}%`, background: "#84cc16" }} />
      <span style={{ width: `${100 - greenPct}%`, background: "#dc2626" }} />
    </div>
  );
}

// ───────────────────────────────────────────────────────────
//  Compact row in the right ledger
// ───────────────────────────────────────────────────────────

function CompactRow({ entry }: { entry: LogEntry }) {
  const k = KIND_META[entry.kind];
  return (
    <Link
      href={entry.href}
      className={cn(
        "group block rounded-xl border border-[var(--color-border)] bg-white",
        "px-5 py-4 transition-all duration-200",
        "hover:bg-[var(--color-primary-tint)] hover:border-[var(--color-primary-edge)]",
      )}
    >
      <div className="flex items-center gap-3 mb-2">
        <span
          className="font-mono text-[9px] uppercase tracking-[0.08em] px-1.5 py-0.5 rounded"
          style={{ background: k.bg, color: k.fg }}
        >
          {k.label}
        </span>
        <span className="font-mono text-[10px] text-[var(--color-text-muted)]">
          {entry.sha}
        </span>
        <span className="font-mono text-[10px] text-[var(--color-text-muted)] ml-auto">
          {entry.date}
        </span>
      </div>
      <p className="text-[14px] font-medium text-[var(--color-text)] mb-1 leading-snug group-hover:text-[var(--color-primary)] transition-colors">
        {entry.title}
      </p>
      <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">
        {entry.body}
      </p>
    </Link>
  );
}
