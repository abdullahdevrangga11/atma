/**
 * Compliance guardrail (pure, deterministic policy check).
 *
 * AMANA's asset universe splits into two regulatory buckets:
 *   - Regulated / KYC-bounded: USDY (Ondo tokenized US Treasury, KYC-gated)
 *     and mUSD (regulated stable). These are issued under a compliance
 *     regime with identity controls on mint/redeem.
 *   - Permissionless / unregulated: Aave V3 supply and MI4 (Mantle index).
 *     Open DeFi positions with no KYC perimeter.
 *
 * A treasury under a compliance mandate caps how much of the book may sit in
 * permissionless venues. This helper enforces that cap. It is intentionally
 * pure (no I/O, no LLM) so the RiskAgent veto path is reproducible and the
 * unit tests are exact.
 */

import type { AllocationWeights } from "./types";

/** Assets treated as permissionless / unregulated for the compliance cap. */
export const UNREGULATED_ASSETS = ["aaveBps", "mi4Bps"] as const;

/** Assets treated as regulated / KYC-bounded instruments. */
export const REGULATED_ASSETS = ["usdyBps", "mUsdBps"] as const;

export type ComplianceResult = {
  /** True when unregulated exposure is at or below the cap. */
  compliant: boolean;
  /** Combined Aave + MI4 exposure, in basis points. */
  unregulatedBps: number;
  /** The cap that was applied, in basis points. */
  cap: number;
  /** Human-readable explanation, suitable for the debate / veto UI. */
  reason: string;
};

/**
 * Check a proposed allocation against the unregulated-exposure cap.
 *
 * @param weights         the proposed allocation in basis points
 * @param maxUnregulatedBps  cap on Aave + MI4 combined exposure (0-10000)
 */
export function checkCompliance(
  weights: AllocationWeights,
  maxUnregulatedBps: number,
): ComplianceResult {
  const cap = clampBps(maxUnregulatedBps);
  const unregulatedBps = weights.aaveBps + weights.mi4Bps;
  const compliant = unregulatedBps <= cap;

  const reason = compliant
    ? `COMPLIANCE OK: unregulated exposure (Aave ${weights.aaveBps} + MI4 ${weights.mi4Bps} = ${unregulatedBps} bps) is within the ${cap} bps permissionless cap. USDY and mUSD are KYC-bounded regulated instruments.`
    : `COMPLIANCE VETO: unregulated exposure (Aave ${weights.aaveBps} + MI4 ${weights.mi4Bps} = ${unregulatedBps} bps) exceeds the ${cap} bps cap on permissionless venues by ${unregulatedBps - cap} bps. Aave V3 and MI4 are permissionless DeFi with no KYC perimeter; shift weight into the KYC-bounded regulated instruments USDY and mUSD.`;

  return { compliant, unregulatedBps, cap, reason };
}

function clampBps(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(10_000, Math.trunc(n)));
}
