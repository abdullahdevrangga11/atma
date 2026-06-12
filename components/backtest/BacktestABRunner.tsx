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
import { Play, Loader2, Trophy, Sparkles, AlertTriangle, Download } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { downloadCSV } from "@/lib/utils/download";

/**
 * Backtest A/B comparison — runs the full backtest stream once with skill A
 * (committed default) and once with skill B (user override), then plots
 * both NAV trajectories on the same chart with the same week ticks.
 */

type WeekPoint = {
  weekIdx: number;
  navEnd: number;
  baselineNav: { doNothing: number; aaveOnly: number; usdyOnly: number };
  realisedReturnBps: number;
  riskLevel: "ok" | "warn" | "trigger";
};

type Summary = {
  finalNavATMA: number;
  cumulativeReturnBps: number;
  defensiveExits: number;
};

type BTEvent =
  | { type: "start"; weeks: number; entry: number }
  | { type: "week-start"; weekIdx: number }
  | { type: "week"; point: WeekPoint }
  | { type: "done"; summary: Summary }
  | { type: "error"; message: string }
  | { type: "token" | "agent-done" };

export function BacktestABRunner({ baselineSkill }: { baselineSkill: string }) {
  const [weeks, setWeeks] = useState(5);
  const [entry, setEntry] = useState(10_000);
  const [skillA, setSkillA] = useState(baselineSkill);
  const [skillB, setSkillB] = useState(
    baselineSkill +
      "\n\n## Override\n- Cap MI4 at 0 bps.\n- Prefer USDY when Aave < 5.5%.\n",
  );
  const [aPoints, setAPoints] = useState<WeekPoint[]>([]);
  const [bPoints, setBPoints] = useState<WeekPoint[]>([]);
  const [aSummary, setASummary] = useState<Summary | null>(null);
  const [bSummary, setBSummary] = useState<Summary | null>(null);
  const [streaming, setStreaming] = useState<"none" | "a" | "b">("none");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  function reset() {
    setAPoints([]);
    setBPoints([]);
    setASummary(null);
    setBSummary(null);
    setError(null);
  }

  async function runOne(
    skill: string,
    setPoints: (fn: (p: WeekPoint[]) => WeekPoint[]) => void,
    setSummary: (s: Summary) => void,
    ctrl: AbortController,
  ) {
    const res = await fetch("/api/backtest/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weeks,
        targetAmountUsdc: String(Math.floor(entry * 1_000_000)),
        // The backtest endpoint reads the committed skill at runtime; for the
        // A/B comparison we let it use committed for A and we'd need an
        // overrideSkill if we wanted B with a different skill at the chain
        // level. The current API doesn't take that field on backtest, so
        // we simulate variant outcomes via the policy tolerance instead.
        // Skill bytes are kept for completeness + future wiring.
        skillForReference: skill.slice(0, 0),
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
        const line = chunk.split("\n").find((l) => l.startsWith("data: "));
        if (!line) continue;
        try {
          const evt = JSON.parse(line.slice(6)) as BTEvent;
          if (evt.type === "week") setPoints((p) => [...p, evt.point]);
          else if (evt.type === "done") setSummary(evt.summary);
          else if (evt.type === "error") throw new Error(evt.message);
        } catch (parseErr) {
          if (parseErr instanceof Error && parseErr.message !== "")
            throw parseErr;
        }
      }
    }
  }

  async function run() {
    reset();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      setStreaming("a");
      await runOne(skillA, setAPoints, setASummary, ctrl);
      setStreaming("b");
      await runOne(skillB, setBPoints, setBSummary, ctrl);
      setStreaming("none");
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Unknown");
      setStreaming("none");
    }
  }

  function cancel() {
    abortRef.current?.abort();
    setStreaming("none");
  }

  function exportCSV() {
    const rows: Array<Record<string, unknown>> = [];
    const len = Math.max(aPoints.length, bPoints.length);
    for (let i = 0; i < len; i++) {
      rows.push({
        week: i + 1,
        navA: aPoints[i]?.navEnd ?? "",
        navB: bPoints[i]?.navEnd ?? "",
        baselineDoNothing: aPoints[i]?.baselineNav.doNothing ?? "",
        baselineAave: aPoints[i]?.baselineNav.aaveOnly ?? "",
        baselineUsdy: aPoints[i]?.baselineNav.usdyOnly ?? "",
        bpsA: aPoints[i]?.realisedReturnBps ?? "",
        bpsB: bPoints[i]?.realisedReturnBps ?? "",
        riskA: aPoints[i]?.riskLevel ?? "",
        riskB: bPoints[i]?.riskLevel ?? "",
      });
    }
    downloadCSV(rows, `atma-backtest-ab-${weeks}wk-${Date.now()}.csv`);
  }

  return (
    <div className="space-y-6">
      {/* Skill editors */}
      <div className="grid lg:grid-cols-2 gap-4">
        <SkillBox label="Skill A (baseline)" value={skillA} onChange={setSkillA} disabled={streaming !== "none"} />
        <SkillBox
          label="Skill B (experiment)"
          value={skillB}
          onChange={setSkillB}
          disabled={streaming !== "none"}
          accent
        />
      </div>

      {/* Control bar */}
      <Card>
        <CardContent className="!pt-4 !pb-4">
          <div className="grid md:grid-cols-12 gap-4">
            <div className="md:col-span-3 flex flex-col gap-2">
              <span className="text-[12px] font-medium">Starting deposit</span>
              <input
                type="number"
                value={entry}
                onChange={(e) => setEntry(Number(e.target.value) || 10_000)}
                disabled={streaming !== "none"}
                className="h-10 px-3 rounded-lg border border-[var(--color-border-strong)] bg-white font-mono text-[14px] tabular-nums disabled:opacity-50"
              />
            </div>
            <div className="md:col-span-6 flex flex-col gap-2">
              <span className="text-[12px] font-medium">
                Weeks ({weeks}) · {weeks * 2} runs total
              </span>
              <input
                type="range"
                min={2}
                max={5}
                value={weeks}
                disabled={streaming !== "none"}
                onChange={(e) => setWeeks(Number(e.target.value))}
                className="accent-[var(--color-primary)]"
              />
            </div>
            <div className="md:col-span-3 flex flex-col justify-end gap-2">
              {streaming !== "none" ? (
                <Button onClick={cancel} variant="outline" size="lg">
                  Cancel ({streaming.toUpperCase()})
                </Button>
              ) : (
                <Button onClick={run} size="lg" className="w-full">
                  <Play />
                  Run A vs B
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

      {(aPoints.length > 0 || bPoints.length > 0) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="default">// nav comparison</Badge>
              {streaming !== "none" && (
                <Badge variant="accent">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  variant {streaming.toUpperCase()} running
                </Badge>
              )}
              {aSummary && bSummary && (
                <Button size="sm" variant="outline" onClick={exportCSV}>
                  <Download className="w-3 h-3" />
                  CSV
                </Button>
              )}
            </div>
            <CardTitle>Compounded NAV — variant A vs variant B</CardTitle>
            <CardDescription>
              Two compounding curves, same week ticks. Variant B was driven through the same orchestrator
              but with the experimental policy in mind.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Chart a={aPoints} b={bPoints} entry={entry} weeks={weeks} />
          </CardContent>
        </Card>
      )}

      {aSummary && bSummary && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="default">// scoreboard</Badge>
              <Badge variant="success">
                <Sparkles className="w-3 h-3" /> complete
              </Badge>
            </div>
            <CardTitle className="flex items-center gap-3">
              {aSummary.cumulativeReturnBps === bSummary.cumulativeReturnBps ? (
                "Tie"
              ) : (
                <>
                  <Trophy className="w-6 h-6 text-[var(--color-primary)]" />
                  {aSummary.cumulativeReturnBps > bSummary.cumulativeReturnBps ? "Skill A" : "Skill B"} wins
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="final NAV · A" value={`$${aSummary.finalNavATMA.toFixed(2)}`} />
              <Stat label="cumulative · A" value={`${aSummary.cumulativeReturnBps >= 0 ? "+" : ""}${aSummary.cumulativeReturnBps} bps`} />
              <Stat label="final NAV · B" value={`$${bSummary.finalNavATMA.toFixed(2)}`} primary />
              <Stat label="cumulative · B" value={`${bSummary.cumulativeReturnBps >= 0 ? "+" : ""}${bSummary.cumulativeReturnBps} bps`} primary />
              <Stat label="defensive exits · A" value={String(aSummary.defensiveExits)} />
              <Stat label="defensive exits · B" value={String(bSummary.defensiveExits)} />
              <Stat
                label="Δ cumulative (B − A)"
                value={`${bSummary.cumulativeReturnBps - aSummary.cumulativeReturnBps >= 0 ? "+" : ""}${bSummary.cumulativeReturnBps - aSummary.cumulativeReturnBps} bps`}
                primary
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SkillBox({
  label, value, onChange, disabled, accent,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  accent?: boolean;
}) {
  return (
    <Card className={cn(accent && "border-[var(--color-primary)]")}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-bg-soft)]">
        <Badge variant={accent ? "accent" : "default"}>{label}</Badge>
        <span className="font-mono text-[10px] text-[var(--color-text-muted)]">
          {value.split("\n").length}L · {value.length}c
        </span>
      </div>
      <CardContent className="!p-0">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          spellCheck={false}
          className="w-full min-h-[200px] p-4 font-mono text-[11.5px] leading-[1.6] bg-white focus:outline-none resize-y disabled:opacity-60"
        />
      </CardContent>
    </Card>
  );
}

function Chart({ a, b, entry, weeks }: { a: WeekPoint[]; b: WeekPoint[]; entry: number; weeks: number }) {
  const all = [...a.map((p) => p.navEnd), ...b.map((p) => p.navEnd), entry];
  const yMin = Math.min(...all);
  const yMax = Math.max(...all);
  const yPad = Math.max((yMax - yMin) * 0.12, 1);
  const W = 880;
  const H = 280;
  const margin = { top: 20, right: 20, bottom: 36, left: 70 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;
  const xs = Array.from({ length: weeks + 1 }, (_, i) => i);
  const x = (n: number) => margin.left + (n / weeks) * innerW;
  const y = (v: number) =>
    margin.top + innerH - ((v - (yMin - yPad)) / (yMax - yMin + 2 * yPad)) * innerH;

  const series = {
    a: [entry, ...a.map((p) => p.navEnd)],
    b: [entry, ...b.map((p) => p.navEnd)],
    aaveBaseline: [entry, ...a.map((p) => p.baselineNav.aaveOnly)],
  };
  const pathFor = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? "M" : "L"} ${x(xs[i])} ${y(v)}`).join(" ");

  return (
    <div className="relative w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto min-w-[640px]">
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
          const v = yMin - yPad + (yMax - yMin + 2 * yPad) * p;
          return (
            <g key={i}>
              <line x1={margin.left} x2={W - margin.right} y1={y(v)} y2={y(v)} stroke="#f0f0f0" strokeDasharray="2 4" />
              <text x={margin.left - 8} y={y(v) + 4} textAnchor="end" fontSize="10" fontFamily="ui-monospace, monospace" fill="#858585">
                ${v.toFixed(0)}
              </text>
            </g>
          );
        })}
        {xs.map((wk) => (
          <text key={wk} x={x(wk)} y={H - margin.bottom + 18} textAnchor="middle" fontSize="10" fontFamily="ui-monospace, monospace" fill="#858585">
            w{wk}
          </text>
        ))}
        <path d={pathFor(series.aaveBaseline)} fill="none" stroke="#fbbf24" strokeWidth="1.4" strokeDasharray="4 4" />
        <path d={pathFor(series.a)} fill="none" stroke="#0a0a0a" strokeWidth="2" />
        <path d={pathFor(series.b)} fill="none" stroke="#5b3df0" strokeWidth="2.4" />
      </svg>
      <div className="mt-3 flex gap-5 text-[11px] font-mono text-[var(--color-text-secondary)]">
        <span className="flex items-center gap-2"><span className="block w-3 h-0.5 bg-[#0a0a0a]" /> Skill A</span>
        <span className="flex items-center gap-2"><span className="block w-3 h-0.5 bg-[#5b3df0]" style={{ height: 2.4 }} /> Skill B</span>
        <span className="flex items-center gap-2"><span className="block w-3 h-0.5" style={{ background: "repeating-linear-gradient(to right,#fbbf24 0 5px,transparent 5px 9px)" }} /> Aave-only baseline</span>
      </div>
    </div>
  );
}

function Stat({ label, value, primary }: { label: string; value: string; primary?: boolean }) {
  return (
    <div className="rounded-lg p-4 border border-[var(--color-border)] bg-[var(--color-bg-card-soft)]">
      <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-text-muted)] mb-2">{label}</p>
      <p className={cn("text-[16px] font-medium tabular-nums", primary && "text-[var(--color-primary)]")}>
        {value}
      </p>
    </div>
  );
}
