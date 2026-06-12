"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  Skull,
  Cpu,
  FileBarChart,
  Coins,
  Share2,
  Check,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { StateMachineViz, STATE_LIST } from "@/components/vault/StateMachineViz";

type VaultState = (typeof STATE_LIST)[number];

type AgentStep = {
  agent: "AllocatorAgent" | "RiskAgent" | "ReporterAgent";
  startedAt: number;
  finishedAt: number;
  durationMs: number;
  reasoningHash: `0x${string}`;
};

type Run = {
  id: string;
  startedAt: number;
  finishedAt: number;
  feeds: {
    ts: number;
    apys: { usdy: number; mUsd: number; aaveSupply: number; mi4Yield: number };
    risk: { usdyPeg: string; mUsdPeg: string; aaveOracle: string; mi4NAV: string };
  };
  proposal: {
    weights: { usdyBps: number; mUsdBps: number; aaveBps: number; mi4Bps: number };
    expectedAPYBps: number;
    reasoning: string;
    riskScore: number;
  };
  risk: {
    level: "ok" | "warn" | "trigger";
    signal: string;
    value: number;
    threshold: number;
    sustainedSeconds: number;
    action: "none" | "alert" | "defensive_exit";
    reasoning: string;
  };
  report: {
    periodLabel: string;
    actualAPYBps: number;
    outperformanceBps: {
      vsDoNothing: number;
      vsUsdcAaveOnly: number;
      vsUsdyOnly: number;
    };
    reasoning: string;
  };
  steps: AgentStep[];
  debate?: { attempt: number; vetoReason: string; level: string }[];
  totalCostCents?: number;
};

const ASSET_COLORS: Record<string, string> = {
  USDY: "#a78bfa",
  mUSD: "#84cc16",
  Aave: "#fbbf24",
  MI4: "#f9a8d4",
};

export function RunDetail({ runId }: { runId: string }) {
  const [run, setRun] = useState<Run | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/runs/${runId}`)
      .then(async (res) => {
        const j = (await res.json()) as { data: Run | null; error: string | null };
        if (!alive) return;
        if (!res.ok || !j.data) setNotFound(true);
        else setRun(j.data);
      })
      .catch(() => setNotFound(true));
    return () => {
      alive = false;
    };
  }, [runId]);

  function share() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  if (notFound) {
    return (
      <Card>
        <CardHeader>
          <Badge variant="default">// 404</Badge>
          <CardTitle>Run not found</CardTitle>
          <CardDescription>
            <span className="font-mono">{runId}</span> is not in this deployment&apos;s in-memory run
            store. The store resets when the Vercel function instance recycles — runs are
            ephemeral by design until ERC-8004 attestation is wired.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/vault">
            <Button variant="default">
              <ArrowLeft className="w-3 h-3" />
              Trigger a fresh run
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!run) {
    return (
      <div className="flex items-center justify-center py-24">
        <Sparkles className="w-5 h-5 text-[var(--color-primary)] animate-pulse" />
      </div>
    );
  }

  // Reconstruct the state machine path from this run
  const visited: VaultState[] = ["Idle", "Analyzing", "Proposing", "Attesting"];
  if (run.risk.level === "trigger") visited.push("DefensiveExit");
  else visited.push("Allocated");
  visited.push("Completed");

  const allocStep = run.steps.find((s) => s.agent === "AllocatorAgent");
  const riskStep = run.steps.find((s) => s.agent === "RiskAgent");
  const reporterStep = run.steps.find((s) => s.agent === "ReporterAgent");

  const totalMs = run.finishedAt - run.startedAt;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-2">
            // permalink · orchestration run
          </p>
          <h1 className="display-2 !text-[40px] md:!text-[48px] leading-[1.05] mb-3">
            {run.risk.level === "trigger"
              ? "Defensive exit"
              : run.debate
                ? "Survived a veto"
                : "Clean allocation"}
          </h1>
          <p className="font-mono text-[12px] text-[var(--color-text-secondary)] break-all">
            {run.id}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="success">
            <ShieldCheck className="w-3 h-3" />
            {totalMs}ms
          </Badge>
          {run.totalCostCents !== undefined && (
            <Badge variant="default">
              <Coins className="w-3 h-3" />
              ${(run.totalCostCents / 100).toFixed(4)}
            </Badge>
          )}
          {run.debate && (
            <Badge variant="warning">
              <AlertTriangle className="w-3 h-3" />
              {run.debate.length} veto{run.debate.length === 1 ? "" : "es"}
            </Badge>
          )}
          <Link href={`/conversation/${run.id}`}>
            <Button variant="default" size="sm">
              Conversation view
            </Button>
          </Link>
          <Button onClick={share} variant="outline" size="sm">
            {copied ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
            {copied ? "Copied" : "Share"}
          </Button>
        </div>
      </div>

      {/* State machine path */}
      <Card>
        <CardHeader>
          <Badge variant="default">// vault state path</Badge>
          <CardTitle>{visited[visited.length - 1]}</CardTitle>
          <CardDescription>
            States the vault traversed during this run, reconstructed from the orchestrator events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StateMachineViz current={visited[visited.length - 1]} visited={visited} />
        </CardContent>
      </Card>

      {/* Debate transcript — only if vetoes happened */}
      {run.debate && run.debate.length > 0 && (
        <Card>
          <CardHeader>
            <Badge variant="warning">// agent debate transcript</Badge>
            <CardTitle>RiskAgent vetoed → AllocatorAgent re-drafted</CardTitle>
            <CardDescription>
              The exact text fed back into AllocatorAgent&apos;s system prompt as the re-draft
              constraint. This is the autonomy moment — one agent rejecting another&apos;s
              proposal under its own authority.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {run.debate.map((d, i) => (
              <div
                key={i}
                className="rounded-lg p-4 border border-amber-300 bg-amber-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-amber-700">
                    veto #{i + 1} · attempt {d.attempt}
                  </p>
                  <Badge variant={d.level === "trigger" ? "danger" : "warning"}>
                    {d.level}
                  </Badge>
                </div>
                <p className="font-mono text-[11px] leading-relaxed text-amber-900">
                  {d.vetoReason}
                </p>
              </div>
            ))}
            <div className="text-[12px] text-[var(--color-text-muted)] leading-relaxed">
              The orchestrator injects this string into AllocatorAgent&apos;s system prompt as a
              REJOINDER, instructing it to honour the veto. Up to 1 retry before the orchestrator
              accepts the trigger and proceeds to Reporter.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Three agent panels */}
      <div className="grid lg:grid-cols-3 gap-4">
        <AllocatorPanel proposal={run.proposal} step={allocStep} />
        <RiskPanel risk={run.risk} step={riskStep} />
        <ReporterPanel report={run.report} step={reporterStep} />
      </div>

      {/* Feeds at run time */}
      <Card>
        <CardHeader>
          <Badge variant="default">// feeds snapshot at run time</Badge>
          <CardTitle>Market state Claude saw</CardTitle>
          <CardDescription>
            Exact APYs and risk levels passed into the agent chain.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Feed name="USDY" apy={run.feeds.apys.usdy} risk={run.feeds.risk.usdyPeg} color={ASSET_COLORS.USDY} />
            <Feed name="mUSD" apy={run.feeds.apys.mUsd} risk={run.feeds.risk.mUsdPeg} color={ASSET_COLORS.mUSD} />
            <Feed name="Aave V3" apy={run.feeds.apys.aaveSupply} risk={run.feeds.risk.aaveOracle} color={ASSET_COLORS.Aave} />
            <Feed name="MI4" apy={run.feeds.apys.mi4Yield} risk={run.feeds.risk.mi4NAV} color={ASSET_COLORS.MI4} />
          </div>
          <p className="font-mono text-[10px] text-[var(--color-text-muted)] mt-3">
            captured {new Date(run.feeds.ts * 1000).toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Attestation trail */}
      <Card>
        <CardHeader>
          <Badge variant="default">// erc-8004 attestation trail</Badge>
          <CardTitle>
            <Activity className="w-4 h-4 inline-block mr-1.5 text-[var(--color-primary)]" />
            {run.steps.length} reputation events
          </CardTitle>
          <CardDescription>
            Each agent decision becomes a signed event. The hashes below would be emitted on Mantle
            via AtmaVault.sol in a production wire-up.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
            {run.steps.map((s, i) => {
              const isLast = i === run.steps.length - 1;
              const label =
                s.agent === "AllocatorAgent"
                  ? "ALLOCATE"
                  : s.agent === "RiskAgent"
                    ? run.risk.level === "ok"
                      ? "REPORT"
                      : run.risk.level === "warn"
                        ? "WARN"
                        : "DEFENSIVE_EXIT"
                    : "REPORT";
              return (
                <div
                  key={s.reasoningHash}
                  className={cn(
                    "grid grid-cols-[40px_1.4fr_1fr_2.5fr_0.8fr] px-4 py-3 items-center text-[12px] hover:bg-[var(--color-bg-soft)]",
                    !isLast && "border-b border-[var(--color-border)]",
                  )}
                >
                  <span className="font-mono text-[var(--color-text-faint)] tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Link
                    href={`/agents/${
                      s.agent === "AllocatorAgent"
                        ? "allocator"
                        : s.agent === "RiskAgent"
                          ? "risk"
                          : "reporter"
                    }`}
                    className="font-mono hover:text-[var(--color-primary)] transition-colors"
                  >
                    {s.agent}
                  </Link>
                  <Badge
                    variant={
                      label === "DEFENSIVE_EXIT"
                        ? "danger"
                        : label === "WARN"
                          ? "warning"
                          : label === "ALLOCATE"
                            ? "accent"
                            : "default"
                    }
                  >
                    {label}
                  </Badge>
                  <span className="font-mono text-[var(--color-primary)] truncate text-[11px]">
                    {s.reasoningHash.slice(0, 14)}…{s.reasoningHash.slice(-6)}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--color-text-muted)] tabular-nums text-right">
                    {s.durationMs}ms
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-4 text-[12px] text-[var(--color-text-muted)]">
        <Link href="/reports" className="inline-flex items-center gap-1 hover:text-[var(--color-text)]">
          <ArrowLeft className="w-3 h-3" />
          back to all runs
        </Link>
        <span>
          {new Date(run.startedAt).toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
//  Sub-components
// ───────────────────────────────────────────────────────────

function AllocatorPanel({
  proposal,
  step,
}: {
  proposal: Run["proposal"];
  step?: AgentStep;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="default">
            <Cpu className="w-3 h-3" />
            AllocatorAgent
          </Badge>
          {step && (
            <Badge variant="success">
              <ShieldCheck className="w-3 h-3" />
              {step.durationMs}ms
            </Badge>
          )}
        </div>
        <CardTitle className="!text-[17px]">Final allocation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(["USDY", "mUSD", "Aave", "MI4"] as const).map((asset) => {
              const idx =
                asset === "USDY"
                  ? "usdyBps"
                  : asset === "mUSD"
                    ? "mUsdBps"
                    : asset === "Aave"
                      ? "aaveBps"
                      : "mi4Bps";
              const bps = proposal.weights[idx];
              return (
                <MiniBar
                  key={asset}
                  name={asset}
                  bps={bps}
                  color={ASSET_COLORS[asset]}
                />
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <KV label="expected APY" value={`+${proposal.expectedAPYBps} bps`} primary />
            <KV label="risk score" value={`${proposal.riskScore} / 10`} />
          </div>
          <Reasoning text={proposal.reasoning} />
          {step && <HashRow hash={step.reasoningHash} />}
        </div>
      </CardContent>
    </Card>
  );
}

function RiskPanel({ risk, step }: { risk: Run["risk"]; step?: AgentStep }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="default">
            <ShieldCheck className="w-3 h-3" />
            RiskAgent
          </Badge>
          {step && (
            <Badge
              variant={
                risk.level === "trigger"
                  ? "danger"
                  : risk.level === "warn"
                    ? "warning"
                    : "success"
              }
            >
              {risk.level === "trigger" && <Skull className="w-3 h-3" />}
              {risk.level === "warn" && <AlertTriangle className="w-3 h-3" />}
              {risk.level === "ok" && <ShieldCheck className="w-3 h-3" />}
              {step.durationMs}ms
            </Badge>
          )}
        </div>
        <CardTitle className="!text-[17px]">
          {risk.level === "trigger"
            ? "Defensive exit"
            : risk.level === "warn"
              ? "Warning"
              : "All signals OK"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <KV label="signal" value={risk.signal} />
            <KV label="value" value={risk.value.toFixed(4)} />
            <KV label="threshold" value={risk.threshold.toFixed(4)} />
          </div>
          <Reasoning text={risk.reasoning} />
          {step && <HashRow hash={step.reasoningHash} />}
        </div>
      </CardContent>
    </Card>
  );
}

function ReporterPanel({
  report,
  step,
}: {
  report: Run["report"];
  step?: AgentStep;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="default">
            <FileBarChart className="w-3 h-3" />
            ReporterAgent
          </Badge>
          {step && (
            <Badge variant="success">
              <ShieldCheck className="w-3 h-3" />
              {step.durationMs}ms
            </Badge>
          )}
        </div>
        <CardTitle className="!text-[17px]">{report.periodLabel}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="rounded-lg p-3 bg-[var(--color-primary-soft)] border border-[var(--color-border-strong)]">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-1">
              actual APY annualised
            </p>
            <p className="text-[22px] font-medium tabular-nums">
              {(report.actualAPYBps / 100).toFixed(2)}%
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <KV label="vs nothing" value={`+${report.outperformanceBps.vsDoNothing}`} primary />
            <KV label="vs Aave" value={`${report.outperformanceBps.vsUsdcAaveOnly >= 0 ? "+" : ""}${report.outperformanceBps.vsUsdcAaveOnly}`} />
            <KV label="vs USDY" value={`${report.outperformanceBps.vsUsdyOnly >= 0 ? "+" : ""}${report.outperformanceBps.vsUsdyOnly}`} />
          </div>
          <Reasoning text={report.reasoning} />
          {step && <HashRow hash={step.reasoningHash} />}
        </div>
      </CardContent>
    </Card>
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

function KV({ label, value, primary }: { label: string; value: string; primary?: boolean }) {
  return (
    <div className="rounded-md p-2 bg-[var(--color-bg-soft)] border border-[var(--color-border)]">
      <p className="font-mono text-[9px] uppercase tracking-[0.06em] text-[var(--color-text-muted)] mb-1">{label}</p>
      <p className={cn("text-[13px] font-medium tabular-nums", primary && "text-[var(--color-primary)]")}>{value}</p>
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

function HashRow({ hash }: { hash: string }) {
  return (
    <div className="pt-2 border-t border-[var(--color-border)]">
      <p className="font-mono text-[9px] uppercase tracking-[0.06em] text-[var(--color-text-muted)] mb-1">
        SHA-256 reasoning hash
      </p>
      <p className="font-mono text-[10px] text-[var(--color-text-secondary)] break-all">{hash}</p>
    </div>
  );
}

function Feed({ name, apy, risk, color }: { name: string; apy: number; risk: string; color: string }) {
  return (
    <div className="rounded-lg p-3 border border-[var(--color-border)] bg-[var(--color-bg-card-soft)]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="block w-2 h-2 rounded-[1px]" style={{ background: color }} />
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--color-text-muted)]">{name}</span>
        </div>
        <Badge variant={risk === "trigger" ? "danger" : risk === "warn" ? "warning" : "success"}>{risk}</Badge>
      </div>
      <p className="text-[18px] font-medium tabular-nums">{(apy * 100).toFixed(2)}%</p>
    </div>
  );
}
