"use client";

import Link from "next/link";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { StateMachineViz } from "@/components/landing/StateMachineViz";

export function Hero() {
  return (
    <section className="relative pt-28 md:pt-36 pb-24 md:pb-32 overflow-hidden">
      {/* Backdrop — subtle dot grid, no orbs */}
      <div className="absolute inset-0 dot-grid opacity-50" aria-hidden />
      <div
        className="absolute left-0 right-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--color-border-strong), transparent)",
        }}
        aria-hidden
      />

      <div className="container-atma relative z-10">
        {/* Top meta strip — coordinates / build info */}
        <ScrollReveal>
          <div className="flex flex-wrap items-center justify-between gap-y-2 mb-12 md:mb-20 text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-faint)] font-mono">
            <div className="flex items-center gap-4">
              <span>// v0.1.0</span>
              <span className="hidden md:inline">06°S 110°E · YOGYAKARTA</span>
              <span className="hidden md:inline">UGM SE '23</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[var(--color-text-secondary)]">build</span>
              <span className="text-[var(--color-accent)] tabular-nums">
                {process.env.NEXT_PUBLIC_BUILD_ID || "240ms · sepolia · 5003"}
              </span>
            </div>
          </div>
        </ScrollReveal>

        {/* Main editorial grid */}
        <div className="grid lg:grid-cols-12 gap-y-12 lg:gap-x-12">
          {/* Left: editorial copy */}
          <div className="lg:col-span-7">
            <ScrollReveal>
              <p className="eyebrow eyebrow-dot mb-7">
                Mantle Turing Test Hackathon 2026 / AI × RWA
              </p>
            </ScrollReveal>

            <ScrollReveal delay={80}>
              <h1 className="display-1 max-w-[820px]">
                Treasury policy
                <br />
                as a primitive,
                <br />
                <span className="inline-flex items-baseline gap-3">
                  <span className="text-[var(--color-text-muted)]">not</span>
                  <span className="inline-block px-3 -mb-1 pt-1 pb-2 bg-[var(--color-paper)] text-[var(--color-bg)]">
                    a dashboard.
                  </span>
                </span>
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={180}>
              <div className="mt-10 max-w-[540px] space-y-5 text-[16px] leading-[1.55] text-[var(--color-text-secondary)]">
                <p>
                  ATMA composes three agents — <span className="text-[var(--color-text)]">Allocator</span>,{" "}
                  <span className="text-[var(--color-text)]">Risk</span>,{" "}
                  <span className="text-[var(--color-text)]">Reporter</span> — under a Skills-First policy.
                  Idle USDC routes through{" "}
                  <span className="font-mono text-[14px] text-[var(--color-text)]">{`{usdy, mUsd, aave, mi4}`}</span>{" "}
                  with every decision signed by an{" "}
                  <span className="text-[var(--color-text)]">ERC-8004 agent identity</span>, attested
                  permanently on Mantle.
                </p>
                <p className="text-[14px] text-[var(--color-text-muted)]">
                  No DAO multisig theater. No off-chain dashboards. Just a verifiable
                  primitive that any treasury contract can call.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={260}>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link href="/vault" className="btn-solid">
                  Launch vault
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M1 5h8M5 1l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
                <Link
                  href="https://github.com/abdullahdevrangga11/atma"
                  className="btn-link"
                  target="_blank"
                  rel="noreferrer"
                >
                  Read the source
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M3 1h6v6M9 1L1 9"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </Link>
              </div>
            </ScrollReveal>
          </div>

          {/* Right: live state machine */}
          <div className="lg:col-span-5">
            <ScrollReveal delay={120}>
              <StateMachineViz />
            </ScrollReveal>
          </div>
        </div>

        {/* Stat strip — flat, no glass cards */}
        <ScrollReveal delay={340}>
          <div className="mt-24 md:mt-32 grid grid-cols-2 md:grid-cols-4 gap-y-8 md:gap-y-0 md:gap-x-12">
            <Stat label="Mantle RWA TVL" value="$4.0B" sub="addressable surface" />
            <Stat label="USDY APY" value="4.65%" sub="ondo · treasury-backed" mono />
            <Stat label="Aave V3 Mantle" value="$539M" sub="boosted lending" mono />
            <Stat
              label="Sample outperformance"
              value="+463 bps"
              sub="vs do-nothing baseline"
              accent
            />
          </div>
        </ScrollReveal>

        <ScrollReveal delay={420}>
          <div className="rule mt-16" />
        </ScrollReveal>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
  mono,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="eyebrow">{label}</p>
      <p
        className={`num-display text-[44px] md:text-[48px] leading-none ${
          accent ? "text-[var(--color-accent)]" : "text-[var(--color-text)]"
        } ${mono ? "font-mono" : ""}`}
      >
        {value}
      </p>
      <p className="text-[12px] text-[var(--color-text-muted)] font-mono lowercase">{sub}</p>
    </div>
  );
}
