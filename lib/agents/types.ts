import { z } from "zod";

export const RiskLevelSchema = z.enum(["ok", "warn", "trigger"]);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

export const RiskToleranceSchema = z.enum(["conservative", "balanced", "aggressive"]);
export type RiskTolerance = z.infer<typeof RiskToleranceSchema>;

export const AllocationWeightsSchema = z.object({
  usdyBps: z.number().int().min(0).max(10_000),
  mUsdBps: z.number().int().min(0).max(10_000),
  aaveBps: z.number().int().min(0).max(10_000),
  mi4Bps: z.number().int().min(0).max(10_000),
});
export type AllocationWeights = z.infer<typeof AllocationWeightsSchema>;

export const UserPolicySchema = z.object({
  maxUsdyBps: z.number().int().min(0).max(10_000),
  maxMUsdBps: z.number().int().min(0).max(10_000),
  maxAaveBps: z.number().int().min(0).max(10_000),
  maxMi4Bps: z.number().int().min(0).max(10_000),
  minLiquidBps: z.number().int().min(0).max(10_000),
  /**
   * Compliance cap: max combined exposure to permissionless / unregulated
   * venues (Aave V3 + MI4), in basis points. Omitted = no compliance cap.
   * USDY and mUSD are KYC-bounded regulated instruments and are not counted.
   */
  maxUnregulatedBps: z.number().int().min(0).max(10_000).optional(),
  riskTolerance: RiskToleranceSchema,
});
export type UserPolicy = z.infer<typeof UserPolicySchema>;

export const LiveAPYsSchema = z.object({
  usdy: z.number(),         // as a decimal, e.g. 0.0465
  mUsd: z.number(),
  aaveSupply: z.number(),
  mi4Yield: z.number(),
});
export type LiveAPYs = z.infer<typeof LiveAPYsSchema>;

export const LiveRiskSignalsSchema = z.object({
  usdyPeg: RiskLevelSchema,
  mUsdPeg: RiskLevelSchema,
  aaveOracle: RiskLevelSchema,
  mi4NAV: RiskLevelSchema,
});
export type LiveRiskSignals = z.infer<typeof LiveRiskSignalsSchema>;

export const AllocationProposalSchema = z.object({
  weights: AllocationWeightsSchema,
  expectedAPYBps: z.number().int().min(0),
  reasoning: z.string().min(1),
  riskScore: z.number().int().min(1).max(10),
});
export type AllocationProposal = z.infer<typeof AllocationProposalSchema>;

export const AllocatorInputSchema = z.object({
  targetAmountUsdc: z.string().refine((s) => /^\d+$/.test(s), "targetAmountUsdc must be a base-10 integer string (6 dec)"),
  userPolicy: UserPolicySchema,
  liveAPYs: LiveAPYsSchema,
  liveRiskSignals: LiveRiskSignalsSchema,
});
export type AllocatorInput = z.infer<typeof AllocatorInputSchema>;

export const RiskSignalSchema = z.object({
  level: RiskLevelSchema,
  signal: z.string(),                  // e.g. "oracle_deviation"
  value: z.number(),
  threshold: z.number(),
  sustainedSeconds: z.number().int().nonnegative(),
  action: z.enum(["none", "alert", "defensive_exit"]),
  reasoning: z.string().min(1),
});
export type RiskSignal = z.infer<typeof RiskSignalSchema>;

export const RiskInputSchema = z.object({
  usdyPrice: z.number(),
  mUsdRebaseRate: z.number(),
  aaveMantleOracle: z.number(),
  chainlinkUsdcUsd: z.number(),
  currentNAV: z.string(),
  entryNAV: z.string(),
  liquidityScore: z.number().min(0).max(1),
  protocolHealth: z.object({
    aavePauseStatus: RiskLevelSchema.optional().default("ok"),
    usdyRedemptionStatus: RiskLevelSchema.optional().default("ok"),
    mantleNetworkStatus: RiskLevelSchema.optional().default("ok"),
  }),
});
export type RiskInput = z.infer<typeof RiskInputSchema>;

export const ReportInputSchema = z.object({
  periodLabel: z.string(),              // e.g. "week-of-2026-06-15"
  entryNAV: z.string(),
  currentNAV: z.string(),
  events: z.array(
    z.object({
      timestamp: z.number().int(),
      type: z.string(),
      asset: z.string().nullable(),
      txHash: z.string().nullable(),
      reasoningHash: z.string().nullable(),
    }),
  ),
  baselines: z.object({
    doNothingAPY: z.number(),
    usdcAaveOnlyAPY: z.number(),
    usdyOnlyAPY: z.number(),
  }),
});
export type ReportInput = z.infer<typeof ReportInputSchema>;

export const WeeklyReportSchema = z.object({
  periodLabel: z.string(),
  actualAPYBps: z.number().int(),
  outperformanceBps: z.object({
    vsDoNothing: z.number().int(),
    vsUsdcAaveOnly: z.number().int(),
    vsUsdyOnly: z.number().int(),
  }),
  reasoning: z.string(),
});
export type WeeklyReport = z.infer<typeof WeeklyReportSchema>;
