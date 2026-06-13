/**
 * Store of orchestration runs.
 *
 * Backed by Upstash Redis (REST-based, serverless-safe) when
 * UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are present, so runs
 * created on one Vercel function instance are visible to every other instance
 * (and survive cold starts). When those env vars are absent it falls back to a
 * single-process in-memory global array, which keeps local dev and the
 * not-yet-provisioned state (and the test suite) working with zero config.
 *
 * Storage model: a single Redis list under one key. New runs are LPUSHed
 * (newest first) and the list is LTRIMmed to MAX_RUNS, mirroring the in-memory
 * unshift + cap exactly. @upstash/redis auto-serialises/deserialises the
 * OrchestrationRun objects as JSON; the type is all numbers/strings/nested
 * objects (no bigint), so round-tripping is lossless.
 *
 * Newest runs first. Capped so an idle deploy doesn't grow unbounded.
 */

import { Redis } from "@upstash/redis";
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
const REDIS_KEY = "amana:runs";

// ───────────────────────────────────────────────────────────
//  Backend selection — Redis if configured, else in-memory.
// ───────────────────────────────────────────────────────────

const redis: Redis | null =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

declare global {
  // eslint-disable-next-line no-var
  var __amanaRunStore: OrchestrationRun[] | undefined;
}

function backing(): OrchestrationRun[] {
  if (!globalThis.__amanaRunStore) globalThis.__amanaRunStore = [];
  return globalThis.__amanaRunStore;
}

/** Read the whole list (newest first) from whichever backend is active. */
async function readAll(): Promise<OrchestrationRun[]> {
  if (!redis) return backing();
  // lrange 0 -1 returns the full list, newest first (LPUSH order preserved).
  // @upstash/redis deserialises each JSON element back into an object.
  return (await redis.lrange<OrchestrationRun>(REDIS_KEY, 0, -1)) ?? [];
}

export const runStore = {
  async append(run: OrchestrationRun): Promise<void> {
    if (!redis) {
      const arr = backing();
      arr.unshift(run);
      if (arr.length > MAX_RUNS) arr.length = MAX_RUNS;
      return;
    }
    await redis.lpush(REDIS_KEY, run);
    await redis.ltrim(REDIS_KEY, 0, MAX_RUNS - 1);
  },
  async list(limit = 20): Promise<OrchestrationRun[]> {
    if (!redis) return backing().slice(0, limit);
    return (await redis.lrange<OrchestrationRun>(REDIS_KEY, 0, limit - 1)) ?? [];
  },
  async get(id: string): Promise<OrchestrationRun | undefined> {
    const runs = await readAll();
    return runs.find((r) => r.id === id);
  },
  async size(): Promise<number> {
    if (!redis) return backing().length;
    return await redis.llen(REDIS_KEY);
  },
  /**
   * Compute aggregate metrics for the reports page — actual APY, +bps vs each
   * baseline, attestation count, last activity.
   */
  async aggregate() {
    const runs = await readAll();
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
