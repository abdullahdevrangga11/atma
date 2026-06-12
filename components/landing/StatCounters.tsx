"use client";

import { Reveal, Up, WordMask } from "@/components/animations/Reveal";
import { Logo3DLazy } from "@/components/landing/Logo3DLazy";

const STATS = [
  { value: "$4B+", label: "Mantle RWA TVL" },
  { value: "$1.07B+", label: "Addressable Surface" },
  { value: "4.65%", label: "USDY APY" },
  { value: "$0.00041", label: "Avg Allocation Gas" },
];

export function StatCounters() {
  return (
    <section className="section bg-dotted">
      <div className="container-amana">
        <Reveal>
          <div className="text-center max-w-[640px] mx-auto mb-14">
            <p className="display-3 text-[var(--color-text)] mb-4">
              <WordMask text="Where treasury meets RWA." staggerMs={70} />
            </p>
            <Up delay={500}>
              <p className="text-[15px] text-[var(--color-text-muted)] leading-relaxed">
                AMANA composes the Mantle primitives that already work — Ondo, Aave V3, MI4 —
                under a verifiable agentic policy.
              </p>
            </Up>
          </div>

          {/* Scroll-reactive extruded 3D logo (lazy; three.js loads only here) */}
          <Logo3DLazy />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-14 md:gap-y-0 md:gap-x-8">
            {STATS.map((s, i) => (
              <Up key={s.label} delay={700 + i * 100}>
                <div className="text-center">
                  <p className="text-[44px] md:text-[56px] leading-none font-medium text-[var(--color-text)] tabular-nums">
                    {s.value}
                  </p>
                  <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                    {s.label}
                  </p>
                </div>
              </Up>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
