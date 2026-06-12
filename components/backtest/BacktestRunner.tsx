"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Play, Loader2, AlertTriangle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ───────────────────────────────────────────────────────────
//  Types — mirror /api/backtest/stream
// ───────────────────────────────────────────────────────────

type WeekPoint = {
  weekIdx: number;
  weeksAgo: number;
  apys: { usdy: number; mUsd: number; aaveSupply: number; mi4Yield: number };
  riskLevel: "ok" | "warn" | "trigger";
  weights: { usdyBps: number; mUsdBps: number; aaveBps: number; mi4Bps: number };
  expectedAPYBps: number;
  realisedReturnBps: number;
  navEnd: number;
  baselineNav: { doNothing: number; aaveOnly: number; usdyOnly: number };
  costCents: number;
  durationMs: number;
  reasoningHashes: string[];
  runId: string;
};

type AgentName = "AllocatorAgent" | "RiskAgent" | "ReporterAgent";

type Summary = {
  finalNavATMA: number;
  finalNavDoNothing: number;
  finalNavAaveOnly: number;
  finalNavUsdyOnly: number;
  cumulativeReturnBps: number;
  avgWeeklyBps: number;
  maxDrawdownBps: number;
  totalCostCents: number;
  defensiveExits: number;
};

type BacktestEvent =
  | { type: "start"; weeks: number; entry: number }
  | { type: "week-start"; weekIdx: number; weeksAgo: number }
  | { type: "token"; weekIdx: number; agent: AgentName; chunk: string }
  | { type: "agent-done"; weekIdx: number; agent: AgentName; durationMs: number }
  | { type: "week"; point: WeekPoint }
  | { type: "done"; summary: Summary }
  | { type: "error"; message: string };

const SERIES = {
  atma: { name: "ATMA", color: "#5b3df0", width: 2.4 },
  aaveOnly: { name: "USDC + Aave", color: "#fbbf24", width: 1.6 },
  usdyOnly: { name: "USDY only", color: "#a78bfa", width: 1.6 },
  doNothing: { name: "Do nothing", color: "#858585", width: 1.4 },
} as const;

// ───────────────────────────────────────────────────────────
//  BacktestRunner
// ───────────────────────────────────────────────────────────

export function BacktestRunner() {
  const [weeks, setWeeks] = useState(6);
  const [entry, setEntry] = useState<number>(10_000);
  const [points, setPoints] = useState<WeekPoint[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentWeek, setCurrentWeek] = useState<number | null>(null);
  const [currentAgent, setCurrentAgent] = useState<AgentName | null>(null);
  const [liveTokens, setLiveTokens] = useState<string>("");
  const abortRef = useRef<AbortController | null>(null);

  function reset() {
    setPoints([]);
    setSummary(null);
    setError(null);
    setCurrentWeek(null);
    setCurrentAgent(null);
    setLiveTokens("");
  }

  async function run() {
    reset();
    setStreaming(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/backtest/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weeks,
          targetAmountUsdc: String(Math.floor(entry * 1_000_000)),
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
        const chunks = buf.split("\n\n");
        buf = chunks.pop() ?? "";
        for (const chunk of chunks) {
          const dataLine = chunk.split("\n").find((l) => l.startsWith("data: "));
          if (!dataLine) continue;
          try {
            handleEvent(JSON.parse(dataLine.slice(6)) as BacktestEvent);
          } catch {}
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Unknown");
    } finally {
      setStreaming(false);
    }
  }

  function handleEvent(evt: BacktestEvent) {
    switch (evt.type) {
      case "start":
        return;
      case "week-start":
        setCurrentWeek(evt.weekIdx);
        setCurrentAgent("AllocatorAgent");
        setLiveTokens("");
        return;
      case "token":
        setCurrentAgent(evt.agent);
        setLiveTokens((s) => {
          const next = s + evt.chunk;
          return next.length > 800 ? "…" + next.slice(-800) : next;
        });
        return;
      case "agent-done":
        // Reset reasoning buffer on agent boundary so each agent gets its own panel
        setLiveTokens("");
        return;
      case "week":
        setPoints((arr) => [...arr, evt.point]);
        return;
      case "done":
        setSummary(evt.summary);
        setCurrentWeek(null);
        setCurrentAgent(null);
        return;
      case "error":
        setError(evt.message);
        return;
    }
  }

  function cancel() {
    abortRef.current?.abort();
    setStreaming(false);
  }

  return (
    <div className="space-y-6">
      {/* Control bar */}
      <Card>
        <CardHeader>
          <Badge variant="default">// backtest sandbox</Badge>
          <CardTitle>Replay N weeks with real Claude reasoning</CardTitle>
          <CardDescription>
            For each week, the orchestrator pulls a historical synthetic feed snapshot, then runs
            AllocatorAgent → RiskAgent → ReporterAgent against it. Realised returns are applied to
            the running NAV with weekly compounding. Three baselines compound alongside.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-12 gap-4">
            <div className="md:col-span-3 flex flex-col gap-2">
              <span className="text-[12px] font-medium">Starting deposit (USDC)</span>
              <input
                type="number"
                value={entry}
                onChange={(e) => setEntry(Number(e.target.value) || 10_000)}
                min={100}
                step={100}
                disabled={streaming}
                className="h-10 px-3 rounded-lg border border-[var(--color-border-strong)] bg-white font-mono text-[14px] tabular-nums focus:outline-none focus:border-[var(--color-primary)] disabled:opacity-50"
              />
            </div>
            <div className="md:col-span-6 flex flex-col gap-2">
              <span className="text-[12px] font-medium">
                Weeks ({weeks}) · ~{weeks * 8}s total run time
              </span>
              <input
                type="range"
                min={2}
                max={6}
                step={1}
                value={weeks}
                disabled={streaming}
                onChange={(e) => setWeeks(Number(e.target.value))}
                className="accent-[var(--color-primary)]"
              />
              <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
                <span>2</span>
                <span>4</span>
                <span>6</span>
              </div>
            </div>
            <div className="md:col-span-3 flex flex-col justify-end gap-2">
              {streaming ? (
                <Button onClick={cancel} variant="outline" size="lg">
                  Cancel
                </Button>
              ) : (
                <Button onClick={run} size="lg" className="w-full">
                  <Play />
                  Run backtest
                </Button>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg p-3 bg-red-50 border border-red-200 text-[13px] text-red-700 flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live chart */}
      {(points.length > 0 || streaming) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="default">// nav vs baselines</Badge>
              {streaming && (
                <Badge variant="accent">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  week {points.length + 1} of {weeks}
                </Badge>
              )}
            </div>
            <CardTitle>Compounded NAV over {weeks} weeks</CardTitle>
            <CardDescription>
              Each line is the running NAV under one strategy. ATMA = the agents&apos; live
              allocations; baselines compound at their feed APY.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BacktestChart points={points} entry={entry} weeks={weeks} />
            <Legend />
          </CardContent>
        </Card>
      )}

      {/* Live reasoning panel — only during streaming */}
      {streaming && currentWeek !== null && currentAgent && (
        <Card>
          <CardContent className="!pt-4 !pb-4">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="accent">
                <Loader2 className="w-3 h-3 animate-spin" />
                week {currentWeek + 1} · {currentAgent}
              </Badge>
              <span className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.06em]">
                claude is reasoning…
              </span>
            </div>
            <div className="rounded-lg p-3 bg-[var(--color-bg-invert)] border border-[var(--color-bg-invert-soft)] max-h-[160px] overflow-y-auto">
              <pre className="text-[10.5px] leading-[1.55] text-[var(--color-text-on-invert-soft)] font-mono whitespace-pre-wrap break-all">
                {liveTokens || "…"}
                {liveTokens.length > 0 && (
                  <span className="inline-block w-1.5 h-3 bg-[var(--color-accent)] ml-0.5 align-[-2px] animate-pulse" />
                )}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-week table */}
      {points.length > 0 && (
        <Card>
          <CardHeader>
            <Badge variant="default">// per-week breakdown</Badge>
            <CardTitle>Orchestration log</CardTitle>
            <CardDescription>
              Each row is a real run: 3 Claude calls, 3 reasoning hashes. Click a row to inspect.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PerWeekTable points={points} />
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {summary && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="default">// summary</Badge>
              <Badge variant="success">backtest complete</Badge>
            </div>
            <CardTitle>
              {summary.cumulativeReturnBps >= 0 ? "+" : ""}
              {summary.cumulativeReturnBps} bps cumulative over {weeks} weeks
            </CardTitle>
            <CardDescription>
              Numbers below are the realised picture, not the agents&apos; expected — what would
              actually have happened.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="final NAV (ATMA)" value={`$${summary.finalNavATMA.toFixed(2)}`} primary />
              <Stat label="vs do-nothing" value={`+${bpsDelta(summary.finalNavATMA, summary.finalNavDoNothing, entry)} bps`} />
              <Stat label="vs Aave only" value={`${bpsDelta(summary.finalNavATMA, summary.finalNavAaveOnly, entry) >= 0 ? "+" : ""}${bpsDelta(summary.finalNavATMA, summary.finalNavAaveOnly, entry)} bps`} />
              <Stat label="vs USDY only" value={`${bpsDelta(summary.finalNavATMA, summary.finalNavUsdyOnly, entry) >= 0 ? "+" : ""}${bpsDelta(summary.finalNavATMA, summary.finalNavUsdyOnly, entry)} bps`} />
              <Stat label="avg weekly bps" value={`${summary.avgWeeklyBps >= 0 ? "+" : ""}${summary.avgWeeklyBps}`} />
              <Stat label="max drawdown" value={`${summary.maxDrawdownBps} bps`} />
              <Stat label="defensive exits" value={String(summary.defensiveExits)} />
              <Stat label="run cost" value={`$${(summary.totalCostCents / 100).toFixed(3)}`} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────
//  Chart
// ───────────────────────────────────────────────────────────

function BacktestChart({
  points,
  entry,
  weeks,
}: {
  points: WeekPoint[];
  entry: number;
  weeks: number;
}) {
  // Domain
  const xs = Array.from({ length: weeks + 1 }, (_, i) => i);
  const series = {
    atma: [entry, ...points.map((p) => p.navEnd)],
    aaveOnly: [entry, ...points.map((p) => p.baselineNav.aaveOnly)],
    usdyOnly: [entry, ...points.map((p) => p.baselineNav.usdyOnly)],
    doNothing: [entry, ...points.map((p) => p.baselineNav.doNothing)],
  };
  const allVals = Object.values(series).flat();
  const yMin = Math.min(...allVals);
  const yMax = Math.max(...allVals);
  const yPad = Math.max((yMax - yMin) * 0.12, 1);

  const W = 880;
  const H = 320;
  const margin = { top: 20, right: 20, bottom: 36, left: 60 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;
  const xScale = (x: number) => margin.left + (x / weeks) * innerW;
  const yScale = (y: number) =>
    margin.top + innerH - ((y - (yMin - yPad)) / (yMax - yMin + 2 * yPad)) * innerH;

  const pathFor = (vals: number[]) =>
    vals
      .map((v, i) => `${i === 0 ? "M" : "L"} ${xScale(xs[i]).toFixed(1)} ${yScale(v).toFixed(1)}`)
      .join(" ");

  // Y-axis tick lines
  const yTicks = 4;
  const tickValues = Array.from({ length: yTicks + 1 }, (_, i) =>
    yMin - yPad + ((yMax - yMin + 2 * yPad) * i) / yTicks,
  );

  return (
    <div className="relative w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto min-w-[760px]">
        {/* Grid */}
        {tickValues.map((tv, i) => (
          <g key={i}>
            <line
              x1={margin.left}
              x2={W - margin.right}
              y1={yScale(tv)}
              y2={yScale(tv)}
              stroke="#f0f0f0"
              strokeDasharray="2 4"
            />
            <text
              x={margin.left - 8}
              y={yScale(tv) + 4}
              textAnchor="end"
              fontSize="10"
              fontFamily="ui-monospace, monospace"
              fill="#858585"
            >
              ${tv.toFixed(0)}
            </text>
          </g>
        ))}
        {xs.map((x) => (
          <g key={x}>
            <line
              x1={xScale(x)}
              x2={xScale(x)}
              y1={H - margin.bottom}
              y2={H - margin.bottom + 4}
              stroke="#e8e8e8"
            />
            <text
              x={xScale(x)}
              y={H - margin.bottom + 18}
              textAnchor="middle"
              fontSize="10"
              fontFamily="ui-monospace, monospace"
              fill="#858585"
            >
              w{x}
            </text>
          </g>
        ))}

        {/* Lines */}
        {(["doNothing", "aaveOnly", "usdyOnly", "atma"] as const).map((k) => (
          <path
            key={k}
            d={pathFor(series[k])}
            fill="none"
            stroke={SERIES[k].color}
            strokeWidth={SERIES[k].width}
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{ transition: "d 600ms cubic-bezier(0.16,1,0.3,1)" }}
          />
        ))}

        {/* End dot for ATMA */}
        {series.atma.length > 1 && (
          <circle
            cx={xScale(xs[series.atma.length - 1])}
            cy={yScale(series.atma[series.atma.length - 1])}
            r="4"
            fill={SERIES.atma.color}
            stroke="white"
            strokeWidth="2"
          />
        )}
      </svg>
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-mono">
      {(Object.keys(SERIES) as (keyof typeof SERIES)[]).map((k) => (
        <span key={k} className="flex items-center gap-2">
          <span
            className="block w-3 h-0.5 rounded-full"
            style={{ background: SERIES[k].color, height: SERIES[k].width }}
          />
          <span className="text-[var(--color-text-secondary)]">{SERIES[k].name}</span>
        </span>
      ))}
    </div>
  );
}

// ───────────────────────────────────────────────────────────
//  Per-week table
// ───────────────────────────────────────────────────────────

function PerWeekTable({ points }: { points: WeekPoint[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
      <div className="grid grid-cols-[50px_1fr_1fr_1.4fr_1fr_0.8fr_0.6fr] bg-[var(--color-bg-soft)] px-5 py-3 text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] font-mono">
        <span>wk</span>
        <span>allocation</span>
        <span>expected</span>
        <span>realised · risk</span>
        <span>NAV end</span>
        <span>ms</span>
        <span className="text-right" />
      </div>
      {points.map((p, i) => {
        const w = p.weights;
        const isOpen = expanded === i;
        return (
          <div key={i} className={cn(i < points.length - 1 && "border-b border-[var(--color-border)]")}>
            <button
              onClick={() => setExpanded(isOpen ? null : i)}
              className="grid grid-cols-[50px_1fr_1fr_1.4fr_1fr_0.8fr_0.6fr] px-5 py-3 items-center text-[12px] hover:bg-[var(--color-bg-soft)] transition-colors w-full text-left"
            >
              <span className="font-mono text-[var(--color-text-faint)] tabular-nums">
                w{p.weekIdx + 1}
              </span>
              <span className="flex items-center gap-1">
                <Pill name="U" pct={w.usdyBps / 100} color="#a78bfa" />
                <Pill name="m" pct={w.mUsdBps / 100} color="#84cc16" />
                <Pill name="A" pct={w.aaveBps / 100} color="#fbbf24" />
                <Pill name="4" pct={w.mi4Bps / 100} color="#f9a8d4" />
              </span>
              <span className="font-mono tabular-nums">
                +{p.expectedAPYBps} bps
              </span>
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "font-mono tabular-nums",
                    p.realisedReturnBps >= 0
                      ? "text-emerald-700"
                      : "text-red-700",
                  )}
                >
                  {p.realisedReturnBps >= 0 ? "+" : ""}
                  {p.realisedReturnBps} bps
                </span>
                <Badge
                  variant={
                    p.riskLevel === "trigger"
                      ? "danger"
                      : p.riskLevel === "warn"
                        ? "warning"
                        : "success"
                  }
                >
                  {p.riskLevel}
                </Badge>
              </span>
              <span className="font-mono tabular-nums">${p.navEnd.toFixed(2)}</span>
              <span className="font-mono text-[10px] text-[var(--color-text-muted)] tabular-nums">
                {p.durationMs}
              </span>
              <span className="text-right">
                <ChevronRight
                  className={cn(
                    "w-4 h-4 inline-block transition-transform text-[var(--color-text-muted)]",
                    isOpen && "rotate-90",
                  )}
                />
              </span>
            </button>
            {isOpen && (
              <div className="bg-[var(--color-bg-soft)] px-5 py-4 space-y-3 border-t border-[var(--color-border)]">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
                  <FeedCell label="USDY apy" value={`${(p.apys.usdy * 100).toFixed(2)}%`} />
                  <FeedCell label="mUSD apy" value={`${(p.apys.mUsd * 100).toFixed(2)}%`} />
                  <FeedCell label="Aave apy" value={`${(p.apys.aaveSupply * 100).toFixed(2)}%`} />
                  <FeedCell label="MI4 apy" value={`${(p.apys.mi4Yield * 100).toFixed(2)}%`} />
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.06em] text-[var(--color-text-muted)] mb-1">
                    SHA-256 reasoning hashes (3 agents)
                  </p>
                  {p.reasoningHashes.map((h, hi) => (
                    <p
                      key={hi}
                      className="font-mono text-[10px] text-[var(--color-text-secondary)] break-all"
                    >
                      {h}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Pill({ name, pct, color }: { name: string; pct: number; color: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[9px] tabular-nums",
        pct === 0 && "opacity-40",
      )}
      style={{ background: `${color}22`, color }}
    >
      <span className="block w-1 h-1 rounded-[1px]" style={{ background: color }} />
      {name}
      {pct.toFixed(0)}
    </span>
  );
}

function FeedCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md px-3 py-2 bg-white border border-[var(--color-border)]">
      <p className="font-mono text-[9px] uppercase tracking-[0.06em] text-[var(--color-text-muted)] mb-1">
        {label}
      </p>
      <p className="font-mono tabular-nums">{value}</p>
    </div>
  );
}

function Stat({ label, value, primary }: { label: string; value: string; primary?: boolean }) {
  return (
    <div className="rounded-lg p-4 border border-[var(--color-border)] bg-[var(--color-bg-card-soft)]">
      <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-text-muted)] mb-2">{label}</p>
      <p
        className={cn(
          "text-[18px] font-medium tabular-nums",
          primary && "text-[var(--color-primary)]",
        )}
      >
        {value}
      </p>
    </div>
  );
}

// Convert NAV difference into bps (relative to entry deposit)
function bpsDelta(navA: number, navB: number, entry: number): number {
  return Math.round(((navA - navB) / entry) * 10_000);
}
