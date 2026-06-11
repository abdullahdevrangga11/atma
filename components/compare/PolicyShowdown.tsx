"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Loader2, Trophy, ShieldCheck, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Tolerance = "conservative" | "balanced" | "aggressive";

type RunResult = {
  proposal: {
    weights: { usdyBps: number; mUsdBps: number; aaveBps: number; mi4Bps: number };
    expectedAPYBps: number;
    reasoning: string;
    riskScore: number;
  };
  risk: { level: "ok" | "warn" | "trigger"; reasoning: string };
  report: {
    actualAPYBps: number;
    outperformanceBps: { vsDoNothing: number; vsUsdcAaveOnly: number; vsUsdyOnly: number };
    reasoning: string;
  };
  steps: Array<{ durationMs: number; reasoningHash: string }>;
  finishedAt: number;
  startedAt: number;
};

type ColumnState =
  | { state: "idle" }
  | { state: "running" }
  | { state: "done"; result: RunResult }
  | { state: "error"; message: string };

const ASSET_COLORS: Record<string, string> = {
  USDY: "#a78bfa",
  mUSD: "#84cc16",
  Aave: "#fbbf24",
  MI4: "#f9a8d4",
};

const POLICY_BY_TOLERANCE: Record<
  Tolerance,
  { maxUsdyBps: number; maxMUsdBps: number; maxAaveBps: number; maxMi4Bps: number; minLiquidBps: number; riskTolerance: Tolerance }
> = {
  conservative: {
    maxUsdyBps: 5000,
    maxMUsdBps: 5000,
    maxAaveBps: 4000,
    maxMi4Bps: 0,
    minLiquidBps: 6000,
    riskTolerance: "conservative",
  },
  balanced: {
    maxUsdyBps: 5000,
    maxMUsdBps: 5000,
    maxAaveBps: 5000,
    maxMi4Bps: 1500,
    minLiquidBps: 4000,
    riskTolerance: "balanced",
  },
  aggressive: {
    maxUsdyBps: 4000,
    maxMUsdBps: 4000,
    maxAaveBps: 5000,
    maxMi4Bps: 3500,
    minLiquidBps: 3000,
    riskTolerance: "aggressive",
  },
};

export function PolicyShowdown() {
  const [amount, setAmount] = useState(10_000);
  const [cons, setCons] = useState<ColumnState>({ state: "idle" });
  const [bal, setBal] = useState<ColumnState>({ state: "idle" });
  const [agg, setAgg] = useState<ColumnState>({ state: "idle" });
  const [running, setRunning] = useState(false);

  async function runOne(tolerance: Tolerance, set: (s: ColumnState) => void) {
    set({ state: "running" });
    try {
      const res = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetAmountUsdc: String(Math.floor(amount * 1_000_000)),
          policy: POLICY_BY_TOLERANCE[tolerance],
        }),
      });
      const j = (await res.json()) as { data: RunResult | null; error: string | null };
      if (!res.ok || !j.data) throw new Error(j.error ?? "Failed");
      set({ state: "done", result: j.data });
    } catch (err) {
      set({ state: "error", message: err instanceof Error ? err.message : "Unknown" });
    }
  }

  async function runAll() {
    setCons({ state: "idle" });
    setBal({ state: "idle" });
    setAgg({ state: "idle" });
    setRunning(true);
    await Promise.all([
      runOne("conservative", setCons),
      runOne("balanced", setBal),
      runOne("aggressive", setAgg),
    ]);
    setRunning(false);
  }

  // Determine winner across done columns (highest expected APY)
  const done = [
    cons.state === "done" ? { name: "Conservative", apy: cons.result.proposal.expectedAPYBps } : null,
    bal.state === "done" ? { name: "Balanced", apy: bal.result.proposal.expectedAPYBps } : null,
    agg.state === "done" ? { name: "Aggressive", apy: agg.result.proposal.expectedAPYBps } : null,
  ].filter(Boolean) as { name: string; apy: number }[];
  const winner = done.length === 3 ? done.reduce((a, b) => (b.apy > a.apy ? b : a)).name : null;

  return (
    <div className="space-y-6">
      {/* Control bar */}
      <Card>
        <CardHeader>
          <Badge variant="default">// policy showdown</Badge>
          <CardTitle>Three policies, same feeds, real reasoning</CardTitle>
          <CardDescription>
            Identical live feeds drive three parallel AllocatorAgent runs under different tolerance policies.
            The agent re-allocates from scratch for each. Three independent Claude reasoning chains.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-12 gap-4">
            <div className="md:col-span-4 flex flex-col gap-2">
              <span className="text-[12px] font-medium">Target deposit (USDC)</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 10_000)}
                min={100}
                step={100}
                disabled={running}
                className="h-10 px-3 rounded-lg border border-[var(--color-border-strong)] bg-white font-mono text-[14px] tabular-nums focus:outline-none focus:border-[var(--color-primary)] disabled:opacity-50"
              />
            </div>
            <div className="md:col-span-8 flex flex-col gap-2 justify-end">
              <Button onClick={runAll} size="lg" disabled={running}>
                {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play />}
                Run all three in parallel
              </Button>
              <p className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.06em]">
                ~6-12 seconds · 9 Claude calls total (3 per column)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Three columns */}
      <div className="grid lg:grid-cols-3 gap-4">
        <PolicyColumn name="Conservative" tone="cool" state={cons} winner={winner === "Conservative"} />
        <PolicyColumn name="Balanced"      tone="primary" state={bal} winner={winner === "Balanced"} />
        <PolicyColumn name="Aggressive"    tone="warm" state={agg} winner={winner === "Aggressive"} />
      </div>

      {/* Compare bar — weight diffs across columns */}
      {cons.state === "done" && bal.state === "done" && agg.state === "done" && (
        <Card>
          <CardHeader>
            <Badge variant="default">// side-by-side allocation</Badge>
            <CardTitle>Same yields, three answers</CardTitle>
            <CardDescription>
              The asset bands are identical because the live feeds are shared. The bar lengths differ
              because each column reasoned under a different policy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(["USDY", "mUSD", "Aave", "MI4"] as const).map((asset) => {
                const idx = asset === "USDY" ? "usdyBps" : asset === "mUSD" ? "mUsdBps" : asset === "Aave" ? "aaveBps" : "mi4Bps";
                const c = (cons.state === "done" ? cons.result.proposal.weights[idx] : 0) / 100;
                const b = (bal.state === "done"  ? bal.result.proposal.weights[idx]  : 0) / 100;
                const a = (agg.state === "done"  ? agg.result.proposal.weights[idx]  : 0) / 100;
                return (
                  <div key={asset}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="block w-2 h-2 rounded-[1px]" style={{ background: ASSET_COLORS[asset] }} />
                        <span className="text-[13px] font-medium">{asset}</span>
                      </div>
                      <span className="font-mono text-[11px] text-[var(--color-text-muted)] tabular-nums">
                        C {c.toFixed(1)}% · B {b.toFixed(1)}% · A {a.toFixed(1)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <BarSeg color={ASSET_COLORS[asset]} pct={c} variant="cool" />
                      <BarSeg color={ASSET_COLORS[asset]} pct={b} variant="primary" />
                      <BarSeg color={ASSET_COLORS[asset]} pct={a} variant="warm" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────
//  Column
// ───────────────────────────────────────────────────────────

function PolicyColumn({
  name, tone, state, winner,
}: {
  name: string;
  tone: "cool" | "primary" | "warm";
  state: ColumnState;
  winner?: boolean;
}) {
  const headerBg = tone === "cool" ? "bg-sky-50" : tone === "primary" ? "bg-[var(--color-primary-soft)]" : "bg-amber-50";
  const accent = tone === "cool" ? "#0ea5e9" : tone === "primary" ? "var(--color-primary)" : "#ea580c";
  return (
    <Card
      className={cn(
        "h-full transition-shadow duration-300 relative",
        state.state === "done" && "shadow-[0_8px_32px_-12px_rgba(91,61,240,0.15)]",
        winner && "ring-2 ring-[var(--color-primary)]",
      )}
    >
      {winner && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--color-primary)] text-white font-mono text-[10px] uppercase tracking-[0.06em]">
          <Trophy className="w-3 h-3" />
          highest expected
        </span>
      )}
      <CardHeader className={cn("rounded-t-2xl", headerBg)}>
        <div className="flex items-center justify-between">
          <Badge variant="default">// {name.toLowerCase()}</Badge>
          {state.state === "running" && (
            <Badge variant="accent"><Loader2 className="w-3 h-3 animate-spin" /> running</Badge>
          )}
          {state.state === "done" && state.result.risk.level === "ok" && (
            <Badge variant="success"><ShieldCheck className="w-3 h-3" /> ok</Badge>
          )}
          {state.state === "done" && state.result.risk.level !== "ok" && (
            <Badge variant={state.result.risk.level === "warn" ? "warning" : "danger"}>
              <AlertTriangle className="w-3 h-3" /> {state.result.risk.level}
            </Badge>
          )}
        </div>
        <CardTitle style={{ color: state.state === "done" ? accent : undefined }}>
          {name}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {state.state === "idle" && (
          <p className="text-[12px] text-[var(--color-text-muted)] leading-relaxed">
            Will run AllocatorAgent under <span className="font-mono">{name.toLowerCase()}</span> tolerance.
          </p>
        )}
        {state.state === "running" && (
          <p className="font-mono text-[11px] text-[var(--color-text-secondary)] flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin text-[var(--color-primary)]" />
            reasoning…
          </p>
        )}
        {state.state === "error" && (
          <p className="text-[12px] text-red-700">{state.message}</p>
        )}
        {state.state === "done" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <MiniBar name="USDY" bps={state.result.proposal.weights.usdyBps} color={ASSET_COLORS.USDY} />
              <MiniBar name="mUSD" bps={state.result.proposal.weights.mUsdBps} color={ASSET_COLORS.mUSD} />
              <MiniBar name="Aave" bps={state.result.proposal.weights.aaveBps} color={ASSET_COLORS.Aave} />
              <MiniBar name="MI4" bps={state.result.proposal.weights.mi4Bps} color={ASSET_COLORS.MI4} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <KV label="expected APY" value={`+${state.result.proposal.expectedAPYBps} bps`} />
              <KV label="risk score" value={`${state.result.proposal.riskScore} / 10`} />
            </div>
            <div className="rounded-lg p-3 bg-[var(--color-bg-invert)] border border-[var(--color-bg-invert-soft)]">
              <p className="text-[11px] leading-relaxed text-[var(--color-text-on-invert)]">
                {state.result.proposal.reasoning}
              </p>
            </div>
            <p className="font-mono text-[10px] text-[var(--color-text-muted)] tabular-nums">
              {state.result.steps.length} agents · {(state.result.finishedAt - state.result.startedAt) / 1000}s
            </p>
          </div>
        )}
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
        <div className="h-full" style={{ width: `${pct}%`, background: color, transition: "width 600ms cubic-bezier(0.16,1,0.3,1)" }} />
      </div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md p-2 bg-[var(--color-bg-soft)] border border-[var(--color-border)]">
      <p className="font-mono text-[9px] uppercase tracking-[0.06em] text-[var(--color-text-muted)] mb-1">{label}</p>
      <p className="text-[14px] font-medium tabular-nums text-[var(--color-primary)]">{value}</p>
    </div>
  );
}

function BarSeg({ color, pct, variant }: { color: string; pct: number; variant: "cool" | "primary" | "warm" }) {
  return (
    <div className="rounded-md p-2 bg-[var(--color-bg-soft)] border border-[var(--color-border)]">
      <div className="h-2 rounded-full bg-white overflow-hidden border border-[var(--color-border)]">
        <div className="h-full" style={{ width: `${pct}%`, background: color, transition: "width 600ms cubic-bezier(0.16,1,0.3,1)" }} />
      </div>
      <p className={cn(
        "mt-1 font-mono text-[10px] uppercase tracking-[0.06em] text-center",
        variant === "primary" ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]",
      )}>
        {pct.toFixed(1)}%
      </p>
    </div>
  );
}
