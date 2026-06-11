"use client";

import Link from "next/link";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">
          <ScrollReveal>
            <h2 className="display-2 max-w-[640px]">
              <span className="font-semibold">ATMA</span>{" "}
              <span className="text-[var(--color-text-secondary)] font-normal">is the protocol for treasury at scale.</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={80}>
            <Link href="#manifest" className="btn-outline whitespace-nowrap">
              Explore Architecture
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 5h8M5 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </ScrollReveal>
        </div>

        {/* 2-up diagram showcase */}
        <div className="grid md:grid-cols-2 gap-5 mb-5">
          <ScrollReveal delay={120}>
            <div className="card-diagram">
              <div className="rounded-xl overflow-hidden bg-[var(--color-bg-card-soft)] p-6 mb-6">
                <VaultStateDiagram />
              </div>
              <h3 className="text-[20px] font-medium mb-2">Allocation as a primitive.</h3>
              <p className="text-[14px] text-[var(--color-text-secondary)] leading-relaxed">
                One vault contract. Four Mantle RWA assets. Eight states enforced at the
                contract level. Every transition gas-cheap and queryable on Mantle
                Explorer.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={180}>
            <div className="card-diagram">
              <div className="rounded-xl overflow-hidden bg-[var(--color-bg-card-soft)] p-6 mb-6">
                <AgentSwarmDiagram />
              </div>
              <h3 className="text-[20px] font-medium mb-2">Skills-first reasoning.</h3>
              <p className="text-[14px] text-[var(--color-text-secondary)] leading-relaxed">
                Three specialized agents — Allocator, Risk, Reporter — each loads its
                markdown skill at runtime. Policy update = file commit. No redeploy. No
                hardcoded scripts dressed as agents.
              </p>
            </div>
          </ScrollReveal>
        </div>

        {/* 4-up feature cards with pixel-art mini diagrams */}
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-5">
          <ScrollReveal delay={240}>
            <div className="card-diagram">
              <div className="rounded-xl overflow-hidden bg-[var(--color-bg-card-soft)] p-6 mb-6">
                <PolicyAsDataDiagram />
              </div>
              <h3 className="text-[20px] font-medium mb-2">Policy as data, not code.</h3>
              <p className="text-[14px] text-[var(--color-text-secondary)] leading-relaxed">
                Inspired by CrossBeam — first prize in Anthropic's Claude Code Hackathon.
                Skills live as markdown reference files. Auditable. Updatable. Composable
                by downstream dApps.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <div className="card-diagram">
              <div className="rounded-xl overflow-hidden bg-[var(--color-bg-card-soft)] p-6 mb-6">
                <AttestationDiagram />
              </div>
              <h3 className="text-[20px] font-medium mb-2">Every decision attested.</h3>
              <p className="text-[14px] text-[var(--color-text-secondary)] leading-relaxed">
                ERC-8004 reputation events emit per allocation, rebalance, and defensive
                exit. Judges, regulators, and downstream protocols can query the full
                trace without permission.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
