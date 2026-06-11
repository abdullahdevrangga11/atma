"use client";

import { Reveal, Up, WordMask } from "@/components/animations/Reveal";
import { FiddleHover } from "@/components/animations/FiddleHover";

// CTA-specific glyph set — leans into the open-source / treasury-attestation
// language rather than the percent/bps mix used on the hero.
const CTA_SYMBOLS = [
  "{", "}", "/", "→", "▲", "◆", "0", "1", "$", "Σ", "•", "*", ">",
];

export function BlueCTA() {
  return (
    <section
      id="cta"
      className="relative overflow-hidden bg-[var(--color-primary)] text-white"
    >
      {/*
        FiddleHover covers the whole CTA. `blockVariant="light"` paints active
        blocks in white with brand-violet symbols, reading as cut-outs / light
        breaking through the violet section — friendlier than the dark ink
        variant for a CTA. Bigger blocks + calmer cluster size than the hero
        since the section is short and the effect should feel deliberate.
      */}
      <FiddleHover
        as="div"
        symbols={CTA_SYMBOLS}
        blockVariant="light"
        blockSize={28}
        detectionRadius={70}
        clusterSize={5}
        blockLifetime={460}
        emptyRatio={0.32}
        scrambleRatio={0.26}
        scrambleInterval={150}
        className="container-atma relative z-10 py-28 md:py-40"
      >
        <Reveal>
          <div className="mx-auto max-w-[860px] text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/60 mb-6">
              // open source · mit · skill-first
            </p>

            <h2 className="display-2">
              <WordMask
                text="Start orchestrating treasury on Mantle."
                staggerMs={70}
              />
            </h2>

            <Up delay={650} className="mt-8 mx-auto max-w-[560px]">
              <p className="text-[16px] md:text-[17px] text-white/80 leading-relaxed">
                Audit the markdown. Compose ATMA into your own treasury contract.
                Every decision is signed by an agent identity and attested on
                ERC-8004 — yours forever.
              </p>
            </Up>

            <Up delay={820}>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <a href="/vault" className="btn-on-blue-primary">
                  <span
                    className="block w-3.5 h-3.5 rounded-[2px] bg-[var(--color-primary)]"
                    aria-hidden
                  />
                  Launch on ATMA
                </a>
                <a
                  href="https://github.com/abdullahdevrangga11/atma"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-on-blue-outline"
                >
                  View on GitHub
                </a>
              </div>
            </Up>
          </div>
        </Reveal>
      </FiddleHover>
    </section>
  );
}
