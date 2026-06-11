"use client";

import Link from "next/link";
import { LiveCandlesticks } from "@/components/decor/LiveCandlesticks";
import { Reveal, WordMask, Up, Fade } from "@/components/animations/Reveal";
import { Button } from "@/components/ui/button";
import { HeroShowcase } from "@/components/landing/HeroShowcase";

export function Hero() {
  return (
    <section className="relative pt-32 md:pt-48 pb-32 md:pb-48 overflow-hidden">
      {/*
        Live decor — sticks breathe height continuously and spike near the cursor.
        Lives behind the hero copy via z-0; pointer events captured here for the
        proximity boost. Hero content sits on z-10 with pointer-events:none on the
        wrapper so cursor still reaches the candlesticks underneath.
      */}
      <LiveCandlesticks className="z-0" hoverRadius={200} hoverBoost={1.6} />

      <div className="container-atma relative z-10 pointer-events-none">
        <div className="mx-auto max-w-[960px] text-center">
          <Reveal threshold={0.05}>
            <h1 className="display-1">
              <WordMask text="Treasury orchestration" staggerMs={70} />
              <br />
              <WordMask text="for the on-chain economy." staggerMs={70} baseDelayMs={140} />
            </h1>

            <Up delay={650} className="mt-10 max-w-[600px] mx-auto">
              <p className="text-[17px] md:text-[18px] text-[var(--color-text-secondary)] leading-relaxed">
                Built for Mantle. Three AI agents allocate idle stablecoins across USDY,
                mUSD, Aave V3, and MI4 — under a verifiable policy attested on ERC-8004.
              </p>
            </Up>

            <Up delay={820} className="mt-12 flex flex-wrap items-center justify-center gap-3 pointer-events-auto">
              <Button asChild size="lg" variant="default">
                <Link href="/vault">
                  <span className="block w-3.5 h-3.5 rounded-[2px] bg-white" aria-hidden />
                  Launch on ATMA
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link
                  href="https://github.com/abdullahdevrangga11/atma"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="block w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#0052ff] to-[#00d4ff]" aria-hidden />
                  View on GitHub
                </Link>
              </Button>
            </Up>
          </Reveal>
        </div>

        {/* Hero showcase — base.org-style preview card. Re-enables pointer events
            because users interact with the card. */}
        <div className="mt-20 md:mt-28 pointer-events-auto">
          <Reveal threshold={0.05}>
            <Up delay={0}>
              <HeroShowcase />
            </Up>
            <Fade delay={800} className="mt-12 flex justify-center">
              <div className="flex flex-col items-center gap-2 text-[var(--color-text-muted)]">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em]">
                  Move the cursor · Sticks respond
                </span>
                <div className="w-px h-12 bg-gradient-to-b from-[var(--color-text-faint)] to-transparent" />
              </div>
            </Fade>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
