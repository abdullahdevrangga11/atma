/**
 * Simulated live market feeds for the ATMA demo.
 *
 * Real ATMA would read these from Aave Mantle pool data, Ondo's USDY oracle,
 * Mantle's mUSD rebase events, and Mantle Index Four's NAV endpoint. For the
 * hackathon demo we synthesise them from time-seeded noise so the agents see
 * different numbers on every invocation and judges can refresh the page to
 * trigger a fresh reasoning pass.
 *
 * Each value drifts smoothly across a configurable window — never spikes —
 * so the proposals tell a consistent story across an evaluator session.
 */

import type { LiveAPYs, LiveRiskSignals } from "@/lib/agents/types";

/** Deterministic sin-based pseudo-noise in [-1, 1]. */
function noise(seed: number, freq: number, phase: number): number {
  return Math.sin(seed * freq + phase);
}

/** Time in minutes since epoch — feeds drift on this clock. */
function nowMin(): number {
  return Math.floor(Date.now() / 60_000);
}

/**
 * Read a historical snapshot by offset (weeks into the past).
 * Used by the backtest endpoint so each week's orchestration sees a
 * believably different market state. weeksAgo=0 ≡ readFeeds().
 */
export function readHistoricalFeeds(weeksAgo: number): FeedSnapshot {
  const t = nowMin() - weeksAgo * 7 * 24 * 60;
  return snapshotFromMin(t);
}

function snapshotFromMin(t: number): FeedSnapshot {
  const usdy = clamp(0.0442 + noise(t, 0.03, 1.1) * 0.0009, 0.040, 0.048);
  const mUsd = clamp(0.0460 + noise(t, 0.05, 2.4) * 0.0014, 0.040, 0.052);
  const aave = clamp(0.0518 + noise(t, 0.11, 0.7) * 0.0048, 0.038, 0.072);
  const mi4 = clamp(0.0810 + noise(t, 0.07, 3.3) * 0.0260, 0.020, 0.140);

  const aaveOraclePrice = clamp(1.0 + noise(t, 0.19, 1.7) * 0.006, 0.985, 1.015);
  const mUsdPrice = clamp(1.0 + noise(t, 0.13, 0.4) * 0.003, 0.992, 1.008);
  const usdyPrice = clamp(1.0 + noise(t, 0.08, 2.2) * 0.002, 0.994, 1.006);

  const risk: LiveRiskSignals = {
    usdyPeg: bandToLevel(Math.abs(usdyPrice - 1), 0.005, 0.02),
    mUsdPeg: bandToLevel(Math.abs(mUsdPrice - 1), 0.003, 0.015),
    aaveOracle: bandToLevel(Math.abs(aaveOraclePrice - 1), 0.005, 0.02),
    mi4NAV: bandToLevel(Math.abs(noise(t, 0.17, 1.9) * 0.004), 0.005, 0.02),
  };

  const liquidityScore = clamp(0.65 + noise(t, 0.09, 0.5) * 0.18, 0.25, 0.92);

  return {
    ts: t * 60,
    apys: { usdy, mUsd, aaveSupply: aave, mi4Yield: mi4 },
    risk,
    raw: {
      usdyPrice,
      mUsdRebaseRate: 1.0008 + noise(t, 0.04, 1.2) * 0.0002,
      aaveMantleOracle: aaveOraclePrice,
      chainlinkUsdcUsd: 1.0,
      liquidityScore,
    },
  };
}

export type FeedSnapshot = {
  ts: number; // unix seconds at snapshot
  apys: LiveAPYs;
  risk: LiveRiskSignals;
  /** Raw underlying prices/rates the RiskAgent expects. */
  raw: {
    usdyPrice: number; // vs 1 USDC
    mUsdRebaseRate: number; // vs 1 USDY
    aaveMantleOracle: number; // vs 1 USDC
    chainlinkUsdcUsd: number; // vs 1 USD
    liquidityScore: number; // 0..1
  };
};

/**
 * Compute the current synthetic snapshot. Same inputs (within the same minute)
 * return the same output — orchestrator + UI see consistent values during a
 * single run.
 */
export function readFeeds(): FeedSnapshot {
  // Override ts with real seconds so the UI shows actual wall-clock sync time
  const s = snapshotFromMin(nowMin());
  return { ...s, ts: Math.floor(Date.now() / 1000) };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function bandToLevel(
  deviation: number,
  warnAt: number,
  triggerAt: number,
): "ok" | "warn" | "trigger" {
  if (deviation >= triggerAt) return "trigger";
  if (deviation >= warnAt) return "warn";
  return "ok";
}
