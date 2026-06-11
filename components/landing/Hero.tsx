"use client";

import Link from "next/link";
import { Candlesticks } from "@/components/decor/Candlesticks";
import { ScrollReveal } from "@/components/animations/ScrollReveal";

export function Hero() {
  return (
    <section className="relative pt-24 md:pt-32 pb-24 md:pb-32 overflow-hidden">
      {/* Pixel candlesticks decoration */}
      <Candlesticks preset="all" />

      <div className="container-atma relative z-10">
        <div className="mx-auto max-w-[920px] text-center">
          <ScrollReveal>
            <h1 className="display-1">
              Treasury orchestration
              <br />
              for the on-chain economy.
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <p className="mt-6 text-[17px] md:text-[18px] text-[var(--color-text-secondary)] max-w-[640px] mx-auto leading-relaxed">
              Built for Mantle. Three AI agents allocate idle stablecoins across USDY, mUSD,
              Aave V3, and MI4 — under a verifiable policy attested on ERC-8004.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={220}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link href="/vault" className="btn-primary">
                <span className="block w-3.5 h-3.5 rounded-[2px] bg-white" aria-hidden />
                Launch on ATMA
              </Link>
              <Link
                href="https://github.com/abdullahdevrangga11/atma"
                target="_blank"
                rel="noreferrer"
                className="btn-outline"
              >
                <span className="block w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#0052ff] to-[#00d4ff]" aria-hidden />
                View on GitHub
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
