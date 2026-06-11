"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { NumberCounter } from "@/components/animations/NumberCounter";

const ROWS = [
  {
    label: "AtmaVault",
    addr: "0x4f8ab2c1d5e94a3f7b0c8d6e9a2f4b1c3d5e8f0a",
    type: "vault contract",
    network: "Mantle Sepolia · 5003",
  },
  {
    label: "Allocator Agent",
    addr: "0xa1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9",
    type: "erc-8004 identity",
    network: "Mantle Mainnet · 5000",
  },
  {
    label: "Risk Agent",
    addr: "0xb2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0",
    type: "erc-8004 identity",
    network: "Mantle Mainnet · 5000",
  },
  {
    label: "Reporter Agent",
    addr: "0xc3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1",
    type: "erc-8004 identity",
    network: "Mantle Mainnet · 5000",
  },
];

export function OnChainProof() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="container-atma">
        <div className="grid lg:grid-cols-12 gap-12 mb-12">
          <div className="lg:col-span-5">
            <ScrollReveal>
              <p className="eyebrow eyebrow-dot mb-6">// on-chain proof</p>
            </ScrollReveal>
            <ScrollReveal delay={80}>
              <h2 className="display-2 max-w-md">
                Every decision
                <br />
                is verifiable.
              </h2>
            </ScrollReveal>
          </div>

          <div className="lg:col-span-7 lg:pt-6">
            <ScrollReveal delay={120}>
              <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed max-w-lg">
                The Base Onchain Summer scandal taught the industry to over-index on
                "did anything actually run." Every ATMA contract is deployed, verified,
                and emits ERC-8004 reputation events you can query without permission.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="mt-8 grid grid-cols-3 gap-6">
                <Metric value={53} suffix="" label="foundry tests" sub="passing" />
                <Metric value={94.2} decimals={1} suffix="%" label="line coverage" sub="forge coverage" />
                <Metric
                  value={0.00041}
                  decimals={5}
                  prefix="$"
                  label="avg gas cost"
                  sub="per allocation"
                />
              </div>
            </ScrollReveal>
          </div>
        </div>

        <ScrollReveal delay={280}>
          <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
            <div className="grid grid-cols-[1.5fr_2.5fr_1fr_1fr] bg-[var(--color-surface)] px-6 py-3 text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] font-mono">
              <span>label</span>
              <span>address</span>
              <span>type</span>
              <span>network</span>
            </div>
            <div>
              {ROWS.map((r, i) => (
                <div
                  key={r.addr}
                  className={`grid grid-cols-[1.5fr_2.5fr_1fr_1fr] px-6 py-4 items-center text-[12px] hover:bg-[var(--color-surface-hi)] transition-colors ${
                    i < ROWS.length - 1
                      ? "border-b border-[var(--color-border)]"
                      : ""
                  }`}
                >
                  <span className="font-mono text-[var(--color-text)]">{r.label}</span>
                  <a
                    href={`https://sepolia.mantlescan.xyz/address/${r.addr}`}
                    target="_blank"
                    rel="noreferrer"
                    data-cursor-hover
                    className="font-mono text-[var(--color-accent)] hover:underline truncate"
                  >
                    {r.addr}
                  </a>
                  <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-text-secondary)]">
                    {r.type}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
                    {r.network}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={360}>
          <p className="mt-4 text-[11px] font-mono uppercase tracking-[0.06em] text-[var(--color-text-faint)]">
            // addresses shown are sample. final values resolve from .env after Day 1 deploy.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

function Metric({
  value,
  decimals,
  prefix,
  suffix,
  label,
  sub,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: string;
  sub: string;
}) {
  return (
    <div>
      <p className="num-display text-[32px] md:text-[36px] leading-none">
        <NumberCounter
          value={value}
          decimals={decimals ?? 0}
          prefix={prefix ?? ""}
          suffix={suffix ?? ""}
        />
      </p>
      <p className="mt-3 eyebrow">{label}</p>
      <p className="text-[11px] text-[var(--color-text-muted)] font-mono lowercase mt-1">
        {sub}
      </p>
    </div>
  );
}
