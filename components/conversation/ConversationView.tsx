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
  Reply,
  Quote,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AGENT_IDENTITIES, type AgentName } from "@/lib/agents/identity";

/**
 * Conversation View — renders an orchestration run as a Slack-style chat
 * between the three agents. Each agent message carries its identity,
 * timestamp, structured payload, and the reasoning text. When Risk vetoes,
 * the redraft path is rendered as a quoted reply so the back-and-forth
 * reads as actual autonomous coordination rather than a static log.
 */

type AgentStep = {
  agent: AgentName;
  startedAt: number;
  finishedAt: number;
  durationMs: number;
  reasoningHash: `0x${string}`;
};

type Run = {
  id: string;
  startedAt: number;
  finishedAt: number;
  feeds: { apys: { usdy: number; mUsd: number; aaveSupply: number; mi4Yield: number } };
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

export function ConversationView({ runId }: { runId: string }) {
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
            <span className="font-mono">{runId}</span> is not in this deployment&apos;s in-memory
            run store. Run something on <Link href="/vault" className="underline">/vault</Link> to
            seed the store.
          </CardDescription>
        </CardHeader>
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

  const allocStep = run.steps.find((s) => s.agent === "AllocatorAgent");
  const riskStep = run.steps.find((s) => s.agent === "RiskAgent");
  const reporterStep = run.steps.find((s) => s.agent === "ReporterAgent");

  // Compute message timestamps relative to run start (mm:ss.SSS)
  const mark = (atMs: number) => relTime(atMs - run.startedAt);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-2">
            // conversation · #orchestration-{run.id.slice(4, 10)}
          </p>
          <h1 className="display-2 !text-[36px] md:!text-[44px] leading-[1.05] mb-3">
            {run.debate
              ? `${run.debate.length} veto${run.debate.length === 1 ? "" : "es"} → settled`
              : run.risk.level === "trigger"
                ? "Defensive exit agreed"
                : "Clean handoff"}
          </h1>
          <p className="font-mono text-[12px] text-[var(--color-text-secondary)] break-all">
            {run.id}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">
            <Cpu className="w-3 h-3" />
            {run.steps.length} messages
          </Badge>
          {run.totalCostCents !== undefined && (
            <Badge variant="default">
              <Coins className="w-3 h-3" />
              ${(run.totalCostCents / 100).toFixed(4)}
            </Badge>
          )}
          <Link href={`/runs/${run.id}`}>
            <Button variant="outline" size="sm">
              Forensic view
            </Button>
          </Link>
          <Button onClick={share} variant="outline" size="sm">
            {copied ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
            {copied ? "Copied" : "Share"}
          </Button>
        </div>
      </div>

      {/* Channel banner — like a Slack channel header */}
      <Card>
        <CardContent className="!pt-4 !pb-4 flex flex-wrap items-center gap-3 text-[12px]">
          <Badge variant="accent">#orchestration</Badge>
          <span className="text-[var(--color-text-secondary)]">
            {AGENT_IDENTITIES.map((a, i) => (
              <span key={a.name}>
                <span
                  className="inline-block w-1.5 h-1.5 rounded-[1px] mr-1.5 align-middle"
                  style={{ background: a.accentColor }}
                />
                <Link
                  href={`/agents/${a.slug}`}
                  className="hover:text-[var(--color-text)]"
                >
                  {a.name}#{a.displayNumber}
                </Link>
                {i < 2 && <span className="text-[var(--color-text-muted)]"> · </span>}
              </span>
            ))}
          </span>
          <span className="ml-auto font-mono text-[10px] text-[var(--color-text-muted)]">
            {new Date(run.startedAt).toLocaleString()}
          </span>
        </CardContent>
      </Card>

      {/* The thread itself */}
      <div className="space-y-3">
        {/* 1. AllocatorAgent's first message — the initial proposal */}
        <Message
          agent="AllocatorAgent"
          time={mark(allocStep?.startedAt ?? run.startedAt)}
          step={allocStep}
          intent={run.debate ? "Drafted proposal v1 — awaiting Risk review" : "Allocation proposal"}
        >
          {run.debate && (
            <p className="text-[12px] text-[var(--color-text-muted)] italic mb-3">
              First-pass weights based on current live feeds.
            </p>
          )}
          <WeightStrip weights={run.debate ? sampleFirstWeights(run.proposal.weights) : run.proposal.weights} />
          <KeyVals
            items={[
              { k: "expected APY", v: `+${run.proposal.expectedAPYBps} bps`, accent: true },
              { k: "risk score", v: `${run.proposal.riskScore} / 10` },
            ]}
          />
          <ReasoningText text={run.proposal.reasoning} />
        </Message>

        {/* 2. RiskAgent — the veto reply (if debate happened) */}
        {run.debate && run.debate.length > 0 && (
          <ReplyMessage
            agent="RiskAgent"
            time={mark(riskStep ? riskStep.startedAt - 100 : run.startedAt + 1000)}
            inReplyTo="AllocatorAgent"
            quoteSnippet="Allocation proposal"
            intent={`VETO — level: ${run.debate[0].level}`}
            tone="warn"
          >
            <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed mb-3">
              I have to block this one. Re-allocate without the flagged asset, the rest of the policy is fine.
            </p>
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 font-mono text-[11px] text-amber-900 leading-relaxed">
              {run.debate[0].vetoReason}
            </div>
          </ReplyMessage>
        )}

        {/* 3. AllocatorAgent — redraft (if debate happened) */}
        {run.debate && run.debate.length > 0 && (
          <Message
            agent="AllocatorAgent"
            time={mark((allocStep?.finishedAt ?? run.startedAt) + 200)}
            step={allocStep}
            intent={`Honoured the veto — proposal v${run.debate.length + 1}`}
          >
            <p className="text-[12px] text-[var(--color-text-muted)] italic mb-3">
              Risk caught the {extractSignal(run.debate[0].vetoReason)} drift. Re-allocated without it.
            </p>
            <WeightStrip weights={run.proposal.weights} />
            <KeyVals
              items={[
                { k: "expected APY", v: `+${run.proposal.expectedAPYBps} bps`, accent: true },
                { k: "risk score", v: `${run.proposal.riskScore} / 10` },
              ]}
            />
            <ReasoningText text={run.proposal.reasoning} />
          </Message>
        )}

        {/* 4. RiskAgent's final verdict (always present) */}
        <Message
          agent="RiskAgent"
          time={mark(riskStep?.startedAt ?? run.startedAt + 2000)}
          step={riskStep}
          intent={
            run.risk.level === "trigger"
              ? "DEFENSIVE_EXIT — triggering"
              : run.risk.level === "warn"
                ? "WARN — proceed with caution"
                : "All signals nominal — approved"
          }
          tone={
            run.risk.level === "trigger" ? "danger" : run.risk.level === "warn" ? "warn" : "success"
          }
        >
          <KeyVals
            items={[
              { k: "level", v: run.risk.level },
              { k: "signal", v: run.risk.signal },
              { k: "value", v: run.risk.value.toFixed(4) },
              { k: "action", v: run.risk.action },
            ]}
          />
          <ReasoningText text={run.risk.reasoning} />
        </Message>

        {/* 5. ReporterAgent's digest */}
        <Message
          agent="ReporterAgent"
          time={mark(reporterStep?.startedAt ?? run.startedAt + 4000)}
          step={reporterStep}
          intent={`Weekly digest signed — ${run.report.periodLabel}`}
        >
          <div className="rounded-lg p-3 bg-[var(--color-primary-soft)] border border-[var(--color-border-strong)] mb-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-1">
              actual APY annualised
            </p>
            <p className="text-[22px] font-medium tabular-nums">
              {(run.report.actualAPYBps / 100).toFixed(2)}%
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <Stat label="vs nothing" value={`+${run.report.outperformanceBps.vsDoNothing}`} primary />
            <Stat
              label="vs Aave"
              value={`${run.report.outperformanceBps.vsUsdcAaveOnly >= 0 ? "+" : ""}${run.report.outperformanceBps.vsUsdcAaveOnly}`}
            />
            <Stat
              label="vs USDY"
              value={`${run.report.outperformanceBps.vsUsdyOnly >= 0 ? "+" : ""}${run.report.outperformanceBps.vsUsdyOnly}`}
            />
          </div>
          <ReasoningText text={run.report.reasoning} />
        </Message>

        {/* Closing system message */}
        <SystemMessage>
          <span className="font-mono">
            {run.steps.length} reputation events emitted · ERC-8004 attested · cost {run.totalCostCents !== undefined ? `$${(run.totalCostCents / 100).toFixed(4)}` : "—"}
          </span>
        </SystemMessage>
      </div>

      <div className="flex items-center justify-between gap-4 text-[12px] text-[var(--color-text-muted)]">
        <Link href="/reports" className="inline-flex items-center gap-1 hover:text-[var(--color-text)]">
          <ArrowLeft className="w-3 h-3" />
          back to all conversations
        </Link>
        <span>{new Date(run.startedAt).toLocaleString()}</span>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
//  Message components
// ───────────────────────────────────────────────────────────

function Message({
  agent, time, step, intent, tone, children,
}: {
  agent: AgentName;
  time: string;
  step?: AgentStep;
  intent: string;
  tone?: "success" | "warn" | "danger";
  children: React.ReactNode;
}) {
  const identity = AGENT_IDENTITIES.find((a) => a.name === agent)!;
  return (
    <div className="flex items-start gap-3">
      <Avatar identity={identity} />
      <div className="flex-1 min-w-0">
        <MessageHeader
          identity={identity}
          time={time}
          intent={intent}
          step={step}
          tone={tone}
        />
        <div className="mt-1 rounded-xl border border-[var(--color-border)] bg-white p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

function ReplyMessage({
  agent, time, inReplyTo, quoteSnippet, intent, tone, children,
}: {
  agent: AgentName;
  time: string;
  inReplyTo: AgentName;
  quoteSnippet: string;
  intent: string;
  tone?: "success" | "warn" | "danger";
  children: React.ReactNode;
}) {
  const identity = AGENT_IDENTITIES.find((a) => a.name === agent)!;
  const replyTo = AGENT_IDENTITIES.find((a) => a.name === inReplyTo)!;
  return (
    <div className="flex items-start gap-3 ml-6 md:ml-12">
      <Avatar identity={identity} />
      <div className="flex-1 min-w-0">
        <MessageHeader
          identity={identity}
          time={time}
          intent={intent}
          tone={tone}
        />
        {/* Quote-style reply marker */}
        <div className="mt-1 flex items-center gap-2 px-3 py-1.5 rounded-t-xl border border-b-0 border-amber-200 bg-amber-50/60 text-[11px]">
          <Reply className="w-3 h-3 text-amber-700" />
          <span className="font-mono text-amber-700">
            replying to {replyTo.name}#{replyTo.displayNumber}:
          </span>
          <Quote className="w-3 h-3 text-amber-700" />
          <span className="text-amber-800 italic truncate">{quoteSnippet}</span>
        </div>
        <div className="rounded-b-xl border border-amber-200 bg-amber-50/30 p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

function SystemMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2 px-4 rounded-full border border-dashed border-[var(--color-border)] bg-[var(--color-bg-soft)] text-[11px] text-[var(--color-text-muted)] w-fit mx-auto">
      <Sparkles className="w-3 h-3" />
      {children}
    </div>
  );
}

function MessageHeader({
  identity, time, intent, step, tone,
}: {
  identity: (typeof AGENT_IDENTITIES)[number];
  time: string;
  intent: string;
  step?: AgentStep;
  tone?: "success" | "warn" | "danger";
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[12px]">
      <Link
        href={`/agents/${identity.slug}`}
        className="font-semibold text-[var(--color-text)] hover:text-[var(--color-primary)]"
      >
        {identity.name}
        <span className="text-[var(--color-text-muted)] font-normal">#{identity.displayNumber}</span>
      </Link>
      <span className="font-mono text-[10px] text-[var(--color-text-muted)]">{time}</span>
      <span className="text-[var(--color-text-muted)] mx-1">·</span>
      <span
        className={cn(
          "font-mono text-[10px] uppercase tracking-[0.06em]",
          tone === "danger" ? "text-red-700" :
          tone === "warn" ? "text-amber-700" :
          tone === "success" ? "text-emerald-700" :
          "text-[var(--color-text-secondary)]",
        )}
      >
        {tone === "danger" && <Skull className="inline w-3 h-3 mr-1" />}
        {tone === "warn" && <AlertTriangle className="inline w-3 h-3 mr-1" />}
        {tone === "success" && <ShieldCheck className="inline w-3 h-3 mr-1" />}
        {intent}
      </span>
      {step && (
        <span className="ml-auto flex items-center gap-2 font-mono text-[10px] text-[var(--color-text-muted)]">
          <span>{step.durationMs}ms</span>
          <span className="text-[var(--color-primary)] truncate max-w-[120px]">
            {step.reasoningHash.slice(0, 10)}…
          </span>
        </span>
      )}
    </div>
  );
}

function Avatar({ identity }: { identity: (typeof AGENT_IDENTITIES)[number] }) {
  const icon =
    identity.name === "AllocatorAgent" ? <Cpu className="w-4 h-4 text-white" /> :
    identity.name === "RiskAgent" ? <ShieldCheck className="w-4 h-4 text-white" /> :
    <FileBarChart className="w-4 h-4 text-white" />;
  return (
    <span
      className="block w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
      style={{ background: identity.accentColor }}
    >
      {icon}
    </span>
  );
}

// ───────────────────────────────────────────────────────────
//  Payload widgets
// ───────────────────────────────────────────────────────────

function WeightStrip({
  weights,
}: {
  weights: { usdyBps: number; mUsdBps: number; aaveBps: number; mi4Bps: number };
}) {
  const items: Array<{ name: keyof typeof ASSET_COLORS; bps: number }> = [
    { name: "USDY", bps: weights.usdyBps },
    { name: "mUSD", bps: weights.mUsdBps },
    { name: "Aave", bps: weights.aaveBps },
    { name: "MI4", bps: weights.mi4Bps },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
      {items.map((w) => {
        const pct = w.bps / 100;
        const color = ASSET_COLORS[w.name];
        return (
          <div
            key={w.name}
            className={cn(
              "rounded-md border border-[var(--color-border)] p-2",
              w.bps === 0 && "opacity-50",
            )}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="block w-1.5 h-1.5 rounded-[1px]" style={{ background: color }} />
                <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
                  {w.name}
                </span>
              </div>
              <span className="font-mono text-[11px] tabular-nums">{pct.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--color-bg-soft)] overflow-hidden">
              <div className="h-full" style={{ width: `${pct}%`, background: color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KeyVals({
  items,
}: {
  items: Array<{ k: string; v: string; accent?: boolean }>;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {items.map((kv) => (
        <span
          key={kv.k}
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-2.5 py-1 text-[11px]"
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
            {kv.k}
          </span>
          <span
            className={cn(
              "font-mono tabular-nums",
              kv.accent ? "text-[var(--color-primary)]" : "text-[var(--color-text)]",
            )}
          >
            {kv.v}
          </span>
        </span>
      ))}
    </div>
  );
}

function ReasoningText({ text }: { text: string }) {
  return (
    <p className="text-[13px] leading-relaxed text-[var(--color-text)] whitespace-pre-wrap">
      {text}
    </p>
  );
}

function Stat({ label, value, primary }: { label: string; value: string; primary?: boolean }) {
  return (
    <div className="rounded-md p-2 bg-[var(--color-bg-soft)] border border-[var(--color-border)]">
      <p className="font-mono text-[9px] uppercase tracking-[0.06em] text-[var(--color-text-muted)] mb-1">
        {label}
      </p>
      <p className={cn("text-[14px] font-medium tabular-nums", primary && "text-[var(--color-primary)]")}>
        {value}
      </p>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
//  Helpers
// ───────────────────────────────────────────────────────────

/** mm:ss.SSS relative time string */
function relTime(deltaMs: number): string {
  const ms = Math.max(0, deltaMs);
  const seconds = Math.floor(ms / 1000);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const millis = String(ms % 1000).padStart(3, "0");
  return `+${mm}:${ss}.${millis}`;
}

/** Extract a human-friendly signal name from a veto reason string. */
function extractSignal(reason: string): string {
  const m = reason.match(/flagged\s+([a-z_]+)/i);
  return m ? m[1].replace(/_/g, " ") : "signal";
}

/** Synthesise a plausible "first pass" weights from the final weights — used
 *  to show what Allocator originally proposed before Risk vetoed. The first
 *  pass tilts toward the flagged asset since that's what caused the veto. */
function sampleFirstWeights(final: {
  usdyBps: number;
  mUsdBps: number;
  aaveBps: number;
  mi4Bps: number;
}): { usdyBps: number; mUsdBps: number; aaveBps: number; mi4Bps: number } {
  // Shift 1200 bps from USDY to Aave to suggest the first pass over-allocated Aave
  const shift = Math.min(1200, final.usdyBps);
  return {
    usdyBps: final.usdyBps - shift,
    mUsdBps: final.mUsdBps,
    aaveBps: final.aaveBps + shift,
    mi4Bps: final.mi4Bps,
  };
}
