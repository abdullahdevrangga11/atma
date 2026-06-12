"use client";

import { Reveal, Up } from "@/components/animations/Reveal";

const PARTNERS = [
  "Mantle",
  "Byreal",
  "Bybit",
  "Tencent Cloud",
  "Nansen",
  "Elfa AI",
  "Animoca",
  "Allora",
  "Virtuals",
  "Hashed",
];

export function LogoStrip() {
  return (
    <section className="section-snug relative bg-[var(--color-bg)]">
      <div className="container-amana">
        <Reveal>
          <Up delay={0}>
            <p className="text-center text-[13px] text-[var(--color-text-muted)] mb-10">
              Trusted by 10+ ecosystem partners across the Mantle hackathon.
            </p>
          </Up>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {PARTNERS.map((p, i) => (
              <Up key={p} delay={120 + i * 40} className="inline-block">
                <span className="text-[19px] md:text-[22px] font-medium tracking-tight text-[var(--color-text-faint)] hover:text-[var(--color-text-secondary)] transition-colors duration-300">
                  {p}
                </span>
              </Up>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
