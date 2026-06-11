/**
 * Orchestrator — wires Allocator → Risk → Reporter into one run.
 *
 * Run shape:
 *   1. Read live feeds (synthetic for the hackathon demo).
 *   2. AllocatorAgent proposes weights given user policy + live APYs.
 *   3. RiskAgent evaluates the live risk signals.
 *      - On `trigger`, the orchestrator stamps `action: "defensive_exit"`
 *        and the reporter still runs so the audit trail is complete.
 *   4. ReporterAgent rolls a weekly digest using the proposal + risk
 *      outcome + simulated baseline APYs.
 *   5. Each step's reasoning gets SHA-256 hashed and stamped with timing
 *      so the run looks identical to an on-chain trace.
 *
 * The whole run gets pushed onto the in-memory store so /reports + /vault
 * can render real history instead of static fixtures.
 */

import { AllocatorAgent } from "./AllocatorAgent";
import { RiskAgent } from "./RiskAgent";
import { ReporterAgent } from "./ReporterAgent";
import { hashReasoning } from "./BaseAgent";
import type {
  AllocatorInput,
  AllocationProposal,
  RiskInput,
  RiskSignal,
  ReportInput,
  WeeklyReport,
  UserPolicy,
} from "./types";
import { readFeeds, type FeedSnapshot } from "@/lib/data/feeds";
import { runStore, type AgentStep, type OrchestrationRun } from "@/lib/store/runStore";

/** Default policy used when the orchestrator is invoked without overrides. */
export const DEFAULT_POLICY: UserPolicy = {
  maxUsdyBps: 5000,
  maxMUsdBps: 5000,
  maxAaveBps: 5000,
  maxMi4Bps: 1500,
  minLiquidBps: 4000,
  riskTolerance: "balanced",
};

/** Default deposit size for the demo — 10,000 USDC in 6-decimal base units. */
export const DEFAULT_DEPOSIT_USDC = "10000000000";

export type OrchestrateInput = {
  /** Override the user policy. Defaults to DEFAULT_POLICY. */
  policy?: UserPolicy;
  /** Override the target deposit size. Defaults to 10k USDC. */
  targetAmountUsdc?: string;
  /** Override the entry NAV used to compute outperformance. */
  entryNAV?: string;
};

let _allocator: AllocatorAgent | null = null;
let _risk: RiskAgent | null = null;
let _reporter: ReporterAgent | null = null;

function getAllocator() {
  return _allocator ?? (_allocator = new AllocatorAgent());
}
function getRisk() {
  return _risk ?? (_risk = new RiskAgent());
}
function getReporter() {
  return _reporter ?? (_reporter = new ReporterAgent());
}

/**
 * Events emitted by `runStream` as each step completes. The HTTP layer maps
 * these straight to SSE events; the UI maps them to card reveals.
 */
export type OrchestrationEvent =
  | { type: "start"; runId: string; startedAt: number; feeds: FeedSnapshot }
  | { type: "allocator"; step: AgentStep; proposal: AllocationProposal }
  | { type: "risk"; step: AgentStep; risk: RiskSignal }
  | { type: "reporter"; step: AgentStep; report: WeeklyReport }
  | { type: "done"; run: OrchestrationRun }
  | { type: "error"; message: string };

export class Orchestrator {
  /**
   * Streaming variant of `run` — invokes `onEvent` after each agent step so
   * the UI can reveal cards progressively. The final run is still appended
   * to the in-memory store on completion (same as `run`).
   */
  async runStream(
    input: OrchestrateInput,
    onEvent: (event: OrchestrationEvent) => void,
  ): Promise<OrchestrationRun> {
    const policy = input.policy ?? DEFAULT_POLICY;
    const target = input.targetAmountUsdc ?? DEFAULT_DEPOSIT_USDC;
    const entryNAV = input.entryNAV ?? target;

    const runStartedAt = Date.now();
    const runId = `run_${runStartedAt}_${Math.random().toString(36).slice(2, 8)}`;
    const feeds = readFeeds();
    const steps: AgentStep[] = [];

    onEvent({ type: "start", runId, startedAt: runStartedAt, feeds });

    try {
      // Allocator
      const allocatorInput: AllocatorInput = {
        targetAmountUsdc: target,
        userPolicy: policy,
        liveAPYs: feeds.apys,
        liveRiskSignals: feeds.risk,
      };
      const proposal = await timedStep(
        "AllocatorAgent",
        steps,
        () => getAllocator().propose(allocatorInput),
        (out: AllocationProposal) => ({
          weights: out.weights,
          expectedAPYBps: out.expectedAPYBps,
          reasoning: out.reasoning,
        }),
      );
      onEvent({ type: "allocator", step: steps[0], proposal });

      // Risk
      const currentNAV = simulateNav(entryNAV, proposal.expectedAPYBps, 7);
      const riskInput: RiskInput = {
        usdyPrice: feeds.raw.usdyPrice,
        mUsdRebaseRate: feeds.raw.mUsdRebaseRate,
        aaveMantleOracle: feeds.raw.aaveMantleOracle,
        chainlinkUsdcUsd: feeds.raw.chainlinkUsdcUsd,
        currentNAV,
        entryNAV,
        liquidityScore: feeds.raw.liquidityScore,
        protocolHealth: {
          aavePauseStatus: feeds.risk.aaveOracle,
          usdyRedemptionStatus: feeds.risk.usdyPeg,
          mantleNetworkStatus: "ok",
        },
      };
      const risk = await timedStep(
        "RiskAgent",
        steps,
        () => getRisk().evaluate(riskInput),
        (out: RiskSignal) => out,
      );
      onEvent({ type: "risk", step: steps[1], risk });

      // Reporter
      const reportInput: ReportInput = {
        periodLabel: weekLabel(),
        entryNAV,
        currentNAV,
        events: [
          {
            timestamp: runStartedAt,
            type: "ALLOCATE",
            asset: null,
            txHash: pseudoTx(runStartedAt, 0),
            reasoningHash: steps[0].reasoningHash,
          },
          {
            timestamp: runStartedAt + 50,
            type:
              risk.level === "ok"
                ? "REPORT"
                : risk.level === "warn"
                  ? "WARN"
                  : "DEFENSIVE_EXIT",
            asset: null,
            txHash: pseudoTx(runStartedAt, 1),
            reasoningHash: steps[1].reasoningHash,
          },
        ],
        baselines: {
          doNothingAPY: 0,
          usdcAaveOnlyAPY: feeds.apys.aaveSupply,
          usdyOnlyAPY: feeds.apys.usdy,
        },
      };
      const report = await timedStep(
        "ReporterAgent",
        steps,
        () => getReporter().generate(reportInput),
        (out: WeeklyReport) => out,
      );
      onEvent({ type: "reporter", step: steps[2], report });

      const run: OrchestrationRun = {
        id: runId,
        startedAt: runStartedAt,
        finishedAt: Date.now(),
        feeds,
        proposal,
        risk,
        report,
        steps,
      };
      runStore.append(run);
      onEvent({ type: "done", run });
      return run;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      onEvent({ type: "error", message });
      throw err;
    }
  }

  async run(input: OrchestrateInput = {}): Promise<OrchestrationRun> {
    const policy = input.policy ?? DEFAULT_POLICY;
    const target = input.targetAmountUsdc ?? DEFAULT_DEPOSIT_USDC;
    const entryNAV = input.entryNAV ?? target;

    const runStartedAt = Date.now();
    const feeds = readFeeds();
    const steps: AgentStep[] = [];

    // ─── Step 1. Allocator ─────────────────────────────────────
    const allocatorInput: AllocatorInput = {
      targetAmountUsdc: target,
      userPolicy: policy,
      liveAPYs: feeds.apys,
      liveRiskSignals: feeds.risk,
    };
    const proposal = await timedStep(
      "AllocatorAgent",
      steps,
      () => getAllocator().propose(allocatorInput),
      (out: AllocationProposal) => ({
        weights: out.weights,
        expectedAPYBps: out.expectedAPYBps,
        reasoning: out.reasoning,
      }),
    );

    // ─── Step 2. Risk ──────────────────────────────────────────
    // Simulate NAV growth from entry → current using the proposal's expected APY
    // over a 7-day window. Gives the RiskAgent a believable drawdown vs entry.
    const currentNAV = simulateNav(entryNAV, proposal.expectedAPYBps, 7);
    const riskInput: RiskInput = {
      usdyPrice: feeds.raw.usdyPrice,
      mUsdRebaseRate: feeds.raw.mUsdRebaseRate,
      aaveMantleOracle: feeds.raw.aaveMantleOracle,
      chainlinkUsdcUsd: feeds.raw.chainlinkUsdcUsd,
      currentNAV,
      entryNAV,
      liquidityScore: feeds.raw.liquidityScore,
      protocolHealth: {
        aavePauseStatus: feeds.risk.aaveOracle,
        usdyRedemptionStatus: feeds.risk.usdyPeg,
        mantleNetworkStatus: "ok",
      },
    };
    const risk = await timedStep(
      "RiskAgent",
      steps,
      () => getRisk().evaluate(riskInput),
      (out: RiskSignal) => out,
    );

    // ─── Step 3. Reporter ──────────────────────────────────────
    const reportInput: ReportInput = {
      periodLabel: weekLabel(),
      entryNAV,
      currentNAV,
      events: [
        {
          timestamp: runStartedAt,
          type: "ALLOCATE",
          asset: null,
          txHash: pseudoTx(runStartedAt, 0),
          reasoningHash: steps[0]?.reasoningHash ?? null,
        },
        {
          timestamp: runStartedAt + 50,
          type: risk.level === "ok" ? "REPORT" : risk.level === "warn" ? "WARN" : "DEFENSIVE_EXIT",
          asset: null,
          txHash: pseudoTx(runStartedAt, 1),
          reasoningHash: steps[1]?.reasoningHash ?? null,
        },
      ],
      baselines: {
        doNothingAPY: 0,
        usdcAaveOnlyAPY: feeds.apys.aaveSupply,
        usdyOnlyAPY: feeds.apys.usdy,
      },
    };
    const report = await timedStep(
      "ReporterAgent",
      steps,
      () => getReporter().generate(reportInput),
      (out: WeeklyReport) => out,
    );

    const run: OrchestrationRun = {
      id: `run_${runStartedAt}_${Math.random().toString(36).slice(2, 8)}`,
      startedAt: runStartedAt,
      finishedAt: Date.now(),
      feeds,
      proposal,
      risk,
      report,
      steps,
    };
    runStore.append(run);
    return run;
  }
}

/**
 * Run an agent step, time it, hash the payload that represents the step's
 * reasoning, and record the resulting AgentStep into `steps`.
 */
async function timedStep<T>(
  agent: AgentStep["agent"],
  steps: AgentStep[],
  fn: () => Promise<T>,
  payloadFor: (out: T) => unknown,
): Promise<T> {
  const startedAt = Date.now();
  const out = await fn();
  const finishedAt = Date.now();
  const reasoningHash = await hashReasoning(payloadFor(out));
  steps.push({
    agent,
    startedAt,
    finishedAt,
    durationMs: finishedAt - startedAt,
    reasoningHash,
  });
  return out;
}

/** Apply N days of compounding at the given annualised bps to an entry NAV. */
function simulateNav(entry: string, apyBps: number, days: number): string {
  const e = BigInt(entry);
  // Convert apyBps to a tiny per-day delta. Avoid floats by scaling.
  // dailyBps * days as ppm (10^6 precision) ≈ apyBps * days / 365 * 100
  const ppm = Math.round((apyBps * days * 100) / 365);
  return (e + (e * BigInt(ppm)) / 1_000_000n).toString();
}

function pseudoTx(seed: number, salt: number): `0x${string}` {
  const s = seed + salt * 9973;
  let hex = "";
  for (let i = 0; i < 32; i++) {
    hex += (((s + i * 31) ^ (s >> ((i % 7) + 1))) & 0xff)
      .toString(16)
      .padStart(2, "0");
  }
  return `0x${hex}` as `0x${string}`;
}

function weekLabel(): string {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `week-of-${yyyy}-${mm}-${dd}`;
}
