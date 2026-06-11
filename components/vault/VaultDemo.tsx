"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Play,
  ShieldCheck,
  AlertTriangle,
  CircleDot,
  FileBarChart,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ───────────────────────────────────────────────────────────
//  Types — mirror the server's OrchestrationEvent + payload
// ───────────────────────────────────────────────────────────

type AgentStep = {
  agent: "AllocatorAgent" | "RiskAgent" | "ReporterAgent";
  startedAt: number;
  finishedAt: number;
  durationMs: number;
  reasoningHash: `0x${string}`;
};

type FeedSnapshot = {
  ts: number;
  apys: { usdy: number; mUsd: number; aaveSupply: number; mi4Yield: number };
  risk: { usdyPeg: string; mUsdPeg: string; aaveOracle: string; mi4NAV: string };
};

type Proposal = {
  weights: { usdyBps: number; mUsdBps: number; aaveBps: number; mi4Bps: number };
  expectedAPYBps: number;
  reasoning: string;
  riskScore: number;
};

type Risk = {
  level: "ok" | "warn" | "trigger";
  signal: string;
  value: number;
  threshold: number;
  sustainedSeconds: number;
  action: "none" | "alert" | "defensive_exit";
  reasoning: string;
};

type Report = {
  periodLabel: string;
  actualAPYBps: number;
  outperformanceBps: {
    vsDoNothing: number;
    vsUsdcAaveOnly: number;
    vsUsdyOnly: number;
  };
  reasoning: string;
};

type ServerEvent =
  | { type: "start"; runId: string; startedAt: number; feeds: FeedSnapshot }
  | { type: "allocator"; step: AgentStep; proposal: Proposal }
  | { type: "risk"; step: AgentStep; risk: Risk }
  | { type: "reporter"; step: AgentStep; report: Report }
  | { type: "done"; run: unknown }
  | { type: "error"; message: string };

type StepState = "idle" | "running" | "done" | "error";

const TOLERANCES = ["conservative", "balanced", "aggressive"] as const;
type Tolerance = (typeof TOLERANCES)[number];

const ASSET_COLORS: Record<string, string> = {
  USDY: "#a78bfa",
  mUSD: "#84cc16",
  Aave: "#fbbf24",
  MI4: "#f9a8d4",
};

// ───────────────────────────────────────────────────────────
//  VaultDemo
// ───────────────────────────────────────────────────────────

export function VaultDemo() {
  // Form state
  const [amount, setAmount] = useState("10000");
  const [tolerance, setTolerance] = useState<Tolerance>("balanced");

  // Live feeds (poll every 30s) — shown above the form
  const [feeds, setFeeds] = useState<FeedSnapshot | null>(null);
  useEffect(() => {
    let alive = true;
    const fetchFeeds = async () => {
      try {
        const res = await fetch("/api/feeds");
        const j = (await res.json()) as { data: FeedSnapshot };
        if (alive) setFeeds(j.data);
      } catch {
        /* swallow */
      }
    };
    fetchFeeds();
    const id = window.setInterval(fetchFeeds, 30_000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  // Orchestration state
  const [allocator, setAllocator] = useState<{
    state: StepState;
    step?: AgentStep;
    proposal?: Proposal;
  }>({ state: "idle" });
  const [risk, setRisk] = useState<{
    state: StepState;
    step?: AgentStep;
    risk?: Risk;
  }>({ state: "idle" });
  const [reporter, setReporter] = useState<{
    state: StepState;
    step?: AgentStep;
    report?: Report;
  }>({ state: "idle" });
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setAllocator({ state: "idle" });
    setRisk({ state: "idle" });
    setReporter({ state: "idle" });
    setError(null);
  }, []);

  /** Convert dollar amount → 6-decimal USDC base-units string */
  function base6(): string {
    const n = parseFloat(amount);
    if (Number.isNaN(n) || n <= 0) return "10000000000";
    return Math.floor(n * 1_000_000).toString();
  }

  /**
   * Kick off the stream. Reads the SSE response line-by-line and routes each
   * event to the matching card. The card flips to `running` the moment the
   * previous one finishes so the demo doesn't sit silently while the next
   * agent is reasoning.
   */
  async function runOrchestration() {
    reset();
    setAllocator({ state: "running" });
    setStreaming(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/orchestrate/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetAmountUsdc: base6(),
          policy: {
            maxUsdyBps: 5000,
            maxMUsdBps: 5000,
            maxAaveBps: 5000,
            maxMi4Bps: tolerance === "aggressive" ? 2500 : 1500,
            minLiquidBps: tolerance === "conservative" ? 6000 : 4000,
            riskTolerance: tolerance,
          },
        }),
        signal: ctrl.signal,
      });
      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        // SSE events end with a blank line
        const chunks = buf.split("\n\n");
        buf = chunks.pop() ?? "";
        for (const chunk of chunks) {
          const dataLine = chunk.split("\n").find((l) => l.startsWith("data: "));
          if (!dataLine) continue;
          const json = dataLine.slice(6);
          let evt: ServerEvent;
          try {
            evt = JSON.parse(json) as ServerEvent;
          } catch {
            continue;
          }
          handleEvent(evt);
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Unknown error");
      setAllocator((s) => (s.state === "running" ? { ...s, state: "error" } : s));
      setRisk((s) => (s.state === "running" ? { ...s, state: "error" } : s));
      setReporter((s) => (s.state === "running" ? { ...s, state: "error" } : s));
    } finally {
      setStreaming(false);
    }
  }

  function handleEvent(evt: ServerEvent) {
    switch (evt.type) {
      case "start":
        // Already set allocator to running in runOrchestration
        return;
      case "allocator":
        setAllocator({ state: "done", step: evt.step, proposal: evt.proposal });
        setRisk({ state: "running" });
        return;
      case "risk":
        setRisk({ state: "done", step: evt.step, risk: evt.risk });
        setReporter({ state: "running" });
        return;
      case "reporter":
        setReporter({ state: "done", step: evt.step, report: evt.report });
        return;
      case "error":
        setError(evt.message);
        return;
      case "done":
        return;
    }
  }

  function cancel() {
    abortRef.current?.abort();
    setStreaming(false);
  }

  const anyRunning =
    allocator.state === "running" ||
    risk.state === "running" ||
    reporter.state === "running";

  return (
    <div className="space-y-6">
      {/* Live feeds + control bar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <Badge variant="default">// live feeds</Badge>
            <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
              <span className="block w-1.5 h-1.5 rounded-full bg-[var(--color-success)] pulse-soft" />
              {feeds ? `synced ${new Date(feeds.ts * 1000).toLocaleTimeString()}` : "syncing…"}
            </span>
          </div>
          <CardTitle>Mantle RWA market state</CardTitle>
          <CardDescription>
            Synthesised from time-seeded noise for the hackathon demo — values drift each minute. The orchestrator pulls fresh feeds for every run.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <FeedCard
              label="USDY"
              apy={feeds?.apys.usdy}
              risk={feeds?.risk.usdyPeg}
              color={ASSET_COLORS.USDY}
            />
            <FeedCard
              label="mUSD"
              apy={feeds?.apys.mUsd}
              risk={feeds?.risk.mUsdPeg}
              color={ASSET_COLORS.mUSD}
            />
            <FeedCard
              label="Aave V3"
              apy={feeds?.apys.aaveSupply}
              risk={feeds?.risk.aaveOracle}
              color={ASSET_COLORS.Aave}
            />
            <FeedCard
              label="MI4"
              apy={feeds?.apys.mi4Yield}
              risk={feeds?.risk.mi4NAV}
              color={ASSET_COLORS.MI4}
            />
          </div>

          <div className="mt-6 grid md:grid-cols-12 gap-4">
            <div className="md:col-span-4 flex flex-col gap-2">
              <span className="text-[12px] font-medium text-[var(--color-text)]">
                Target deposit (USDC)
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={1}
                step={100}
                disabled={streaming}
                className="h-10 px-3 rounded-lg border border-[var(--color-border-strong)] bg-white font-mono text-[14px] tabular-nums focus:outline-none focus:border-[var(--color-primary)] disabled:opacity-50"
              />
            </div>
            <div className="md:col-span-5 flex flex-col gap-2">
              <span className="text-[12px] font-medium text-[var(--color-text)]">
                Risk tolerance
              </span>
              <div className="grid grid-cols-3 gap-2">
                {TOLERANCES.map((t) => (
                  <Button
                    key={t}
                    variant={tolerance === t ? "invertSolid" : "outline"}
                    size="sm"
                    onClick={() => setTolerance(t)}
                    type="button"
                    disabled={streaming}
                    className="capitalize"
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>
            <div className="md:col-span-3 flex flex-col gap-2 justify-end">
              {streaming ? (
                <Button onClick={cancel} variant="outline" size="lg">
                  Cancel
                </Button>
              ) : (
                <Button
                  onClick={runOrchestration}
                  size="lg"
                  className="w-full"
                >
                  <Play />
                  Run orchestration
                </Button>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg p-3 bg-red-50 border border-red-200 text-[13px] text-red-700">
              <strong className="block mb-1">Error</strong>
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* The three agent cards — reveal sequentially as events arrive */}
      <div className="grid md:grid-cols-3 gap-4">
        <AllocatorCard {...allocator} />
        <RiskCard {...risk} />
        <ReporterCard {...reporter} />
      </div>

      {/* Attestation trail — populated once all 3 done */}
      {allocator.step && risk.step && reporter.step && (
        <AttestationTrail
          steps={[allocator.step, risk.step, reporter.step]}
          riskLevel={risk.risk?.level ?? "ok"}
        />
      )}

      {!anyRunning && allocator.state === "idle" && (
        <div className="mt-6 text-center text-[13px] text-[var(--color-text-muted)]">
          Click <span className="font-mono">Run orchestration</span> — Claude runs all three agents in sequence, ~6-12 seconds total.
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────
//  Sub-components
// ───────────────────────────────────────────────────────────

function FeedCard({
  label,
  apy,
  risk,
  color,
}: {
  label: string;
  apy?: number;
  risk?: string;
  color: string;
}) {
  const r = risk ?? "ok";
  return (
    <div className="rounded-lg p-4 border border-[var(--color-border)] bg-[var(--color-bg-card-soft)]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="block w-2 h-2 rounded-[1px]" style={{ background: color }} />
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
            {label}
          </span>
        </div>
        <Badge
          variant={
            r === "trigger" ? "danger" : r === "warn" ? "warning" : "success"
          }
        >
          {r}
        </Badge>
      </div>
      <p className="text-[22px] font-medium tabular-nums">
        {apy !== undefined ? `${(apy * 100).toFixed(2)}%` : "—"}
      </p>
      <p className="text-[10px] font-mono uppercase tracking-[0.06em] text-[var(--color-text-muted)] mt-1">
        APY
      </p>
    </div>
  );
}

function AgentCardShell({
  title,
  agentName,
  state,
  step,
  icon,
  children,
}: {
  title: string;
  agentName: string;
  state: StepState;
  step?: AgentStep;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        "h-full transition-shadow duration-300",
        state === "done" && "shadow-[0_8px_32px_-12px_rgba(91,61,240,0.18)]",
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="default" className="font-mono">
            {icon}
            {agentName}
          </Badge>
          <StateBadge state={state} step={step} />
        </div>
        <CardTitle className="!text-[17px]">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function StateBadge({ state, step }: { state: StepState; step?: AgentStep }) {
  if (state === "idle")
    return (
      <Badge variant="outline">
        <CircleDot className="w-3 h-3" /> idle
      </Badge>
    );
  if (state === "running")
    return (
      <Badge variant="accent">
        <Loader2 className="w-3 h-3 animate-spin" /> reasoning
      </Badge>
    );
  if (state === "error")
    return (
      <Badge variant="danger">
        <AlertTriangle className="w-3 h-3" /> error
      </Badge>
    );
  return (
    <Badge variant="success">
      <ShieldCheck className="w-3 h-3" />
      {step ? `${step.durationMs}ms` : "done"}
    </Badge>
  );
}

function AllocatorCard({
  state,
  step,
  proposal,
}: {
  state: StepState;
  step?: AgentStep;
  proposal?: Proposal;
}) {
  return (
    <AgentCardShell
      title="Allocation proposed"
      agentName="AllocatorAgent"
      state={state}
      step={step}
      icon={<Cpu className="w-3 h-3" />}
    >
      {state === "idle" && <EmptyHint text="Will pick weights across USDY, mUSD, Aave, MI4." />}
      {state === "running" && <RunningHint text="reading skill · analysing yields · drafting weights" />}
      {state === "done" && proposal && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <MiniBar name="USDY" bps={proposal.weights.usdyBps} color={ASSET_COLORS.USDY} />
            <MiniBar name="mUSD" bps={proposal.weights.mUsdBps} color={ASSET_COLORS.mUSD} />
            <MiniBar name="Aave" bps={proposal.weights.aaveBps} color={ASSET_COLORS.Aave} />
            <MiniBar name="MI4" bps={proposal.weights.mi4Bps} color={ASSET_COLORS.MI4} />
          </div>
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-[var(--color-text-muted)]">expected APY</span>
            <span className="font-medium text-[var(--color-primary)] tabular-nums">
              +{proposal.expectedAPYBps} bps · {(proposal.expectedAPYBps / 100).toFixed(2)}%
            </span>
          </div>
          <Reasoning text={proposal.reasoning} />
          {step && <ReasoningHash hash={step.reasoningHash} />}
        </div>
      )}
    </AgentCardShell>
  );
}

function RiskCard({
  state,
  step,
  risk,
}: {
  state: StepState;
  step?: AgentStep;
  risk?: Risk;
}) {
  return (
    <AgentCardShell
      title={
        risk?.level === "trigger"
          ? "Defensive exit triggered"
          : risk?.level === "warn"
            ? "Warning emitted"
            : "All signals nominal"
      }
      agentName="RiskAgent"
      state={state}
      step={step}
      icon={<ShieldCheck className="w-3 h-3" />}
    >
      {state === "idle" && <EmptyHint text="Will check USDY peg, mUSD rebase, Aave oracle, MI4 NAV." />}
      {state === "running" && <RunningHint text="evaluating peg drift · oracle deviation · liquidity" />}
      {state === "done" && risk && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-[12px]">
            <KV label="level" value={risk.level} variant={
              risk.level === "trigger" ? "danger" : risk.level === "warn" ? "warning" : "success"
            } />
            <KV label="signal" value={risk.signal} />
            <KV label="action" value={risk.action} />
          </div>
          <Reasoning text={risk.reasoning} />
          {step && <ReasoningHash hash={step.reasoningHash} />}
        </div>
      )}
    </AgentCardShell>
  );
}

function ReporterCard({
  state,
  step,
  report,
}: {
  state: StepState;
  step?: AgentStep;
  report?: Report;
}) {
  return (
    <AgentCardShell
      title="Weekly digest signed"
      agentName="ReporterAgent"
      state={state}
      step={step}
      icon={<FileBarChart className="w-3 h-3" />}
    >
      {state === "idle" && <EmptyHint text="Will compare actual P&L against three baselines." />}
      {state === "running" && <RunningHint text="computing outperformance · drafting digest" />}
      {state === "done" && report && (
        <div className="space-y-4">
          <div className="rounded-lg p-3 bg-[var(--color-primary-soft)] border border-[var(--color-border-strong)]">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-1">
              actual APY annualised
            </p>
            <p className="text-[22px] font-medium tabular-nums">
              {(report.actualAPYBps / 100).toFixed(2)}%
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Out label="vs nothing" bps={report.outperformanceBps.vsDoNothing} primary />
            <Out label="vs Aave" bps={report.outperformanceBps.vsUsdcAaveOnly} />
            <Out label="vs USDY" bps={report.outperformanceBps.vsUsdyOnly} />
          </div>
          <Reasoning text={report.reasoning} />
          {step && <ReasoningHash hash={step.reasoningHash} />}
        </div>
      )}
    </AgentCardShell>
  );
}

function MiniBar({ name, bps, color }: { name: string; bps: number; color: string }) {
  const pct = bps / 100;
  return (
    <div className={cn("rounded-md border border-[var(--color-border)] p-2", bps === 0 && "opacity-50")}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="block w-1.5 h-1.5 rounded-[1px]" style={{ background: color }} />
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-text-muted)]">{name}</span>
        </div>
        <span className="font-mono text-[11px] tabular-nums">{pct.toFixed(2)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--color-bg-soft)] overflow-hidden">
        <div className="h-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function KV({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant?: "success" | "warning" | "danger" | "default";
}) {
  return (
    <div className="rounded-md p-2 bg-[var(--color-bg-soft)] border border-[var(--color-border)]">
      <p className="font-mono text-[9px] uppercase tracking-[0.06em] text-[var(--color-text-muted)] mb-1">{label}</p>
      {variant ? (
        <Badge variant={variant}>{value}</Badge>
      ) : (
        <p className="text-[11px] font-mono">{value}</p>
      )}
    </div>
  );
}

function Out({ label, bps, primary }: { label: string; bps: number; primary?: boolean }) {
  return (
    <div className="rounded-md p-2 bg-[var(--color-bg-soft)] border border-[var(--color-border)]">
      <p className="font-mono text-[9px] uppercase tracking-[0.06em] text-[var(--color-text-muted)] mb-1">{label}</p>
      <p className={cn("text-[14px] font-medium tabular-nums", primary && "text-[var(--color-primary)]")}>
        {bps >= 0 ? "+" : ""}{bps}
      </p>
    </div>
  );
}

function Reasoning({ text }: { text: string }) {
  return (
    <div className="rounded-lg p-3 bg-[var(--color-bg-invert)] border border-[var(--color-bg-invert-soft)]">
      <p className="text-[12px] leading-relaxed text-[var(--color-text-on-invert)]">{text}</p>
    </div>
  );
}

function ReasoningHash({ hash }: { hash: string }) {
  return (
    <div className="pt-2 border-t border-[var(--color-border)]">
      <p className="font-mono text-[9px] uppercase tracking-[0.06em] text-[var(--color-text-muted)] mb-1">
        SHA-256 reasoning hash
      </p>
      <p className="font-mono text-[10px] text-[var(--color-text-secondary)] break-all">{hash}</p>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <p className="text-[12px] text-[var(--color-text-muted)] leading-relaxed">{text}</p>
  );
}

function RunningHint({ text }: { text: string }) {
  return (
    <p className="font-mono text-[11px] text-[var(--color-text-secondary)] flex items-center gap-2">
      <Loader2 className="w-3 h-3 animate-spin text-[var(--color-primary)]" />
      {text}
    </p>
  );
}

function AttestationTrail({
  steps,
  riskLevel,
}: {
  steps: AgentStep[];
  riskLevel: "ok" | "warn" | "trigger";
}) {
  const labels = ["ALLOCATE", riskLevel === "ok" ? "REPORT" : riskLevel === "warn" ? "WARN" : "DEFENSIVE_EXIT", "REPORT"];
  return (
    <Card>
      <CardHeader>
        <Badge variant="default">// erc-8004 attestation trail (this run)</Badge>
        <CardTitle>3 reputation events emitted</CardTitle>
        <CardDescription>
          Each agent decision becomes a signed event. In production these go on-chain via the AtmaVault contract on Mantle.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
          {steps.map((s, i) => (
            <div
              key={s.reasoningHash}
              className={cn(
                "grid grid-cols-[40px_1.4fr_1fr_2.5fr_0.8fr] px-4 py-3 items-center text-[12px]",
                i < steps.length - 1 && "border-b border-[var(--color-border)]",
              )}
            >
              <span className="font-mono text-[var(--color-text-faint)] tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-mono">{s.agent}</span>
              <Badge
                variant={
                  labels[i] === "DEFENSIVE_EXIT"
                    ? "danger"
                    : labels[i] === "WARN"
                      ? "warning"
                      : labels[i] === "ALLOCATE"
                        ? "accent"
                        : "default"
                }
              >
                {labels[i]}
              </Badge>
              <span className="font-mono text-[var(--color-primary)] truncate text-[11px]">
                {s.reasoningHash.slice(0, 14)}…{s.reasoningHash.slice(-6)}
              </span>
              <span className="font-mono text-[10px] text-[var(--color-text-muted)] tabular-nums text-right">
                {s.durationMs}ms
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
