import { describe, it, expect, beforeEach } from "vitest";
import { runStore, type OrchestrationRun } from "../runStore";

function mkRun(id: string, overrides: Partial<OrchestrationRun> = {}): OrchestrationRun {
  const now = Date.now();
  return {
    id,
    startedAt: now,
    finishedAt: now + 100,
    feeds: {
      ts: Math.floor(now / 1000),
      apys: { usdy: 0.045, mUsd: 0.046, aaveSupply: 0.052, mi4Yield: 0.08 },
      risk: { usdyPeg: "ok", mUsdPeg: "ok", aaveOracle: "ok", mi4NAV: "ok" },
      raw: {
        usdyPrice: 1,
        mUsdRebaseRate: 1.001,
        aaveMantleOracle: 1,
        chainlinkUsdcUsd: 1,
        liquidityScore: 0.7,
      },
    },
    proposal: {
      weights: { usdyBps: 3408, mUsdBps: 3000, aaveBps: 3592, mi4Bps: 0 },
      expectedAPYBps: 463,
      reasoning: "balanced",
      riskScore: 3,
    },
    risk: {
      level: "ok",
      signal: "ok",
      value: 0,
      threshold: 0,
      sustainedSeconds: 0,
      action: "none",
      reasoning: "clean",
    },
    report: {
      periodLabel: "week-of-2026-06-11",
      actualAPYBps: 463,
      outperformanceBps: { vsDoNothing: 463, vsUsdcAaveOnly: 47, vsUsdyOnly: 21 },
      reasoning: "fine",
    },
    steps: [],
    ...overrides,
  };
}

// Wipe the global between tests so the cap behaviour is testable.
beforeEach(() => {
  (globalThis as { __atmaRunStore?: OrchestrationRun[] }).__atmaRunStore = [];
});

describe("runStore", () => {
  it("appends newest-first", () => {
    runStore.append(mkRun("a"));
    runStore.append(mkRun("b"));
    runStore.append(mkRun("c"));
    expect(runStore.list().map((r) => r.id)).toEqual(["c", "b", "a"]);
  });

  it("caps at 50 runs", () => {
    for (let i = 0; i < 70; i++) runStore.append(mkRun(`r${i}`));
    expect(runStore.size()).toBe(50);
    expect(runStore.list(1)[0].id).toBe("r69");
  });

  it("returns null aggregate when empty", () => {
    expect(runStore.aggregate()).toBeNull();
  });

  it("aggregate.latest is the most recent run", () => {
    runStore.append(mkRun("old", { startedAt: 1 }));
    runStore.append(mkRun("new", { startedAt: 2 }));
    const a = runStore.aggregate()!;
    expect(a.latest.id).toBe("new");
    expect(a.totalAttestations).toBe(2 * 3);
  });

  it("get() returns by id", () => {
    runStore.append(mkRun("target"));
    expect(runStore.get("target")?.id).toBe("target");
    expect(runStore.get("missing")).toBeUndefined();
  });
});
