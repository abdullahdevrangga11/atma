"use client";

import { useTranslations } from "next-intl";
import { ScrollReveal } from "@/components/animations/ScrollReveal";

const PARTNERS = [
  "Mantle",
  "Byreal",
  "Bybit",
  "Tencent Cloud",
  "Nansen",
  "Elfa AI",
  "Animoca Brands",
  "Allora Network",
  "Virtuals Protocol",
  "Mirana Ventures",
  "Hashed",
  "DoraHacks",
];

export function PartnerMarquee() {
  const t = useTranslations("marquee");

  return (
    <section className="py-20 border-y border-white/[0.06] relative overflow-hidden">
      <div className="absolute inset-0 grid-backdrop opacity-30" />

      <div className="container-atma relative mb-10">
        <ScrollReveal>
          <p className="text-center font-mono text-[11px] uppercase tracking-[0.10em] text-[var(--color-text-muted)]">
            {t("label")} ·{" "}
            <span className="text-[var(--color-text-secondary)]">
              {PARTNERS.length} ecosystem partners
            </span>
          </p>
        </ScrollReveal>
      </div>

      {/* edge masks */}
      <div className="relative">
        <div
          aria-hidden
          className="absolute left-0 inset-y-0 w-32 z-10 pointer-events-none bg-gradient-to-r from-[var(--color-bg)] to-transparent"
        />
        <div
          aria-hidden
          className="absolute right-0 inset-y-0 w-32 z-10 pointer-events-none bg-gradient-to-l from-[var(--color-bg)] to-transparent"
        />

        <div className="overflow-hidden">
          <div className="marquee flex gap-12 whitespace-nowrap w-max">
            {[...PARTNERS, ...PARTNERS].map((p, i) => (
              <div
                key={`${p}-${i}`}
                className="text-[24px] md:text-[28px] font-medium tracking-tight text-white/30 hover:text-white/80 transition-colors duration-300 flex items-center gap-3"
              >
                {p}
                <span className="w-1 h-1 rounded-full bg-white/20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
