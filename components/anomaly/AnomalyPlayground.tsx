"use client";

import { useMemo, useState } from "react";
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
  ShieldCheck,
  AlertTriangle,
  Skull,
  Loader2,
  Play,
  Wand2,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ───────────────────────────────────────────────────────────
//  Risk thresholds — keep in sync with mantle-risk-monitoring.skill.md
// ───────────────────────────────────────────────────────────

type Level = "ok" | "warn" | "trigger";

const THRESHOLDS = {
  usdyPeg:   { warn: 0.005, trigger: 0.02 },
  mUsdPeg:   { warn: 0.003, trigger: 0.015 },
  aaveOracle:{ warn: 0.005, trigger: 0.02 },
  drawdown:  { warn: 0.015, trigger: 0.05 },
  liquidity: { warn: 0.30,  trigger: 0.10 }, // ratio (LOW is bad)
};

function pegLevel(deviation: number, t: { warn: number; trigger: number }): Level {
  if (deviation >= t.trigger) return "trigger";
  if (deviation >= t.warn) return "warn";
  return "ok";
}
function drawdownLevel(d: number): Level {
  return pegLevel(d, THRESHOLDS.drawdown);
}
function liquidityLevel(ratio: number): Level {
  if (ratio <= THRESHOLDS.liquidity.trigger) return "trigger";
  if (ratio <= THRESHOLDS.liquidity.warn) return "warn";
  return "ok";
}

function compositeLevel(levels: Level[]): Level {
  if (levels.includes("trigger")) return "trigger";
  if (levels.includes("warn")) return "warn";
  return "ok";
}

// ───────────────────────────────────────────────────────────
//  Scenario presets
// ───────────────────────────────────────────────────────────

type SliderState = {
  usdyPrice: number; // around 1
  mUsdPrice: number; // around 1
  aaveOracle: number; // around 1
  drawdown: number; // % drop from entry (0..0.1)
  liquidityScore: number; // 0..1
};

const DEFAULTS: SliderState = {
  usdyPrice: 1.001,
  mUsdPrice: 1.0,
  aaveOracle: 1.0,
  drawdown: 0.005,
  liquidityScore: 0.72,
};

const PRESETS: Array<{ name: string; tone: "ok" | "warn" | "trigger"; state: SliderState }> = [
  {
    name: "Calm market",
    tone: "ok",
    state: { usdyPrice: 1.0005, mUsdPrice: 1.0002, aaveOracle: 0.9998, drawdown: 0.001, liquidityScore: 0.85 },
  },
  {
    name: "Aave oracle drift",
    tone: "warn",
    state: { usdyPrice: 1.001, mUsdPrice: 1.0, aaveOracle: 1.015, drawdown: 0.008, liquidityScore: 0.6 },
  },
  {
    name: "USDY peg crisis",
    tone: "trigger",
    state: { usdyPrice: 0.974, mUsdPrice: 1.001, aaveOracle: 1.002, drawdown: 0.025, liquidityScore: 0.55 },
  },
  {
    name: "Liquidity shock",
    tone: "trigger",
    state: { usdyPrice: 1.001, mUsdPrice: 1.0, aaveOracle: 1.003, drawdown: 0.02, liquidityScore: 0.08 },
  },
];

// ───────────────────────────────────────────────────────────
//  Component
// ───────────────────────────────────────────────────────────

type AgentResponse = {
  level: Level;
  signal: string;
  value: number;
  threshold: number;
  sustainedSeconds: number;
  action: "none" | "alert" | "defensive_exit";
  reasoning: string;
};

export function AnomalyPlayground() {
  const [s, setS] = useState<SliderState>(DEFAULTS);
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const predicted = useMemo(() => {
    const usdyDev = Math.abs(s.usdyPrice - 1);
    const mUsdDev = Math.abs(s.mUsdPrice - 1);
    const oracleDev = Math.abs(s.aaveOracle - 1);
    const usdyL = pegLevel(usdyDev, THRESHOLDS.usdyPeg);
    const mUsdL = pegLevel(mUsdDev, THRESHOLDS.mUsdPeg);
    const oracleL = pegLevel(oracleDev, THRESHOLDS.aaveOracle);
    const ddL = drawdownLevel(s.drawdown);
    const liqL = liquidityLevel(s.liquidityScore);
    const composite = compositeLevel([usdyL, mUsdL, oracleL, ddL, liqL]);
    return {
      usdy: { level: usdyL, value: usdyDev },
      mUsd: { level: mUsdL, value: mUsdDev },
      oracle: { level: oracleL, value: oracleDev },
      drawdown: { level: ddL, value: s.drawdown },
      liquidity: { level: liqL, value: s.liquidityScore },
      composite,
    };
  }, [s]);

  async function submitToAgent() {
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const entryNAV = "10000000000"; // $10k
      const currentNAV = String(Math.floor(10_000 * (1 - s.drawdown) * 1_000_000));
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "checkRisk",
          input: {
            usdyPrice: s.usdyPrice,
            mUsdRebaseRate: s.mUsdPrice,
            aaveMantleOracle: s.aaveOracle,
            chainlinkUsdcUsd: 1.0,
            currentNAV,
            entryNAV,
            liquidityScore: s.liquidityScore,
            protocolHealth: {
              aavePauseStatus: predicted.oracle.level,
              usdyRedemptionStatus: predicted.usdy.level,
              mantleNetworkStatus: "ok",
            },
          },
        }),
      });
      const j = (await res.json()) as { data: AgentResponse | null; error: string | null };
      if (!res.ok || !j.data) throw new Error(j.error ?? "Request failed");
      setResponse(j.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Composite + presets */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="default">// risk anomaly playground</Badge>
            <Badge
              variant={
                predicted.composite === "trigger"
                  ? "danger"
                  : predicted.composite === "warn"
                    ? "warning"
                    : "success"
              }
            >
              {predicted.composite === "trigger" && <Skull className="w-3 h-3" />}
              {predicted.composite === "warn" && <AlertTriangle className="w-3 h-3" />}
              {predicted.composite === "ok" && <ShieldCheck className="w-3 h-3" />}
              predicted composite: {predicted.composite}
            </Badge>
          </div>
          <CardTitle>Drive RiskAgent with your own market</CardTitle>
          <CardDescription>
            The composite level on the right is computed client-side from the same thresholds in the skill markdown.
            Hit <span className="font-mono">Submit to RiskAgent</span> to see Claude reach the same verdict via reasoning.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-6">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => { setS(p.state); setResponse(null); }}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3 py-1.5 border text-[11px] font-mono transition-colors",
                  p.tone === "ok" && "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                  p.tone === "warn" && "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
                  p.tone === "trigger" && "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
                )}
              >
                <Wand2 className="w-3 h-3" />
                {p.name}
              </button>
            ))}
            <button
              onClick={() => { setS(DEFAULTS); setResponse(null); }}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 border border-[var(--color-border)] bg-white hover:bg-[var(--color-bg-soft)] text-[11px] font-mono text-[var(--color-text-secondary)] transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Slider
              label="USDY price (vs $1)"
              valueLabel={`${s.usdyPrice.toFixed(4)} · dev ${(Math.abs(s.usdyPrice - 1) * 100).toFixed(2)}%`}
              min={0.95}
              max={1.05}
              step={0.0005}
              value={s.usdyPrice}
              onChange={(v) => setS((p) => ({ ...p, usdyPrice: v }))}
              level={predicted.usdy.level}
              bands={[
                { from: 0, to: 1 - THRESHOLDS.usdyPeg.trigger, level: "trigger" },
                { from: 1 - THRESHOLDS.usdyPeg.trigger, to: 1 - THRESHOLDS.usdyPeg.warn, level: "warn" },
                { from: 1 - THRESHOLDS.usdyPeg.warn, to: 1 + THRESHOLDS.usdyPeg.warn, level: "ok" },
                { from: 1 + THRESHOLDS.usdyPeg.warn, to: 1 + THRESHOLDS.usdyPeg.trigger, level: "warn" },
                { from: 1 + THRESHOLDS.usdyPeg.trigger, to: 1.05, level: "trigger" },
              ]}
              domainMin={0.95}
              domainMax={1.05}
            />
            <Slider
              label="mUSD rebase rate (vs $1)"
              valueLabel={`${s.mUsdPrice.toFixed(4)} · dev ${(Math.abs(s.mUsdPrice - 1) * 100).toFixed(2)}%`}
              min={0.97}
              max={1.03}
              step={0.0002}
              value={s.mUsdPrice}
              onChange={(v) => setS((p) => ({ ...p, mUsdPrice: v }))}
              level={predicted.mUsd.level}
              bands={[
                { from: 0.97, to: 1 - THRESHOLDS.mUsdPeg.trigger, level: "trigger" },
                { from: 1 - THRESHOLDS.mUsdPeg.trigger, to: 1 - THRESHOLDS.mUsdPeg.warn, level: "warn" },
                { from: 1 - THRESHOLDS.mUsdPeg.warn, to: 1 + THRESHOLDS.mUsdPeg.warn, level: "ok" },
                { from: 1 + THRESHOLDS.mUsdPeg.warn, to: 1 + THRESHOLDS.mUsdPeg.trigger, level: "warn" },
                { from: 1 + THRESHOLDS.mUsdPeg.trigger, to: 1.03, level: "trigger" },
              ]}
              domainMin={0.97}
              domainMax={1.03}
            />
            <Slider
              label="Aave oracle (vs USDC)"
              valueLabel={`${s.aaveOracle.toFixed(4)} · dev ${(Math.abs(s.aaveOracle - 1) * 100).toFixed(2)}%`}
              min={0.96}
              max={1.04}
              step={0.0005}
              value={s.aaveOracle}
              onChange={(v) => setS((p) => ({ ...p, aaveOracle: v }))}
              level={predicted.oracle.level}
              bands={[
                { from: 0.96, to: 1 - THRESHOLDS.aaveOracle.trigger, level: "trigger" },
                { from: 1 - THRESHOLDS.aaveOracle.trigger, to: 1 - THRESHOLDS.aaveOracle.warn, level: "warn" },
                { from: 1 - THRESHOLDS.aaveOracle.warn, to: 1 + THRESHOLDS.aaveOracle.warn, level: "ok" },
                { from: 1 + THRESHOLDS.aaveOracle.warn, to: 1 + THRESHOLDS.aaveOracle.trigger, level: "warn" },
                { from: 1 + THRESHOLDS.aaveOracle.trigger, to: 1.04, level: "trigger" },
              ]}
              domainMin={0.96}
              domainMax={1.04}
            />
            <Slider
              label="Liquidity score (0=dry → 1=fluid)"
              valueLabel={`${(s.liquidityScore * 100).toFixed(0)}%`}
              min={0}
              max={1}
              step={0.01}
              value={s.liquidityScore}
              onChange={(v) => setS((p) => ({ ...p, liquidityScore: v }))}
              level={predicted.liquidity.level}
              bands={[
                { from: 0, to: THRESHOLDS.liquidity.trigger, level: "trigger" },
                { from: THRESHOLDS.liquidity.trigger, to: THRESHOLDS.liquidity.warn, level: "warn" },
                { from: THRESHOLDS.liquidity.warn, to: 1, level: "ok" },
              ]}
              domainMin={0}
              domainMax={1}
            />
            <Slider
              label="Drawdown from entry"
              valueLabel={`${(s.drawdown * 100).toFixed(2)}%`}
              min={0}
              max={0.1}
              step={0.001}
              value={s.drawdown}
              onChange={(v) => setS((p) => ({ ...p, drawdown: v }))}
              level={predicted.drawdown.level}
              bands={[
                { from: 0, to: THRESHOLDS.drawdown.warn, level: "ok" },
                { from: THRESHOLDS.drawdown.warn, to: THRESHOLDS.drawdown.trigger, level: "warn" },
                { from: THRESHOLDS.drawdown.trigger, to: 0.1, level: "trigger" },
              ]}
              domainMin={0}
              domainMax={0.1}
            />
            <div className="flex flex-col gap-2 justify-end">
              <Button onClick={submitToAgent} size="lg" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play />}
                Submit to RiskAgent
              </Button>
              <p className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.06em]">
                runs Claude · ~2-4s · ~$0.003 per call
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg p-3 bg-red-50 border border-red-200 text-[13px] text-red-700">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Predicted vs actual */}
      {response && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="default">// claude said</Badge>
              <Badge
                variant={
                  response.level === "trigger"
                    ? "danger"
                    : response.level === "warn"
                      ? "warning"
                      : "success"
                }
              >
                {response.level === "trigger" && <Skull className="w-3 h-3" />}
                {response.level === "warn" && <AlertTriangle className="w-3 h-3" />}
                {response.level === "ok" && <ShieldCheck className="w-3 h-3" />}
                {response.level}
              </Badge>
            </div>
            <CardTitle>
              {response.level === predicted.composite
                ? "✓ Claude matched the rule-based prediction"
                : "⚠ Claude disagreed with the rule-based prediction"}
            </CardTitle>
            <CardDescription>
              The skill markdown is the ground truth. When predicted ≠ Claude, either the skill is ambiguous
              or Claude is interpreting an edge case more cautiously.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <KV label="signal" value={response.signal} />
              <KV label="action" value={response.action} />
              <KV label="value" value={response.value.toFixed(4)} />
              <KV label="threshold" value={response.threshold.toFixed(4)} />
            </div>
            <div className="mt-4 rounded-lg p-4 bg-[var(--color-bg-invert)] border border-[var(--color-bg-invert-soft)]">
              <p className="text-[13px] text-[var(--color-text-on-invert)] leading-relaxed">
                {response.reasoning}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────
//  Slider with banded danger zones
// ───────────────────────────────────────────────────────────

function Slider({
  label,
  valueLabel,
  min,
  max,
  step,
  value,
  onChange,
  level,
  bands,
  domainMin,
  domainMax,
}: {
  label: string;
  valueLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  level: Level;
  bands: Array<{ from: number; to: number; level: Level }>;
  domainMin: number;
  domainMax: number;
}) {
  const pct = (n: number) => ((n - domainMin) / (domainMax - domainMin)) * 100;
  return (
    <div className="rounded-lg p-4 border border-[var(--color-border)] bg-[var(--color-bg-card-soft)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-medium">{label}</span>
        <Badge variant={level === "trigger" ? "danger" : level === "warn" ? "warning" : "success"}>
          {level}
        </Badge>
      </div>
      <div className="relative">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 rounded-full overflow-hidden bg-[var(--color-bg-soft)] pointer-events-none">
          {bands.map((b, i) => (
            <span
              key={i}
              className="absolute h-full"
              style={{
                left: `${pct(Math.max(b.from, domainMin))}%`,
                width: `${pct(Math.min(b.to, domainMax)) - pct(Math.max(b.from, domainMin))}%`,
                background:
                  b.level === "trigger"
                    ? "#fee2e2"
                    : b.level === "warn"
                      ? "#fef3c7"
                      : "#dcfce7",
              }}
            />
          ))}
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative w-full appearance-none bg-transparent accent-[var(--color-primary)] h-2 z-10"
          style={{ outline: "none" }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between font-mono text-[10px] tabular-nums">
        <span className="text-[var(--color-text-muted)]">{min}</span>
        <span className="text-[var(--color-text-secondary)]">{valueLabel}</span>
        <span className="text-[var(--color-text-muted)]">{max}</span>
      </div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg p-3 bg-[var(--color-bg-soft)] border border-[var(--color-border)]">
      <p className="font-mono text-[9px] uppercase tracking-[0.06em] text-[var(--color-text-muted)] mb-1">
        {label}
      </p>
      <p className="text-[12px] font-mono">{value}</p>
    </div>
  );
}
