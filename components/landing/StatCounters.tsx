"use client";

import { useTranslations } from "next-intl";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { NumberCounter } from "@/components/animations/NumberCounter";

const STATS = [
  {
    label: "Mantle TVL",
    value: 4,
    decimals: 1,
    prefix: "$",
    suffix: "B+",
    detail: "across mETH, cmETH, USDY, mUSD, MI4, FBTC",
  },
  {
    label: "USDY APY on Mantle",
    value: 4.65,
    decimals: 2,
    prefix: "",
    suffix: "%",
    detail: "tokenized US Treasuries via Ondo",
  },
  {
    label: "Aave V3 Mantle market",
    value: 539,
    decimals: 0,
    prefix: "$",
    suffix: "M",
    detail: "boosted lending rates",
  },
  {
    label: "ERC-8004 deployed",
    value: 16,
    decimals: 0,
    prefix: "Feb ",
    suffix: ", 2026",
    detail: "agent identity standard on Mantle Mainnet",
  },
];

export function StatCounters() {
  const t = useTranslations("counters");

  return (
    <section className="section relative overflow-hidden">
      <div className="absolute inset-0 grid-backdrop opacity-50" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <div className="container-atma relative">
        <div className="max-w-2xl mb-14">
          <ScrollReveal>
            <h2 className="display-2 gradient-text">{t("title")}</h2>
          </ScrollReveal>
          <ScrollReveal delay={80}>
            <p className="mt-4 text-[17px] text-[var(--color-text-secondary)]">
              {t("subtitle")}
            </p>
          </ScrollReveal>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.06] border border-white/[0.06] rounded-2xl overflow-hidden">
          {STATS.map((s, i) => (
            <ScrollReveal key={s.label} delay={i * 80}>
              <div className="bg-[rgba(10,14,39,0.60)] backdrop-blur-md p-7 md:p-8 h-full">
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-4">
                  {s.label}
                </p>
                <p className="text-[40px] md:text-[44px] font-medium tracking-tight leading-none">
                  <NumberCounter
                    value={s.value}
                    decimals={s.decimals}
                    prefix={s.prefix}
                    suffix={s.suffix}
                  />
                </p>
                <p className="mt-3 text-[13px] text-[var(--color-text-muted)] leading-relaxed">
                  {s.detail}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
