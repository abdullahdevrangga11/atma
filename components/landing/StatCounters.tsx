"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";

const STATS = [
  { value: "$4B+", label: "Mantle RWA TVL" },
  { value: "$1.07B+", label: "Addressable Surface" },
  { value: "4.65%", label: "USDY APY" },
  { value: "$0.00041", label: "Avg Allocation Gas" },
];

export function StatCounters() {
  return (
    <section className="section bg-dotted">
      <div className="container-atma">
        <ScrollReveal>
          <p className="text-center text-[20px] md:text-[24px] font-medium text-[var(--color-text)] mb-2">
            Where treasury meets RWA.
          </p>
          <p className="text-center text-[14px] text-[var(--color-text-muted)] mb-14">
            ATMA composes Mantle's primitives that already work.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 md:gap-y-0">
          {STATS.map((s, i) => (
            <ScrollReveal key={s.label} delay={i * 60}>
              <div className="text-center">
                <p className="text-[36px] md:text-[44px] leading-none font-medium text-[var(--color-text)] tabular-nums">
                  {s.value}
                </p>
                <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                  {s.label}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
