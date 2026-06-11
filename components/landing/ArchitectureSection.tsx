"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";

const ASCII = `
┌──────────────────────────────────────────────────────────────────┐
│  USER  (DAO multisig · startup treasury · solo founder)          │
│        Privy embedded wallet · email login · zero metamask       │
└────────────────────────────────────┬─────────────────────────────┘
                                     │
                  ┌──────────────────▼──────────────────┐
                  │     ATMA ORCHESTRATOR (TypeScript)  │
                  │     Anthropic Claude · skills/*.md  │
                  └─────┬──────────┬──────────┬─────────┘
                        │          │          │
              ┌─────────▼──┐  ┌────▼─────┐  ┌─▼────────┐
              │ Allocator  │  │ Risk     │  │ Reporter │
              │ skill: rwa │  │ skill:   │  │ skill:   │
              │ allocation │  │ monitor  │  │ reports  │
              └─────────┬──┘  └────┬─────┘  └─┬────────┘
                        └──────────┼──────────┘
                                   ▼ viem tx
              ┌────────────────────────────────────────┐
              │  AtmaVault.sol — Mantle Sepolia 5003   │
              │  deposit · propose · execute · attest  │
              │  state machine: 8 states · 4 fails     │
              └────────┬───────────────────────────────┘
                       │
        ┌──────────────┼──────────────┬──────────────┐
        ▼              ▼              ▼              ▼
    ┌───────┐    ┌──────────┐    ┌─────────┐    ┌─────┐
    │ USDY  │    │  mUSD    │    │ Aave V3 │    │ MI4 │
    │ 4.65% │    │  rebasing│    │ supply  │    │ idx │
    └───────┘    └──────────┘    └─────────┘    └─────┘

   ┌─ ERC-8004 ─ Mantle Mainnet 5000 ─────────────────┐
   │  Identity Registry · Reputation · Validation     │
   │  3 agent NFTs · 1 reputation event per decision  │
   └──────────────────────────────────────────────────┘
`;

export function ArchitectureSection() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="container-atma">
        <div className="grid lg:grid-cols-12 gap-12 mb-16">
          <div className="lg:col-span-4 lg:sticky lg:top-32 self-start">
            <ScrollReveal>
              <p className="eyebrow eyebrow-dot mb-6">// architecture</p>
            </ScrollReveal>
            <ScrollReveal delay={80}>
              <h2 className="display-2 max-w-md">
                Three agents.
                <br />
                One vault.
                <br />
                <span className="text-[var(--color-text-muted)]">Eight states.</span>
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={160}>
              <p className="mt-6 text-[14px] leading-relaxed text-[var(--color-text-secondary)] max-w-sm">
                Every transition is gas-cheap, single-SSTORE, and emits an event indexed
                by the calling agent's ERC-8004 identity. Judges can query the full
                decision trace from the Mantle Explorer.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={240}>
              <div className="mt-8 flex flex-wrap gap-2">
                <span className="tag">solidity 0.8.24</span>
                <span className="tag">openzeppelin v5</span>
                <span className="tag">foundry</span>
                <span className="tag tag-accent">erc-4626</span>
                <span className="tag tag-accent">erc-8004</span>
              </div>
            </ScrollReveal>
          </div>

          <div className="lg:col-span-8">
            <ScrollReveal delay={120}>
              <div className="code-block">
                <div className="code-block-header">
                  <span>architecture.txt</span>
                  <span className="text-[var(--color-text-faint)]">
                    rendered from ARCHITECTURE.md
                  </span>
                </div>
                <pre className="text-[11.5px] md:text-[12.5px] leading-[1.45] !p-5 md:!p-7">
                  {ASCII}
                </pre>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
