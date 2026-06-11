import { describe, it, expect } from "vitest";
import { readFeeds } from "../feeds";

describe("readFeeds", () => {
  it("returns APYs in the documented bands", () => {
    const s = readFeeds();
    expect(s.apys.usdy).toBeGreaterThanOrEqual(0.040);
    expect(s.apys.usdy).toBeLessThanOrEqual(0.048);
    expect(s.apys.mUsd).toBeGreaterThanOrEqual(0.040);
    expect(s.apys.mUsd).toBeLessThanOrEqual(0.052);
    expect(s.apys.aaveSupply).toBeGreaterThanOrEqual(0.038);
    expect(s.apys.aaveSupply).toBeLessThanOrEqual(0.072);
    expect(s.apys.mi4Yield).toBeGreaterThanOrEqual(0.020);
    expect(s.apys.mi4Yield).toBeLessThanOrEqual(0.140);
  });

  it("returns valid risk levels per signal", () => {
    const s = readFeeds();
    const valid = new Set(["ok", "warn", "trigger"]);
    expect(valid.has(s.risk.usdyPeg)).toBe(true);
    expect(valid.has(s.risk.mUsdPeg)).toBe(true);
    expect(valid.has(s.risk.aaveOracle)).toBe(true);
    expect(valid.has(s.risk.mi4NAV)).toBe(true);
  });

  it("returns plausible raw oracle prices near 1.0", () => {
    const s = readFeeds();
    expect(Math.abs(s.raw.usdyPrice - 1)).toBeLessThan(0.01);
    expect(Math.abs(s.raw.aaveMantleOracle - 1)).toBeLessThan(0.02);
    expect(s.raw.chainlinkUsdcUsd).toBe(1.0);
  });

  it("liquidityScore stays in [0.25, 0.92]", () => {
    const s = readFeeds();
    expect(s.raw.liquidityScore).toBeGreaterThanOrEqual(0.25);
    expect(s.raw.liquidityScore).toBeLessThanOrEqual(0.92);
  });

  it("two calls in the same minute return identical APYs", () => {
    const a = readFeeds();
    const b = readFeeds();
    expect(a.apys).toEqual(b.apys);
    expect(a.risk).toEqual(b.risk);
  });
});
