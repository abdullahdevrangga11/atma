/**
 * Skill marketplace store — in-memory, server-instance scoped.
 *
 * Mirrors the runStore shape: a singleton-per-process Map of published
 * SkillEntries. Seeded on first read with 5 opinionated example skills so
 * the marketplace is never empty for a fresh deployment.
 *
 * A production version persists to a real DB and surfaces author identity
 * via SIWE or Privy. For the hackathon this is enough to demonstrate the
 * "policy is forkable" thesis end-to-end.
 */

import { createHash } from "crypto";

export type SkillAgent = "allocator" | "risk" | "reporter";

export type SkillEntry = {
  id: string;
  agent: SkillAgent;
  title: string;
  /** One-line elevator pitch */
  tagline: string;
  /** Full markdown body */
  body: string;
  author: string;
  /** Created at, ms epoch */
  createdAt: number;
  /** ID of the skill this was forked from, if any */
  forkedFrom?: string;
  stars: number;
  forks: number;
  runCount: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __atmaMarketplace: Map<string, SkillEntry> | undefined;
  // eslint-disable-next-line no-var
  var __atmaMarketplaceSeeded: boolean | undefined;
}

function backing(): Map<string, SkillEntry> {
  if (!globalThis.__atmaMarketplace) {
    globalThis.__atmaMarketplace = new Map<string, SkillEntry>();
  }
  if (!globalThis.__atmaMarketplaceSeeded) {
    seedDefaults(globalThis.__atmaMarketplace);
    globalThis.__atmaMarketplaceSeeded = true;
  }
  return globalThis.__atmaMarketplace;
}

function mkId(input: string): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 12);
}

export const marketplaceStore = {
  list(filter?: { agent?: SkillAgent; sort?: "new" | "stars" | "forks" }): SkillEntry[] {
    const arr = Array.from(backing().values());
    const filtered = filter?.agent ? arr.filter((s) => s.agent === filter.agent) : arr;
    const sort = filter?.sort ?? "stars";
    if (sort === "new") filtered.sort((a, b) => b.createdAt - a.createdAt);
    else if (sort === "forks") filtered.sort((a, b) => b.forks - a.forks);
    else filtered.sort((a, b) => b.stars - a.stars);
    return filtered;
  },
  get(id: string): SkillEntry | undefined {
    return backing().get(id);
  },
  publish(input: Omit<SkillEntry, "id" | "createdAt" | "stars" | "forks" | "runCount">): SkillEntry {
    const id = mkId(`${input.author}:${input.title}:${Date.now()}:${Math.random()}`);
    const entry: SkillEntry = {
      ...input,
      id,
      createdAt: Date.now(),
      stars: 0,
      forks: 0,
      runCount: 0,
    };
    backing().set(id, entry);
    return entry;
  },
  star(id: string): SkillEntry | undefined {
    const e = backing().get(id);
    if (!e) return undefined;
    e.stars += 1;
    return e;
  },
  fork(id: string, by: string): SkillEntry | undefined {
    const parent = backing().get(id);
    if (!parent) return undefined;
    parent.forks += 1;
    const child = this.publish({
      agent: parent.agent,
      title: `${parent.title} (${by}'s fork)`,
      tagline: parent.tagline,
      body: parent.body,
      author: by,
      forkedFrom: parent.id,
    });
    return child;
  },
  count(): number {
    return backing().size;
  },
};

// ───────────────────────────────────────────────────────────
//  Seeds — 5 opinionated example skills
// ───────────────────────────────────────────────────────────

function seedDefaults(store: Map<string, SkillEntry>) {
  const now = Date.now();
  const seeds: Array<Omit<SkillEntry, "id" | "createdAt"> & { hoursAgo: number }> = [
    {
      agent: "allocator",
      title: "Sleep Easy",
      tagline: "Maximum liquidity floors, no MI4, conservative tilt.",
      body: SLEEP_EASY,
      author: "riskyfellow",
      stars: 42,
      forks: 7,
      runCount: 18,
      hoursAgo: 22,
    },
    {
      agent: "allocator",
      title: "USDY Maximalist",
      tagline: "Cap everything except USDY at 0. Ondo or bust.",
      body: USDY_MAXI,
      author: "yieldmaximalist",
      stars: 31,
      forks: 12,
      runCount: 24,
      hoursAgo: 14,
    },
    {
      agent: "allocator",
      title: "Wild West",
      tagline: "MI4 up to 50%. Aggressive caps. For believers.",
      body: WILD_WEST,
      author: "degenmode",
      stars: 28,
      forks: 18,
      runCount: 41,
      hoursAgo: 9,
    },
    {
      agent: "risk",
      title: "Defensive Eagle",
      tagline: "Trigger thresholds tightened 2x. Won't fly under storms.",
      body: DEFENSIVE_EAGLE,
      author: "paranoidhodler",
      stars: 19,
      forks: 4,
      runCount: 6,
      hoursAgo: 6,
    },
    {
      agent: "reporter",
      title: "Treasury Boardroom",
      tagline: "Executive-summary tone. Numbers up top, plain English below.",
      body: TREASURY_BOARDROOM,
      author: "atma-team",
      stars: 16,
      forks: 2,
      runCount: 11,
      hoursAgo: 3,
    },
  ];

  for (const s of seeds) {
    const id = mkId(`${s.author}:${s.title}:${s.hoursAgo}`);
    const { hoursAgo, ...entry } = s;
    store.set(id, {
      ...entry,
      id,
      createdAt: now - hoursAgo * 60 * 60 * 1000,
    });
  }
}

// ───────────────────────────────────────────────────────────
//  Pre-seeded skill bodies — opinionated policy markdown
// ───────────────────────────────────────────────────────────

const SLEEP_EASY = `# Sleep Easy — Conservative Allocator

For treasuries that prioritise capital preservation over yield.

## Constraints
- Hard maximum on MI4: **0 bps**. Never allocate to MI4.
- Hard maximum on Aave: **3000 bps**. Lender risk capped at 30%.
- Minimum liquid bps (USDY + mUSD): **6500**.
- Prefer USDY over mUSD when their APYs are within 20 bps.

## Decision priority
1. Honour all hard caps absolutely.
2. Bias toward higher liquidity scores in the liveAPYs payload.
3. If liveRiskSignals shows any \`warn\`, halve the affected asset's cap.
4. If any signal is \`trigger\`, exclude that asset entirely.

## Output
Standard AllocationProposal JSON. Reasoning must mention the chosen
liquid-bps floor and which asset(s) hit their cap.
`;

const USDY_MAXI = `# USDY Maximalist

The only asset that matters is USDY. Period.

## Strategy
- USDY cap: **9500 bps** (95% of treasury).
- Everything else (mUSD, Aave, MI4): **500 bps each maximum** but only
  invest in them if USDY itself signals \`warn\` or \`trigger\`.
- Never invest more than 500 bps total across mUSD + Aave + MI4 combined.

## Justification template for the reasoning field
> "USDY-Maximalist policy. Allocated [X] bps to USDY based on Ondo's
> on-chain APY. Reserved [Y] bps in [other asset] as redemption-queue
> insurance."

## Hard overrides
- If \`liveRiskSignals.usdyPeg === "trigger"\`: defensive exit, all assets
  liquidated to USDC. Do not redistribute.
`;

const WILD_WEST = `# Wild West — Aggressive Allocator

For treasuries hunting yield. Higher variance accepted.

## Constraints
- MI4 cap: **5000 bps**. Yes, fifty percent.
- USDY cap: **4000 bps**. USDY is the boring base.
- mUSD cap: **3000 bps**.
- Aave cap: **5000 bps**.
- Minimum liquid bps: **2000** (very low — we'll redeem if needed).

## Strategy
1. Always max MI4 if its yield exceeds Aave by > 150 bps.
2. Prefer USDY over mUSD when USDY APY is within 30 bps.
3. If any \`warn\` signal appears, reduce that asset's allocation to half
   of its cap, NOT zero. We tolerate risk.
4. Only \`trigger\` signals cause full exclusion.

## Reasoning field
Must include the MI4 yield premium calculation when MI4 > 1500 bps.
`;

const DEFENSIVE_EAGLE = `# Defensive Eagle — RiskAgent variant

For treasuries that want hair-trigger protection.

## Thresholds (override defaults — all tightened 2x)
- USDY peg deviation: **warn at 0.25%**, **trigger at 1%** (was 0.5% / 2%).
- mUSD peg deviation: **warn at 0.15%**, **trigger at 0.75%**.
- Aave oracle deviation: **warn at 0.25%**, **trigger at 1%**.
- Drawdown from entry NAV: **warn at 0.75%**, **trigger at 2.5%**.
- Liquidity score: **warn below 0.40**, **trigger below 0.15**.

## Composite rule
Composite level = the highest level across all signals. Single \`trigger\`
on any signal triggers a defensive exit — no quorum.

## Action mapping
- \`ok\` → action: "none"
- \`warn\` → action: "alert", trigger an off-chain notification
- \`trigger\` → action: "defensive_exit", immediate liquidation
`;

const TREASURY_BOARDROOM = `# Treasury Boardroom — ReporterAgent variant

Suitable for treasurer presentations to non-technical stakeholders.

## Reasoning style
- **Lead with the number**. First sentence states the actual APY in
  basis points, e.g. "Treasury annualized +427 bps this period."
- **Second sentence**: outperformance vs the strongest baseline.
- **Third sentence**: one thing that went well, one thing to flag.
- Avoid jargon like "rebase rate" or "drawdown" unless quoting from
  signals. Use plain treasurer English: "yield", "return", "loss buffer".

## Numeric formatting
- All APYs to 2 decimal places, %.
- All bps comparisons as +XXX or −XXX, no decimal.
- NAV values as dollar amounts with thousands separators.

## Forbidden in the reasoning field
- Em-dashes (use commas or parens instead).
- "Notably", "fundamentally", "robust" — these signal vague language.
- Words longer than 12 letters except for "outperformance".
`;
