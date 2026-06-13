import { describe, it, expect } from "vitest";
import { checkCompliance } from "../compliance";
import { RiskAgent } from "../RiskAgent";
import type { AllocationWeights } from "../types";

const weights = (
  usdyBps: number,
  mUsdBps: number,
  aaveBps: number,
  mi4Bps: number,
): AllocationWeights => ({ usdyBps, mUsdBps, aaveBps, mi4Bps });

describe("checkCompliance", () => {
  it("passes when unregulated exposure is below the cap", () => {
    const r = checkCompliance(weights(5000, 3000, 1500, 500), 5000);
    expect(r.compliant).toBe(true);
    expect(r.unregulatedBps).toBe(2000);
    expect(r.cap).toBe(5000);
    expect(r.reason).toContain("COMPLIANCE OK");
  });

  it("vetoes when unregulated exposure exceeds the cap", () => {
    const r = checkCompliance(weights(2000, 1000, 5000, 2000), 5000);
    expect(r.compliant).toBe(false);
    expect(r.unregulatedBps).toBe(7000);
    expect(r.reason).toContain("COMPLIANCE VETO");
    // Breach amount surfaced for the human-readable veto.
    expect(r.reason).toContain("2000 bps");
  });

  it("treats the cap as inclusive (boundary: exactly at cap is compliant)", () => {
    const r = checkCompliance(weights(3000, 2000, 3000, 2000), 5000);
    expect(r.unregulatedBps).toBe(5000);
    expect(r.compliant).toBe(true);
  });

  it("flags one bp over the cap as a breach (boundary)", () => {
    const r = checkCompliance(weights(2999, 2000, 3001, 2000), 5000);
    expect(r.unregulatedBps).toBe(5001);
    expect(r.compliant).toBe(false);
  });

  it("a zero cap forbids any unregulated exposure", () => {
    expect(checkCompliance(weights(6000, 4000, 0, 0), 0).compliant).toBe(true);
    expect(checkCompliance(weights(6000, 3000, 1000, 0), 0).compliant).toBe(false);
  });

  it("only counts Aave + MI4, never USDY / mUSD", () => {
    // Fully regulated book is always compliant, even at a 0 cap.
    const r = checkCompliance(weights(7000, 3000, 0, 0), 0);
    expect(r.unregulatedBps).toBe(0);
    expect(r.compliant).toBe(true);
  });

  it("clamps an out-of-range cap into [0, 10000]", () => {
    expect(checkCompliance(weights(0, 0, 6000, 4000), 99_999).compliant).toBe(true);
    expect(checkCompliance(weights(0, 0, 6000, 4000), -5).compliant).toBe(false);
  });
});

describe("RiskAgent.enforceCompliance", () => {
  it("returns null when no cap is set on the policy", () => {
    expect(RiskAgent.enforceCompliance(weights(0, 0, 6000, 4000), undefined)).toBeNull();
  });

  it("delegates to checkCompliance when a cap is set", () => {
    const r = RiskAgent.enforceCompliance(weights(0, 0, 6000, 4000), 5000);
    expect(r).not.toBeNull();
    expect(r!.compliant).toBe(false);
    expect(r!.unregulatedBps).toBe(10_000);
  });
});
