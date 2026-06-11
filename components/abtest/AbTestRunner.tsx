"use client";

import { useRef, useState } from "react";
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
  Loader2,
  Play,
  Trophy,
  AlertTriangle,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ───────────────────────────────────────────────────────────
//  Types
// ───────────────────────────────────────────────────────────

type Weights = { usdyBps: number; mUsdBps: number; aaveBps: number; mi4Bps: number };

type SideResult = {
  expectedAPYBps: number;
  weights: Weights;
  riskScore: number;
  reasoning: string;
  reasoningHash: string;
  durationMs: number;
  costCents: number;
};

type RoundResult = {
  roundIdx: number;
  weeksAgo: number;
  feeds: { apys: { usdy: number; mUsd: number; aaveSupply: number; mi4Yield: number } };
  a: SideResult;
  b: SideResult;
  winner: "A" | "B" | "tie";
};

type Summary = {
  rounds: number;
  avgAPYBpsA: number;
  avgAPYBpsB: number;
  winsA: number;
  winsB: number;
  ties: number;
  totalCostCents: number;
  winnerOverall: "A" | "B" | "tie";
};

type AbEvent =
  | { type: "start"; rounds: number }
  | { type: "round-start"; roundIdx: number; weeksAgo: number }
  | { type: "round"; result: RoundResult }
  | { type: "done"; summary: Summary }
  | { type: "error"; message: string };

const ASSET_COLORS: Record<string, string> = {
  USDY: "#a78bfa",
  mUSD: "#84cc16",
  Aave: "#fbbf24",
  MI4: "#f9a8d4",
};

// ───────────────────────────────────────────────────────────
//  AbTestRunner
// ───────────────────────────────────────────────────────────

export function AbTestRunner({ baselineSkill }: { baselineSkill: string }) {
  const [skillA, setSkillA] = useState(baselineSkill);
  const [skillB, setSkillB] = useState(
    // Default B variant: same policy with a more conservative MI4 cap example,
    // gives the user something interesting to compare immediately.
    baselineSkill +
      "\n\n## Override\n- Cap MI4 at 0 bps for this experiment.\n- Bias toward USDY when Aave APY < 5.5%.\n",
  );
  const [rounds, setRounds] = useState(4);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [currentRound, setCurrentRound] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  function reset() {
    setResults([]);
    setSummary(null);
    setCurrentRound(null);
    setError(null);
  }

  function resetB() {
    setSkillB(baselineSkill);
  }

  async function run() {
    reset();
    setStreaming(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/abtest/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rounds, skillA, skillB }),
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
          const line = chunk.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          try { handle(JSON.parse(line.slice(6)) as AbEvent); } catch {}
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Unknown");
    } finally {
      setStreaming(false);
    }
  }

  function handle(evt: AbEvent) {
    switch (evt.type) {
      case "round-start": setCurrentRound(evt.roundIdx); return;
      case "round":       setResults((arr) => [...arr, evt.result]); return;
      case "done":        setSummary(evt.summary); setCurrentRound(null); return;
      case "error":       setError(evt.message); return;
      default: return;
    }
  }

  function cancel() { abortRef.current?.abort(); setStreaming(false); }

  const isDirtyB = skillB !== baselineSkill;

  return (
    <div className="space-y-6">
      {/* Skill editors */}
      <div className="grid lg:grid-cols-2 gap-4">
        <SkillEditor
          label="Skill A (baseline)"
          value={skillA}
          onChange={setSkillA}
          disabled={streaming}
          tone="neutral"
        />
        <SkillEditor
          label={isDirtyB ? "Skill B (experiment)" : "Skill B (identical to A)"}
          value={skillB}
          onChange={setSkillB}
          disabled={streaming}
          tone="experiment"
          showReset={isDirtyB}
          onReset={resetB}
        />
      </div>

      {/* Control bar */}
      <Card>
        <CardContent className="!pt-4 !pb-4">
          <div className="grid md:grid-cols-12 gap-4">
            <div className="md:col-span-7 flex flex-col gap-2">
              <span className="text-[12px] font-medium">
                Rounds ({rounds}) · {rounds * 2} Claude calls · ~{rounds * 4}s
              </span>
              <input
                type="range"
                min={2}
                max={8}
                value={rounds}
                disabled={streaming}
                onChange={(e) => setRounds(Number(e.target.value))}
                className="accent-[var(--color-primary)]"
              />
              <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
                <span>2</span>
                <span>4</span>
                <span>8</span>
              </div>
            </div>
            <div className="md:col-span-5 flex items-end gap-2">
              {streaming ? (
                <Button onClick={cancel} variant="outline" size="lg" className="w-full">
                  Cancel
                </Button>
              ) : (
                <Button onClick={run} size="lg" className="w-full" disabled={!isDirtyB && results.length === 0}>
                  <Play />
                  {isDirtyB ? "Run A/B test" : "Edit Skill B first ↑"}
                </Button>
              )}
            </div>
          </div>
          {error && (
            <div className="mt-3 rounded-lg p-3 bg-red-50 border border-red-200 text-[13px] text-red-700 flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live chart */}
      {(results.length > 0 || streaming) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="default">// expected APY per round</Badge>
              {streaming && currentRound !== null && (
                <Badge variant="accent">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  round {currentRound + 1} of {rounds}
                </Badge>
              )}
            </div>
            <CardTitle>
              {summary
                ? `${summary.winnerOverall === "A" ? "A wins" : summary.winnerOverall === "B" ? "B wins" : "Tie"} · avg A=${summary.avgAPYBpsA} / B=${summary.avgAPYBpsB}`
                : "Running comparison…"}
            </CardTitle>
            <CardDescription>
              Bars are expected APY in basis points per round. Same input each round; difference reflects policy alone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AbChart results={results} rounds={rounds} />
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-mono">
              <LegendDot color="#0a0a0a" label="Skill A (baseline)" />
              <LegendDot color="#5b3df0" label="Skill B (experiment)" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-round table */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <Badge variant="default">// per-round breakdown</Badge>
            <CardTitle>Round log</CardTitle>
            <CardDescription>
              Each row is a real Claude reasoning pair. Click an APY value to expand the proposal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RoundsTable results={results} />
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {summary && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="default">// scoreboard</Badge>
              <Badge variant="success">
                <Sparkles className="w-3 h-3" />
                test complete
              </Badge>
            </div>
            <CardTitle className="flex items-center gap-3">
              {summary.winnerOverall === "tie" ? (
                "Statistical tie"
              ) : (
                <>
                  <Trophy className="w-6 h-6 text-[var(--color-primary)]" />
                  Skill {summary.winnerOverall} wins on average
                </>
              )}
            </CardTitle>
            <CardDescription>
              Run more rounds for a tighter confidence. Defensive exits and round-by-round variance are visible above.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="rounds" value={String(summary.rounds)} />
              <Stat label="avg APY · A" value={`${summary.avgAPYBpsA} bps`} primary={summary.winnerOverall === "A"} />
              <Stat label="avg APY · B" value={`${summary.avgAPYBpsB} bps`} primary={summary.winnerOverall === "B"} />
              <Stat
                label="A wins / B wins / tie"
                value={`${summary.winsA} / ${summary.winsB} / ${summary.ties}`}
              />
              <Stat
                label="total cost"
                value={`$${(summary.totalCostCents / 100).toFixed(4)}`}
              />
              <Stat
                label="avg delta (B − A)"
                value={`${summary.avgAPYBpsB - summary.avgAPYBpsA >= 0 ? "+" : ""}${summary.avgAPYBpsB - summary.avgAPYBpsA} bps`}
                primary
              />
              <div className="rounded-lg p-4 border border-[var(--color-border)] bg-[var(--color-bg-card-soft)] col-span-2 flex items-center justify-end">
                <Button variant="outline" size="sm" onClick={reset}>
                  <RotateCcw className="w-3 h-3" />
                  Clear results
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────
//  Sub-components
// ───────────────────────────────────────────────────────────

function SkillEditor({
  label, value, onChange, disabled, tone, showReset, onReset,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  tone: "neutral" | "experiment";
  showReset?: boolean;
  onReset?: () => void;
}) {
  return (
    <Card className={cn(tone === "experiment" && "border-[var(--color-primary)]")}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-soft)]">
        <div className="flex items-center gap-2">
          <Badge variant={tone === "experiment" ? "accent" : "default"}>{label}</Badge>
          <span className="font-mono text-[10px] text-[var(--color-text-muted)]">
            {value.split("\n").length}L · {value.length}c
          </span>
        </div>
        {showReset && onReset && (
          <Button variant="ghost" size="sm" onClick={onReset} disabled={disabled}>
            <RotateCcw className="w-3 h-3" />
            Reset to A
          </Button>
        )}
      </div>
      <CardContent className="!p-0">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          spellCheck={false}
          className="w-full min-h-[280px] p-5 font-mono text-[11.5px] leading-[1.6] bg-white focus:outline-none focus:bg-[var(--color-bg-soft)] resize-y disabled:opacity-60"
        />
      </CardContent>
    </Card>
  );
}

function AbChart({ results, rounds }: { results: RoundResult[]; rounds: number }) {
  const all = results.flatMap((r) => [r.a.expectedAPYBps, r.b.expectedAPYBps]);
  const yMax = Math.max(550, ...all);
  const W = 760;
  const H = 240;
  const margin = { top: 20, right: 20, bottom: 36, left: 50 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;
  const slotW = innerW / rounds;
  const barW = (slotW - 12) / 2;
  const yScale = (v: number) => margin.top + innerH - (v / yMax) * innerH;

  return (
    <div className="relative w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto min-w-[600px]">
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
          const v = p * yMax;
          return (
            <g key={i}>
              <line
                x1={margin.left}
                x2={W - margin.right}
                y1={yScale(v)}
                y2={yScale(v)}
                stroke="#f0f0f0"
                strokeDasharray="2 4"
              />
              <text
                x={margin.left - 8}
                y={yScale(v) + 4}
                textAnchor="end"
                fontSize="9"
                fontFamily="ui-monospace, monospace"
                fill="#858585"
              >
                {Math.round(v)}
              </text>
            </g>
          );
        })}
        {Array.from({ length: rounds }).map((_, i) => {
          const r = results[i];
          const x0 = margin.left + i * slotW + 6;
          return (
            <g key={i}>
              <text
                x={margin.left + i * slotW + slotW / 2}
                y={H - margin.bottom + 18}
                textAnchor="middle"
                fontSize="10"
                fontFamily="ui-monospace, monospace"
                fill="#858585"
              >
                r{i + 1}
              </text>
              {r && (
                <>
                  <rect
                    x={x0}
                    y={yScale(r.a.expectedAPYBps)}
                    width={barW}
                    height={innerH - (yScale(r.a.expectedAPYBps) - margin.top)}
                    fill="#0a0a0a"
                    style={{ transition: "all 600ms cubic-bezier(0.16,1,0.3,1)" }}
                  />
                  <rect
                    x={x0 + barW + 4}
                    y={yScale(r.b.expectedAPYBps)}
                    width={barW}
                    height={innerH - (yScale(r.b.expectedAPYBps) - margin.top)}
                    fill={r.winner === "B" ? "#5b3df0" : "#a78bfa"}
                    style={{ transition: "all 600ms cubic-bezier(0.16,1,0.3,1)" }}
                  />
                  {r.winner !== "tie" && (
                    <text
                      x={x0 + slotW / 2 - 6}
                      y={Math.min(yScale(r.a.expectedAPYBps), yScale(r.b.expectedAPYBps)) - 4}
                      textAnchor="middle"
                      fontSize="9"
                      fontFamily="ui-monospace, monospace"
                      fill={r.winner === "A" ? "#0a0a0a" : "#5b3df0"}
                    >
                      {r.winner} +{Math.abs(r.a.expectedAPYBps - r.b.expectedAPYBps)}
                    </text>
                  )}
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="block w-2.5 h-2.5 rounded-[2px]" style={{ background: color }} />
      <span className="text-[var(--color-text-secondary)]">{label}</span>
    </span>
  );
}

function RoundsTable({ results }: { results: RoundResult[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
      <div className="grid grid-cols-[40px_1fr_1fr_1fr_1fr_0.6fr] bg-[var(--color-bg-soft)] px-4 py-3 text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] font-mono">
        <span>#</span>
        <span>A weights</span>
        <span>A APY</span>
        <span>B weights</span>
        <span>B APY</span>
        <span className="text-right">winner</span>
      </div>
      {results.map((r, i) => (
        <div key={i} className={cn(i < results.length - 1 && "border-b border-[var(--color-border)]")}>
          <button
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            className="w-full grid grid-cols-[40px_1fr_1fr_1fr_1fr_0.6fr] px-4 py-3 items-center text-[12px] hover:bg-[var(--color-bg-soft)] text-left"
          >
            <span className="font-mono text-[var(--color-text-faint)] tabular-nums">r{r.roundIdx + 1}</span>
            <WeightChip w={r.a.weights} />
            <span className="font-mono tabular-nums">+{r.a.expectedAPYBps}</span>
            <WeightChip w={r.b.weights} />
            <span className="font-mono tabular-nums text-[var(--color-primary)]">+{r.b.expectedAPYBps}</span>
            <span className="text-right">
              <Badge variant={r.winner === "A" ? "default" : r.winner === "B" ? "accent" : "outline"}>
                {r.winner === "tie" ? "TIE" : r.winner}
              </Badge>
            </span>
          </button>
          {openIdx === i && (
            <div className="grid md:grid-cols-2 gap-3 px-4 py-3 bg-[var(--color-bg-soft)] border-t border-[var(--color-border)]">
              <ReasoningBlock label="A reasoning" text={r.a.reasoning} hash={r.a.reasoningHash} />
              <ReasoningBlock label="B reasoning" text={r.b.reasoning} hash={r.b.reasoningHash} accent />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function WeightChip({ w }: { w: Weights }) {
  return (
    <span className="flex items-center gap-1">
      {(["USDY", "mUSD", "Aave", "MI4"] as const).map((name) => {
        const idx = name === "USDY" ? "usdyBps" : name === "mUSD" ? "mUsdBps" : name === "Aave" ? "aaveBps" : "mi4Bps";
        const pct = w[idx] / 100;
        return (
          <span
            key={name}
            className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[9px] tabular-nums", pct === 0 && "opacity-40")}
            style={{ background: `${ASSET_COLORS[name]}22`, color: ASSET_COLORS[name] }}
          >
            <span className="block w-1 h-1 rounded-[1px]" style={{ background: ASSET_COLORS[name] }} />
            {name[0]}
            {pct.toFixed(0)}
          </span>
        );
      })}
    </span>
  );
}

function ReasoningBlock({ label, text, hash, accent }: { label: string; text: string; hash: string; accent?: boolean }) {
  return (
    <div className={cn("rounded-lg p-3 border", accent ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]" : "border-[var(--color-border)] bg-white")}>
      <p className={cn("font-mono text-[9px] uppercase tracking-[0.08em] mb-2", accent ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]")}>
        {label}
      </p>
      <p className="text-[12px] leading-relaxed text-[var(--color-text)] mb-2">{text}</p>
      <p className="font-mono text-[9px] text-[var(--color-text-muted)] break-all">{hash.slice(0, 16)}…{hash.slice(-10)}</p>
    </div>
  );
}

function Stat({ label, value, primary }: { label: string; value: string; primary?: boolean }) {
  return (
    <div className="rounded-lg p-4 border border-[var(--color-border)] bg-[var(--color-bg-card-soft)]">
      <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-text-muted)] mb-2">{label}</p>
      <p className={cn("text-[18px] font-medium tabular-nums", primary && "text-[var(--color-primary)]")}>{value}</p>
    </div>
  );
}
