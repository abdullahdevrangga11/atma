/**
 * Orchestrator — wires Allocator → Risk → Reporter into one streaming run.
 *
 * Streaming model:
 *   start              → run begins
 *   state              → vault state machine transition (Idle → Analyzing → ...)
 *   token              → Claude's reasoning text delta (per agent)
 *   allocator          → Allocator finished (with proposal + cost)
 *   risk               → Risk finished (with signal + cost)
 *   veto               → Risk vetoed; Allocator will redraft (max 1 retry)
 *   reporter           → Reporter finished (with report + cost)
 *   done               → final OrchestrationRun assembled and stored
 *   error              → fatal error
 *
 * Debate loop:
 *   If RiskAgent emits level === "trigger", the orchestrator passes the risk
 *   reasoning back to AllocatorAgent as a constraint and re-runs the
 *   allocation. Up to ONE retry. If the second proposal still trips Risk, we
 *   accept the defensive_exit and proceed to Reporter — the report will
 *   surface the trigger.
 */

import { AllocatorAgent } from "./AllocatorAgent";
import { RiskAgent } from "./RiskAgent";
import { ReporterAgent } from "./ReporterAgent";
import { hashReasoning, type TokenUsage } from "./BaseAgent";
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
import {
  runStore,
  type AgentStep,
  type OrchestrationRun,
  type DebateExchange,
} from "@/lib/store/runStore";

// ───────────────────────────────────────────────────────────
//  Vault state machine — mirrors AtmaVault.sol
// ───────────────────────────────────────────────────────────

export const VAULT_STATES = [
  "Idle",
  "Analyzing",
  "Proposing",
  "Executing",
  "Attesting",
  "Allocated",
  "Rebalancing",
  "RiskTriggered",
  "Withdrawing",
  "DefensiveExit",
  "Completed",
] as const;
export type VaultState = (typeof VAULT_STATES)[number];

// ───────────────────────────────────────────────────────────
//  Defaults
// ───────────────────────────────────────────────────────────

export const DEFAULT_POLICY: UserPolicy = {
  maxUsdyBps: 5000,
  maxMUsdBps: 5000,
  maxAaveBps: 5000,
  maxMi4Bps: 1500,
  minLiquidBps: 4000,
  riskTolerance: "balanced",
};
export const DEFAULT_DEPOSIT_USDC = "10000000000";

export type OrchestrateInput = {
  policy?: UserPolicy;
  targetAmountUsdc?: string;
  entryNAV?: string;
  /** When true, force the RiskAgent to see a trigger on first pass for demo. */
  forceDebate?: boolean;
  /** Inject a historical snapshot — used by the backtest endpoint. */
  feedsOverride?: FeedSnapshot;
};

// ───────────────────────────────────────────────────────────
//  Events emitted to the SSE layer
// ───────────────────────────────────────────────────────────

export type OrchestrationEvent =
  | { type: "start"; runId: string; startedAt: number; feeds: FeedSnapshot }
  | { type: "state"; state: VaultState; at: number }
  | { type: "token"; agent: AgentStep["agent"]; chunk: string; attempt?: number }
  | {
      type: "allocator";
      step: AgentStep;
      proposal: AllocationProposal;
      attempt: number;
    }
  | { type: "risk"; step: AgentStep; risk: RiskSignal }
  | {
      type: "veto";
      reason: string;
      level: RiskSignal["level"];
      attempt: number;
    }
  | { type: "reporter"; step: AgentStep; report: WeeklyReport }
  | { type: "cost"; total: TokenUsage }
  | { type: "done"; run: OrchestrationRun }
  | { type: "error"; message: string };

// ───────────────────────────────────────────────────────────
//  Cached singleton instances
// ───────────────────────────────────────────────────────────

let _allocator: AllocatorAgent | null = null;
let _risk: RiskAgent | null = null;
let _reporter: ReporterAgent | null = null;
function getAllocator() { return _allocator ?? (_allocator = new AllocatorAgent()); }
function getRisk() { return _risk ?? (_risk = new RiskAgent()); }
function getReporter() { return _reporter ?? (_reporter = new ReporterAgent()); }

// ───────────────────────────────────────────────────────────
//  Orchestrator
// ───────────────────────────────────────────────────────────

export class Orchestrator {
  /**
   * Streaming variant. Emits state transitions, per-agent token deltas, step
   * completions, cost rollups, and the final OrchestrationRun.
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
    const feeds = input.feedsOverride ?? readFeeds();
    const steps: AgentStep[] = [];
    const debate: DebateExchange[] = [];
    let totalInput = 0;
    let totalOutput = 0;
    let totalCostCents = 0;
    const addUsage = (u: TokenUsage) => {
      totalInput += u.inputTokens;
      totalOutput += u.outputTokens;
      totalCostCents += u.costCents;
      onEvent({
        type: "cost",
        total: { inputTokens: totalInput, outputTokens: totalOutput, costCents: totalCostCents },
      });
    };
    const setState = (state: VaultState) =>
      onEvent({ type: "state", state, at: Date.now() });

    onEvent({ type: "start", runId, startedAt: runStartedAt, feeds });
    setState("Idle");

    try {
      // ─── Allocator (with up to 1 debate retry) ──────────────
      setState("Analyzing");
      let proposal: AllocationProposal & { usage: TokenUsage } | null = null;
      let attempt = 0;
      let riskVeto: string | undefined;
      let lastRisk: (RiskSignal & { usage: TokenUsage }) | null = null;

      while (attempt < 2) {
        const allocatorInput: AllocatorInput = {
          targetAmountUsdc: target,
          userPolicy: policy,
          liveAPYs: feeds.apys,
          liveRiskSignals: feeds.risk,
        };
        proposal = await timedStep(
          "AllocatorAgent",
          steps,
          (chunk) => onEvent({ type: "token", agent: "AllocatorAgent", chunk, attempt: attempt + 1 }),
          (onChunk) => getAllocator().proposeStream(allocatorInput, onChunk, riskVeto),
          (out) => ({ weights: out.weights, reasoning: out.reasoning, attempt: attempt + 1 }),
        );
        addUsage(proposal.usage);
        setState("Proposing");
        onEvent({
          type: "allocator",
          step: steps[steps.length - 1],
          proposal,
          attempt: attempt + 1,
        });

        // ─── Risk evaluation for this proposal ────────────────
        setState("Attesting");
        const currentNAV = simulateNav(entryNAV, proposal.expectedAPYBps, 7);
        // Optional demo override: pretend Aave is in trigger so debate happens.
        const debateOverride =
          input.forceDebate && attempt === 0
            ? { ...feeds.raw, aaveMantleOracle: 1.04 }
            : feeds.raw;
        const riskInput: RiskInput = {
          usdyPrice: debateOverride.usdyPrice,
          mUsdRebaseRate: debateOverride.mUsdRebaseRate,
          aaveMantleOracle: debateOverride.aaveMantleOracle,
          chainlinkUsdcUsd: debateOverride.chainlinkUsdcUsd,
          currentNAV,
          entryNAV,
          liquidityScore: debateOverride.liquidityScore,
          protocolHealth: {
            aavePauseStatus: input.forceDebate && attempt === 0 ? "trigger" : feeds.risk.aaveOracle,
            usdyRedemptionStatus: feeds.risk.usdyPeg,
            mantleNetworkStatus: "ok",
          },
        };
        const risk = await timedStep(
          "RiskAgent",
          steps,
          (chunk) => onEvent({ type: "token", agent: "RiskAgent", chunk }),
          (onChunk) => getRisk().evaluateStream(riskInput, onChunk),
          (out) => out,
        );
        addUsage(risk.usage);
        lastRisk = risk;
        onEvent({ type: "risk", step: steps[steps.length - 1], risk });

        if (risk.level !== "trigger" || attempt >= 1) {
          // Either clean / warn → proceed, or already retried → accept and continue.
          break;
        }

        // Trigger on first attempt → veto + redraft.
        attempt += 1;
        riskVeto = `RiskAgent flagged ${risk.signal} (value ${risk.value}, threshold ${risk.threshold}). Reasoning: ${risk.reasoning}`;
        debate.push({ attempt, vetoReason: riskVeto, level: risk.level });
        onEvent({ type: "veto", reason: riskVeto, level: risk.level, attempt });
        setState("Analyzing");
      }

      // Safety — proposal/lastRisk must be set by here
      if (!proposal || !lastRisk) throw new Error("Orchestration produced no proposal");

      // ─── Reporter ─────────────────────────────────────────
      const finalProposal = proposal;
      const finalRisk = lastRisk;
      setState(finalRisk.level === "trigger" ? "DefensiveExit" : "Allocated");

      const currentNAV = simulateNav(entryNAV, finalProposal.expectedAPYBps, 7);
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
              finalRisk.level === "ok"
                ? "REPORT"
                : finalRisk.level === "warn"
                  ? "WARN"
                  : "DEFENSIVE_EXIT",
            asset: null,
            txHash: pseudoTx(runStartedAt, 1),
            reasoningHash: steps.at(-1)?.reasoningHash ?? null,
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
        (chunk) => onEvent({ type: "token", agent: "ReporterAgent", chunk }),
        (onChunk) => getReporter().generateStream(reportInput, onChunk),
        (out) => out,
      );
      addUsage(report.usage);
      setState("Completed");
      onEvent({ type: "reporter", step: steps[steps.length - 1], report });

      const run: OrchestrationRun = {
        id: runId,
        startedAt: runStartedAt,
        finishedAt: Date.now(),
        feeds,
        proposal: finalProposal,
        risk: finalRisk,
        report,
        steps,
        debate: debate.length > 0 ? debate : undefined,
        totalCostCents,
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

  /** Non-streaming convenience wrapper. */
  async run(input: OrchestrateInput = {}): Promise<OrchestrationRun> {
    let final: OrchestrationRun | null = null;
    await this.runStream(input, (e) => {
      if (e.type === "done") final = e.run;
    });
    if (!final) throw new Error("Orchestration produced no run");
    return final;
  }
}

// ───────────────────────────────────────────────────────────
//  Helpers
// ───────────────────────────────────────────────────────────

/** Run a streamed agent step, time it, hash its payload, record AgentStep. */
async function timedStep<T extends { usage: TokenUsage }>(
  agent: AgentStep["agent"],
  steps: AgentStep[],
  emitToken: (chunk: string) => void,
  fn: (onChunk: (text: string) => void) => Promise<T>,
  payloadFor: (out: T) => unknown,
): Promise<T> {
  const startedAt = Date.now();
  const out = await fn(emitToken);
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

function simulateNav(entry: string, apyBps: number, days: number): string {
  const e = BigInt(entry);
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
  return `week-of-${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
