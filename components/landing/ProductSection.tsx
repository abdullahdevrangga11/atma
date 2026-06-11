"use client";

import Link from "next/link";
import { Reveal, Up, WordMask, ScaleIn } from "@/components/animations/Reveal";
import {
  VaultStateDiagram,
  AgentSwarmDiagram,
  AttestationDiagram,
  PolicyAsDataDiagram,
} from "@/components/landing/PixelDiagrams";

export function ProductSection() {
  return (
    <section className="section bg-[var(--color-bg)]">
      <div className="container-atma">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-10 mb-20">
            <h2 className="display-2 max-w-[680px]">
              <span className="font-semibold">
                <WordMask text="ATMA" staggerMs={70} />
              </span>{" "}
              <span className="text-[var(--color-text-secondary)] font-normal">
                <WordMask text="is the protocol for treasury at scale." staggerMs={60} baseDelayMs={120} />
              </span>
            </h2>
            <Up delay={600}>
              <Link href="#cta" className="btn-outline whitespace-nowrap">
                Explore Architecture
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 5h8M5 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </Up>
          </div>
        </Reveal>

        {/* 2-up diagram showcase */}
        <Reveal>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <ScaleIn delay={120}>
              <div className="card-diagram !p-12">
                <div className="rounded-2xl overflow-hidden bg-[var(--color-bg-card-soft)] p-10 mb-8">
                  <VaultStateDiagram />
                </div>
                <h3 className="text-[24px] font-medium mb-3 tracking-[-0.01em]">Allocation as a primitive.</h3>
                <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed">
                  One vault contract. Four Mantle RWA assets. Eight states enforced at the
                  contract level. Every transition gas-cheap and queryable on Mantle
                  Explorer.
                </p>
              </div>
            </ScaleIn>

            <ScaleIn delay={240}>
              <div className="card-diagram !p-12">
                <div className="rounded-2xl overflow-hidden bg-[var(--color-bg-card-soft)] p-10 mb-8">
                  <AgentSwarmDiagram />
                </div>
                <h3 className="text-[24px] font-medium mb-3 tracking-[-0.01em]">Skills-first reasoning.</h3>
                <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed">
                  Three specialized agents — Allocator, Risk, Reporter — each loads its
                  markdown skill at runtime. Policy update = file commit. No redeploy. No
                  hardcoded scripts dressed as agents.
                </p>
              </div>
            </ScaleIn>
          </div>
        </Reveal>

        <Reveal>
          <div className="grid md:grid-cols-2 gap-6">
            <ScaleIn delay={120}>
              <div className="card-diagram !p-12">
                <div className="rounded-2xl overflow-hidden bg-[var(--color-bg-card-soft)] p-10 mb-8">
                  <PolicyAsDataDiagram />
                </div>
                <h3 className="text-[24px] font-medium mb-3 tracking-[-0.01em]">Policy as data, not code.</h3>
                <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed">
                  Inspired by CrossBeam — first prize in Anthropic's Claude Code Hackathon.
                  Skills live as markdown reference files. Auditable. Updatable. Composable
                  by downstream dApps.
                </p>
              </div>
            </ScaleIn>

            <ScaleIn delay={240}>
              <div className="card-diagram !p-12">
                <div className="rounded-2xl overflow-hidden bg-[var(--color-bg-card-soft)] p-10 mb-8">
                  <AttestationDiagram />
                </div>
                <h3 className="text-[24px] font-medium mb-3 tracking-[-0.01em]">Every decision attested.</h3>
                <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed">
                  ERC-8004 reputation events emit per allocation, rebalance, and defensive
                  exit. Judges, regulators, and downstream protocols can query the full
                  trace without permission.
                </p>
              </div>
            </ScaleIn>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
