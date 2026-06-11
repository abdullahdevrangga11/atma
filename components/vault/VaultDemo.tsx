"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Play, Sparkles, Target } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Proposal = {
  weights: {
    usdyBps: number;
    mUsdBps: number;
    aaveBps: number;
    mi4Bps: number;
  };
  expectedAPYBps: number;
  reasoning: string;
  riskScore: number;
  reasoningHash: string;
};

const DEFAULT_AMOUNT_USDC_BASE = "10000000000";
const LIVE_APYS = {
  usdy: 0.0465,
  mUsd: 0.0455,
  aaveSupply: 0.0510,
  mi4Yield: 0.0620,
};
const TOLERANCES = ["conservative", "balanced", "aggressive"] as const;

export function VaultDemo() {
  const [amount, setAmount] = useState("10000");
  const [tolerance, setTolerance] = useState<(typeof TOLERANCES)[number]>("balanced");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function callAllocator() {
    setLoading(true);
    setError(null);
    setProposal(null);

    const base6 = (() => {
      const n = parseFloat(amount);
      if (isNaN(n) || n <= 0) return DEFAULT_AMOUNT_USDC_BASE;
      return Math.floor(n * 1_000_000).toString();
    })();

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "propose",
          input: {
            targetAmountUsdc: base6,
            userPolicy: {
              maxUsdyBps: 5000,
              maxMUsdBps: 3000,
              maxAaveBps: 4000,
              maxMi4Bps: 2000,
              minLiquidBps: 5000,
              riskTolerance: tolerance,
            },
            liveAPYs: LIVE_APYS,
            liveRiskSignals: {
              usdyPeg: "ok",
              mUsdPeg: "ok",
              aaveOracle: "ok",
              mi4NAV: "ok",
            },
          },
        }),
      });

      const json = (await res.json()) as { data: Proposal | null; error: string | null };
      if (!res.ok || !json.data) throw new Error(json.error || "Request failed");
      setProposal(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-12 gap-6">
      {/* Form panel */}
      <div className="lg:col-span-5">
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="default">// inputs</Badge>
              <Badge variant="accent">live</Badge>
            </div>
            <CardTitle>Vault parameters</CardTitle>
            <CardDescription>
              Adjust deposit amount and risk policy. The Allocator agent will reason
              over current Mantle APYs and produce a verifiable proposal.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <label className="block">
                <span className="text-[12px] font-medium text-[var(--color-text)] block mb-2">
                  Target deposit (USDC)
                </span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={1}
                  step={100}
                />
              </label>
            </div>

            <div>
              <span className="text-[12px] font-medium text-[var(--color-text)] block mb-2">
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
                    className="capitalize"
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>

            <div className="rounded-lg p-4 bg-[var(--color-bg-soft)] border border-[var(--color-border)]">
              <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] font-mono mb-3">
                live mantle apys
              </p>
              <div className="grid grid-cols-2 gap-y-2 text-[12px] font-mono">
                <span><span className="text-[var(--color-text-muted)]">USDY</span> <span className="float-right">{(LIVE_APYS.usdy * 100).toFixed(2)}%</span></span>
                <span><span className="text-[var(--color-text-muted)]">mUSD</span> <span className="float-right">{(LIVE_APYS.mUsd * 100).toFixed(2)}%</span></span>
                <span><span className="text-[var(--color-text-muted)]">Aave</span> <span className="float-right">{(LIVE_APYS.aaveSupply * 100).toFixed(2)}%</span></span>
                <span><span className="text-[var(--color-text-muted)]">MI4</span> <span className="float-right">{(LIVE_APYS.mi4Yield * 100).toFixed(2)}%</span></span>
              </div>
            </div>

            <Button
              onClick={callAllocator}
              disabled={loading}
              size="lg"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Reasoning…
                </>
              ) : (
                <>
                  <Play />
                  Run Allocator
                </>
              )}
            </Button>

            {error && (
              <div className="rounded-lg p-3 bg-red-50 border border-red-200 text-[13px] text-red-700">
                <strong className="block mb-1">Error</strong>
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Result panel */}
      <div className="lg:col-span-7">
        <Card className="h-full min-h-[480px]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="default">// allocator agent output</Badge>
              {proposal && <Badge variant="success">verified</Badge>}
            </div>
            <CardTitle>Agent proposal</CardTitle>
            <CardDescription>
              Claude reads <span className="font-mono">skills/mantle-rwa-allocation.skill.md</span> and reasons over your policy.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!proposal && !loading && (
              <div className="flex flex-col items-center justify-center h-[340px] text-center">
                <div className="w-14 h-14 rounded-full border border-[var(--color-border)] mb-5 flex items-center justify-center text-[var(--color-text-muted)]">
                  <Target className="w-6 h-6" />
                </div>
                <p className="text-[14px] text-[var(--color-text-secondary)] max-w-xs">
                  Click <span className="font-mono">Run Allocator</span> to invoke Claude with the Skill markdown.
                </p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center h-[340px]">
                <Sparkles className="w-6 h-6 text-[var(--color-primary)] animate-pulse mb-3" />
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                  reading skill · reasoning · validating json
                </p>
              </div>
            )}

            {proposal && !loading && (
              <div className="space-y-6">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] font-mono mb-3">
                    proposed weights
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { name: "USDY", bps: proposal.weights.usdyBps, color: "#a78bfa" },
                      { name: "mUSD", bps: proposal.weights.mUsdBps, color: "#84cc16" },
                      { name: "Aave", bps: proposal.weights.aaveBps, color: "#fbbf24" },
                      { name: "MI4",  bps: proposal.weights.mi4Bps,  color: "#f9a8d4" },
                    ].map((w) => (
                      <div
                        key={w.name}
                        className={cn(
                          "rounded-lg p-3 border transition-colors",
                          w.bps > 0
                            ? "border-[var(--color-border-strong)] bg-white"
                            : "border-[var(--color-border)] bg-[var(--color-bg-soft)] opacity-60",
                        )}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="block w-2 h-2 rounded-[1px]" style={{ background: w.color }} />
                          <p className="text-[11px] font-mono uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
                            {w.name}
                          </p>
                        </div>
                        <p className="text-[18px] font-medium tabular-nums">
                          {(w.bps / 100).toFixed(2)}%
                        </p>
                        <p className="text-[10px] font-mono text-[var(--color-text-muted)]">
                          {w.bps} bps
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg p-4 bg-[var(--color-bg-soft)] border border-[var(--color-border)]">
                    <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] font-mono mb-2">
                      expected apy
                    </p>
                    <p className="text-[22px] font-medium tabular-nums">
                      {(proposal.expectedAPYBps / 100).toFixed(2)}%
                    </p>
                  </div>
                  <div className="rounded-lg p-4 bg-[var(--color-bg-soft)] border border-[var(--color-border)]">
                    <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] font-mono mb-2">
                      risk score
                    </p>
                    <p className="text-[22px] font-medium tabular-nums">
                      {proposal.riskScore}{" "}
                      <span className="text-[14px] text-[var(--color-text-muted)]">/10</span>
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] font-mono mb-3">
                    agent reasoning
                  </p>
                  <div className="rounded-lg p-4 bg-[var(--color-bg-invert)] border border-[var(--color-bg-invert-soft)]">
                    <p className="text-[13px] text-[var(--color-text-on-invert)] leading-relaxed">
                      {proposal.reasoning}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--color-border)]">
                  <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] font-mono mb-2">
                    on-chain reasoning hash (sha-256)
                  </p>
                  <p className="font-mono text-[11px] text-[var(--color-text-secondary)] break-all">
                    {proposal.reasoningHash}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
