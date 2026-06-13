"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, FileText, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ───────────────────────────────────────────────────────────
//  Types — mirror what /api/runs returns
// ───────────────────────────────────────────────────────────

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
  proposal: { reasoning: string };
  risk: { level: "ok" | "warn" | "trigger"; reasoning: string };
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
};

type Aggregate = {
  runCount: number;
  totalAttestations: number;
  latest: Run;
  actualAPYBps: number;
  outperformanceBps: {
    vsDoNothing: number;
    vsUsdcAaveOnly: number;
    vsUsdyOnly: number;
  };
};

type RunsResponse = {
  data: { runs: Run[]; aggregate: Aggregate | null; total: number };
  error: string | null;
};

// ───────────────────────────────────────────────────────────
//  ReportsDashboard
// ───────────────────────────────────────────────────────────

export function ReportsDashboard() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [aggregate, setAggregate] = useState<Aggregate | null>(null);
  const [loading, setLoading] = useState(true);
  const [orchestrating, setOrchestrating] = useState(false);

  async function fetchRuns() {
    try {
      const res = await fetch("/api/runs");
      const j = (await res.json()) as RunsResponse;
      setRuns(j.data.runs);
      setAggregate(j.data.aggregate);
    } catch {
      /* swallow — keeps existing state */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRuns();
    const id = window.setInterval(fetchRuns, 8_000);
    return () => window.clearInterval(id);
  }, []);

  async function triggerRun() {
    setOrchestrating(true);
    try {
      await fetch("/api/orchestrate", { method: "POST", body: "{}" });
      await fetchRuns();
    } finally {
      setOrchestrating(false);
    }
  }

  function exportCSV() {
    const header = "agent,timestamp,duration_ms,event,reasoning_hash\n";
    const rows = runs.flatMap((r) =>
      r.steps.map((s, i) => {
        const label =
          i === 0
            ? "ALLOCATE"
            : i === 1
              ? r.risk.level === "ok"
                ? "APPROVE"
                : r.risk.level === "warn"
                  ? "WARN"
                  : "DEFENSIVE_EXIT"
              : "REPORT";
        return [
          s.agent,
          new Date(s.startedAt).toISOString(),
          s.durationMs,
          label,
          s.reasoningHash,
        ].join(",");
      }),
    );
    const blob = new Blob([header + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `amana-attestations-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Sparkles className="w-5 h-5 text-[var(--color-primary)] animate-pulse" />
      </div>
    );
  }

  // Empty state — no runs in the store yet
  if (!aggregate) {
    return (
      <Card>
        <CardHeader>
          <Badge variant="default">// reports</Badge>
          <CardTitle>No orchestration runs yet</CardTitle>
          <CardDescription>
            Reports are computed from real agent runs. Trigger one below or go to{" "}
            <a href="/vault" className="underline">
              /vault
            </a>{" "}
            to watch the agents work live.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={triggerRun} disabled={orchestrating} size="lg">
            {orchestrating ? "Running…" : "Run an orchestration"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const out = aggregate.actualAPYBps - aggregate.outperformanceBps.vsDoNothing;
  return (
    <div className="space-y-8">
      {/* Headline metric — pulled from latest run */}
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="default">// {aggregate.latest.report.periodLabel}</Badge>
            <Badge variant="success">
              <TrendingUp className="w-3 h-3" />
              live · {aggregate.runCount} run{aggregate.runCount === 1 ? "" : "s"}
            </Badge>
          </div>
          <CardTitle>
            +{aggregate.outperformanceBps.vsDoNothing} bps annualized vs do-nothing
          </CardTitle>
          <CardDescription>
            Actual {(aggregate.actualAPYBps / 100).toFixed(2)}% APY against three
            baselines. All outperformance figures attested via ERC-8004
            ReputationRegistry. Recomputed on every orchestration run.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <BaselineCard
              label="vs do-nothing"
              baselineBps={0}
              actualBps={aggregate.actualAPYBps}
              accent
            />
            <BaselineCard
              label="vs USDC + Aave"
              baselineBps={aggregate.actualAPYBps - aggregate.outperformanceBps.vsUsdcAaveOnly}
              actualBps={aggregate.actualAPYBps}
            />
            <BaselineCard
              label="vs USDY only"
              baselineBps={aggregate.actualAPYBps - aggregate.outperformanceBps.vsUsdyOnly}
              actualBps={aggregate.actualAPYBps}
            />
          </div>
          <div className="sr-only">{out}</div>
        </CardContent>
      </Card>

      {/* Reporter reasoning */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="default">// reporter agent reasoning</Badge>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="w-3 h-3" />
              Export CSV
            </Button>
          </div>
          <CardTitle>Weekly digest</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg p-5 bg-[var(--color-bg-invert)] border border-[var(--color-bg-invert-soft)]">
            <p className="text-[14px] leading-relaxed text-[var(--color-text-on-invert)]">
              {aggregate.latest.report.reasoning}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Attestation feed — real */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="default">// erc-8004 attestation feed</Badge>
            <Badge variant="outline">
              <FileText className="w-3 h-3" />
              {aggregate.totalAttestations} events
            </Badge>
          </div>
          <CardTitle>On-chain reputation events</CardTitle>
          <CardDescription>
            Every decision is signed by an agent identity and emitted as a
            ReputationEvent. The feed below is sourced from this deployment&apos;s
            actual orchestration history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
            <div className="grid grid-cols-[60px_1.4fr_1.2fr_1.4fr_2.2fr_0.6fr] bg-[var(--color-bg-soft)] px-5 py-3 text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] font-mono">
              <span>#</span>
              <span>agent</span>
              <span>event</span>
              <span>hash</span>
              <span>at</span>
              <span className="text-right">ms</span>
            </div>
            {flattenSteps(runs)
              .slice(0, 15)
              .map((s, i, arr) => (
                <a
                  key={`${s.runId}-${s.idx}`}
                  href={`/runs/${s.runId}`}
                  className={cn(
                    "grid grid-cols-[60px_1.4fr_1.2fr_1.4fr_2.2fr_0.6fr] px-5 py-3 items-center text-[12px] hover:bg-[var(--color-bg-soft)] transition-colors",
                    i < arr.length - 1 && "border-b border-[var(--color-border)]",
                  )}
                >
                  <span className="font-mono text-[var(--color-text-faint)] tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex items-center gap-2">
                    <span
                      className="block w-2 h-2 rounded-full"
                      style={{
                        background:
                          s.agent === "AllocatorAgent"
                            ? "#a78bfa"
                            : s.agent === "RiskAgent"
                              ? "#fbbf24"
                              : "#84cc16",
                      }}
                    />
                    <span className="font-mono">{s.agent}</span>
                  </span>
                  <Badge
                    variant={
                      s.label === "DEFENSIVE_EXIT"
                        ? "danger"
                        : s.label === "WARN"
                          ? "warning"
                          : s.label === "ALLOCATE"
                            ? "accent"
                            : s.label === "APPROVE" ? "success" : "default"
                    }
                  >
                    {s.label}
                  </Badge>
                  <span className="font-mono text-[var(--color-primary)] truncate text-[11px]">
                    {s.reasoningHash.slice(0, 12)}…{s.reasoningHash.slice(-6)}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--color-text-muted)] tabular-nums">
                    {new Date(s.startedAt).toLocaleString()}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--color-text-muted)] tabular-nums text-right">
                    {s.durationMs}
                  </span>
                </a>
              ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-text-faint)]">
              // showing latest {Math.min(15, flattenSteps(runs).length)} of {aggregate.totalAttestations}
            </p>
            <Button variant="link" size="sm" onClick={triggerRun} disabled={orchestrating}>
              {orchestrating ? "Running…" : "Trigger another run"}
              <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
//  Helpers
// ───────────────────────────────────────────────────────────

type FlatStep = {
  runId: string;
  idx: number;
  agent: AgentStep["agent"];
  startedAt: number;
  durationMs: number;
  reasoningHash: `0x${string}`;
  label: "ALLOCATE" | "APPROVE" | "REPORT" | "WARN" | "DEFENSIVE_EXIT";
};

function flattenSteps(runs: Run[]): FlatStep[] {
  const out: FlatStep[] = [];
  for (const r of runs) {
    for (let i = 0; i < r.steps.length; i++) {
      const s = r.steps[i];
      const label =
        i === 0
          ? "ALLOCATE"
          : i === 1
            ? r.risk.level === "ok"
              ? "APPROVE"
              : r.risk.level === "warn"
                ? "WARN"
                : "DEFENSIVE_EXIT"
            : "REPORT";
      out.push({
        runId: r.id,
        idx: i,
        agent: s.agent,
        startedAt: s.startedAt,
        durationMs: s.durationMs,
        reasoningHash: s.reasoningHash,
        label,
      });
    }
  }
  return out;
}

function BaselineCard({
  label,
  baselineBps,
  actualBps,
  accent,
}: {
  label: string;
  baselineBps: number;
  actualBps: number;
  accent?: boolean;
}) {
  const delta = actualBps - baselineBps;
  return (
    <div className="rounded-lg p-5 border border-[var(--color-border)] bg-[var(--color-bg-card-soft)]">
      <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-3">
        {label}
      </p>
      <div className="flex items-baseline gap-2 mb-2">
        <p
          className={cn(
            "text-[28px] font-medium tabular-nums leading-none",
            accent ? "text-[var(--color-primary)]" : "text-[var(--color-text)]",
          )}
        >
          {delta > 0 ? "+" : ""}
          {delta} bps
        </p>
      </div>
      <p className="text-[11px] font-mono text-[var(--color-text-muted)] tabular-nums">
        actual {(actualBps / 100).toFixed(2)}% · baseline {(baselineBps / 100).toFixed(2)}%
      </p>
    </div>
  );
}
