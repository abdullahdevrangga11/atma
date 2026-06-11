"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";

const PARTNERS = [
  "Mantle",
  "Byreal",
  "Bybit",
  "Tencent Cloud",
  "Nansen",
  "Elfa AI",
  "Animoca Brands",
  "Allora",
  "Virtuals",
  "Hashed",
];

export function LogoStrip() {
  return (
    <section className="pb-8 md:pb-12 relative bg-[var(--color-bg)]">
      <div className="container-atma">
        <ScrollReveal>
          <p className="text-center text-[13px] text-[var(--color-text-muted)] mb-6">
            Trusted by 10+ ecosystem partners.
          </p>
        </ScrollReveal>
        <ScrollReveal delay={80}>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {PARTNERS.map((p) => (
              <span
                key={p}
                className="text-[18px] md:text-[20px] font-medium tracking-tight text-[var(--color-text-faint)] hover:text-[var(--color-text-secondary)] transition-colors"
              >
                {p}
              </span>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
