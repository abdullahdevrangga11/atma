"use client";

import { useState } from "react";

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

const DEFAULT_AMOUNT_USDC_BASE = "10000000000"; // 10,000 USDC (6 decimals)

export function VaultDemo() {
  const [amount, setAmount] = useState("10000");
  const [tolerance, setTolerance] = useState<"conservative" | "balanced" | "aggressive">(
    "balanced",
  );
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
            liveAPYs: {
              usdy: 0.0465,
              mUsd: 0.0455,
              aaveSupply: 0.0510,
              mi4Yield: 0.0620,
            },
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
      if (!res.ok || !json.data) {
        throw new Error(json.error || "Request failed");
      }
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
        <div className="card-feature !p-8">
          <p className="eyebrow mb-5">// inputs</p>
          <label className="block mb-5">
            <span className="text-[12px] font-medium text-[var(--color-text)] block mb-2">
              Target deposit (USDC)
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              step="100"
              className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-text)] font-mono text-[15px]"
            />
          </label>

          <label className="block mb-7">
            <span className="text-[12px] font-medium text-[var(--color-text)] block mb-2">
              Risk tolerance
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(["conservative", "balanced", "aggressive"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTolerance(t)}
                  className={`px-3 py-2.5 rounded-lg border text-[12px] font-medium transition-colors ${
                    tolerance === t
                      ? "border-[var(--color-text)] bg-[var(--color-text)] text-white"
                      : "border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </label>

          <div className="mb-6 p-4 rounded-lg bg-[var(--color-bg-soft)] border border-[var(--color-border)]">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] font-mono mb-2">
              live mantle apys
            </p>
            <div className="grid grid-cols-2 gap-2 text-[12px] font-mono">
              <span><span className="text-[var(--color-text-muted)]">USDY:</span> 4.65%</span>
              <span><span className="text-[var(--color-text-muted)]">mUSD:</span> 4.55%</span>
              <span><span className="text-[var(--color-text-muted)]">Aave:</span> 5.10%</span>
              <span><span className="text-[var(--color-text-muted)]">MI4:</span> 6.20%</span>
            </div>
          </div>

          <button
            type="button"
            onClick={callAllocator}
            disabled={loading}
            className="btn-primary w-full justify-center disabled:opacity-50"
          >
            {loading ? "Reasoning…" : "Run Allocator"}
            {!loading && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 5h8M5 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          {error && (
            <div className="mt-5 p-4 rounded-lg bg-red-50 border border-red-200 text-[13px] text-red-700">
              <strong className="block mb-1">Error</strong>
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Result panel */}
      <div className="lg:col-span-7">
        <div className="card-feature !p-8 h-full min-h-[480px]">
          <p className="eyebrow mb-5">// allocator agent output</p>

          {!proposal && !loading && (
            <div className="flex flex-col items-center justify-center h-[400px] text-center">
              <div className="w-12 h-12 rounded-full border border-[var(--color-border)] mb-5 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="10" cy="10" r="2" fill="currentColor" />
                </svg>
              </div>
              <p className="text-[14px] text-[var(--color-text-secondary)] max-w-xs">
                Click <span className="font-mono">Run Allocator</span> to invoke Claude with the Skill markdown.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-[400px]">
              <div className="w-2 h-2 rounded-full bg-[var(--color-text)] animate-pulse mb-3" />
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                reading skill · reasoning · validating json
              </p>
            </div>
          )}

          {proposal && !loading && (
            <div className="space-y-6">
              {/* Weights */}
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
                    <div key={w.name} className="rounded-lg p-3 border border-[var(--color-border)]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="block w-2 h-2 rounded-[1px]" style={{ background: w.color }} />
                        <p className="text-[11px] font-mono uppercase tracking-[0.06em] text-[var(--color-text-muted)]">{w.name}</p>
                      </div>
                      <p className="text-[18px] font-medium tabular-nums">
                        {(w.bps / 100).toFixed(2)}%
                      </p>
                      <p className="text-[10px] font-mono text-[var(--color-text-muted)]">{w.bps} bps</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metrics */}
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
                    {proposal.riskScore} <span className="text-[14px] text-[var(--color-text-muted)]">/10</span>
                  </p>
                </div>
              </div>

              {/* Reasoning */}
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

              {/* Reasoning hash */}
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
        </div>
      </div>
    </div>
  );
}
