import { describe, it, expect } from "vitest";
import {
  AllocationWeightsSchema,
  AllocationProposalSchema,
  AllocatorInputSchema,
  RiskSignalSchema,
  ReportInputSchema,
  WeeklyReportSchema,
} from "../types";

describe("AllocationWeightsSchema", () => {
  it("accepts a valid weights object", () => {
    const ok = AllocationWeightsSchema.parse({
      usdyBps: 3408,
      mUsdBps: 3000,
      aaveBps: 3592,
      mi4Bps: 0,
    });
    expect(ok.usdyBps + ok.mUsdBps + ok.aaveBps + ok.mi4Bps).toBe(10_000);
  });

  it("rejects negative bps", () => {
    expect(() =>
      AllocationWeightsSchema.parse({
        usdyBps: -1,
        mUsdBps: 5000,
        aaveBps: 5001,
        mi4Bps: 0,
      }),
    ).toThrow();
  });

  it("rejects bps > 10000", () => {
    expect(() =>
      AllocationWeightsSchema.parse({
        usdyBps: 11_000,
        mUsdBps: 0,
        aaveBps: 0,
        mi4Bps: 0,
      }),
    ).toThrow();
  });
});

describe("AllocatorInputSchema", () => {
  it("requires targetAmountUsdc to be an integer string", () => {
    expect(() =>
      AllocatorInputSchema.parse({
        targetAmountUsdc: "1.5",
        userPolicy: {
          maxUsdyBps: 5000,
          maxMUsdBps: 5000,
          maxAaveBps: 5000,
          maxMi4Bps: 0,
          minLiquidBps: 5000,
          riskTolerance: "balanced",
        },
        liveAPYs: { usdy: 0.046, mUsd: 0.041, aaveSupply: 0.052, mi4Yield: 0.08 },
        liveRiskSignals: { usdyPeg: "ok", mUsdPeg: "ok", aaveOracle: "ok", mi4NAV: "ok" },
      }),
    ).toThrow();
  });

  it("accepts well-formed input", () => {
    const parsed = AllocatorInputSchema.parse({
      targetAmountUsdc: "10000000000", // 10k USDC
      userPolicy: {
        maxUsdyBps: 5000,
        maxMUsdBps: 5000,
        maxAaveBps: 5000,
        maxMi4Bps: 0,
        minLiquidBps: 5000,
        riskTolerance: "balanced",
      },
      liveAPYs: { usdy: 0.046, mUsd: 0.041, aaveSupply: 0.052, mi4Yield: 0.08 },
      liveRiskSignals: { usdyPeg: "ok", mUsdPeg: "ok", aaveOracle: "ok", mi4NAV: "ok" },
    });
    expect(parsed.userPolicy.riskTolerance).toBe("balanced");
  });
});

describe("AllocationProposalSchema", () => {
  it("requires reasoning to be non-empty", () => {
    expect(() =>
      AllocationProposalSchema.parse({
        weights: { usdyBps: 5000, mUsdBps: 5000, aaveBps: 0, mi4Bps: 0 },
        expectedAPYBps: 450,
        reasoning: "",
        riskScore: 3,
      }),
    ).toThrow();
  });

  it("clamps riskScore to 1-10", () => {
    expect(() =>
      AllocationProposalSchema.parse({
        weights: { usdyBps: 5000, mUsdBps: 5000, aaveBps: 0, mi4Bps: 0 },
        expectedAPYBps: 450,
        reasoning: "balanced",
        riskScore: 11,
      }),
    ).toThrow();
  });
});

describe("RiskSignalSchema", () => {
  it("accepts a valid trigger signal", () => {
    const parsed = RiskSignalSchema.parse({
      level: "trigger",
      signal: "oracle_deviation",
      value: 0.025,
      threshold: 0.02,
      sustainedSeconds: 600,
      action: "defensive_exit",
      reasoning: "Aave oracle off-band >10min",
    });
    expect(parsed.action).toBe("defensive_exit");
  });

  it("rejects unknown level", () => {
    expect(() =>
      RiskSignalSchema.parse({
        level: "panic",
        signal: "x",
        value: 0,
        threshold: 0,
        sustainedSeconds: 0,
        action: "none",
        reasoning: "x",
      }),
    ).toThrow();
  });
});

describe("ReportInput + WeeklyReport", () => {
  it("parses a minimal report input", () => {
    const parsed = ReportInputSchema.parse({
      periodLabel: "week-of-2026-06-15",
      entryNAV: "10000000000",
      currentNAV: "10046300000",
      events: [],
      baselines: { doNothingAPY: 0, usdcAaveOnlyAPY: 0.0416, usdyOnlyAPY: 0.0442 },
    });
    expect(parsed.periodLabel).toBe("week-of-2026-06-15");
  });

  it("accepts negative outperformance bps (under-perform)", () => {
    const parsed = WeeklyReportSchema.parse({
      periodLabel: "week-of-2026-06-15",
      actualAPYBps: 410,
      outperformanceBps: { vsDoNothing: 410, vsUsdcAaveOnly: -6, vsUsdyOnly: -32 },
      reasoning: "tough week",
    });
    expect(parsed.outperformanceBps.vsUsdcAaveOnly).toBeLessThan(0);
  });
});
