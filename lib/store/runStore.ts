/**
 * In-memory store of orchestration runs.
 *
 * Lives on a single Vercel function instance — enough for a hackathon demo
 * where judges hit the endpoint a handful of times. A production version
 * would persist to Postgres/KV; the read/write surface here is intentionally
 * shaped so a swap is trivial (see the `RunStore` interface).
 *
 * Newest runs first. Capped so an idle deploy doesn't grow unbounded.
 */

import type { AllocationProposal, RiskSignal, WeeklyReport } from "@/lib/agents/types";
import type { FeedSnapshot } from "@/lib/data/feeds";

export type AgentStep = {
  agent: "AllocatorAgent" | "RiskAgent" | "ReporterAgent";
  startedAt: number; // ms epoch
  finishedAt: number; // ms epoch
  durationMs: number;
  reasoningHash: `0x${string}`;
};

export type DebateExchange = {
  attempt: number;
  vetoReason: string;
  level: "warn" | "trigger";
};

export type OrchestrationRun = {
  id: string;
  startedAt: number;
  finishedAt: number;
  feeds: FeedSnapshot;
  proposal: AllocationProposal;
  risk: RiskSignal;
  report: WeeklyReport;
  steps: AgentStep[];
  /** Empty if the first proposal was accepted; populated when Risk vetoed. */
  debate?: DebateExchange[];
  /** Total token cost rolled up across all agent steps. Optional for legacy runs. */
  totalCostCents?: number;
};

const MAX_RUNS = 50;

declare global {
  // eslint-disable-next-line no-var
  var __amanaRunStore: OrchestrationRun[] | undefined;
}

function backing(): OrchestrationRun[] {
  if (!globalThis.__amanaRunStore) globalThis.__amanaRunStore = [];
  return globalThis.__amanaRunStore;
}

export const runStore = {
  append(run: OrchestrationRun): void {
    const arr = backing();
    arr.unshift(run);
    if (arr.length > MAX_RUNS) arr.length = MAX_RUNS;
  },
  list(limit = 20): OrchestrationRun[] {
    return backing().slice(0, limit);
  },
  get(id: string): OrchestrationRun | undefined {
    return backing().find((r) => r.id === id);
  },
  size(): number {
    return backing().length;
  },
  /**
   * Compute aggregate metrics for the reports page — actual APY, +bps vs each
   * baseline, attestation count, last activity. Pulls from the in-memory log.
   */
  aggregate() {
    const runs = backing();
    if (runs.length === 0) {
      return null;
    }
    const latest = runs[0];
    const totalAttestations = runs.length * 3; // each run emits 3 agent events

    // Weighted-ish "actual APY" — use the most recent report's actualAPYBps.
    // The 3 baseline outperformance numbers come straight off the latest report.
    return {
      runCount: runs.length,
      totalAttestations,
      latest,
      actualAPYBps: latest.report.actualAPYBps,
      outperformanceBps: latest.report.outperformanceBps,
    };
  },
};
