"use client";

import { useTranslations } from "next-intl";
import { ScrollReveal } from "@/components/animations/ScrollReveal";

type FeatureKey = "allocator" | "risk" | "reporter";

const ICONS: Record<FeatureKey, React.ReactNode> = {
  allocator: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 1.667v16.666M3.333 6.667l13.334 6.666M3.333 13.333l13.334-6.666"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  risk: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 6.667v3.333m0 3.333h.008M8.575 2.717 1.517 14.5a1.667 1.667 0 0 0 1.425 2.5h14.116a1.667 1.667 0 0 0 1.425-2.5L11.425 2.717a1.667 1.667 0 0 0-2.85 0Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  reporter: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M2.5 17.5v-8.333m5 8.333v-15m5 15V10m5 7.5v-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
};

const DETAILS: Record<FeatureKey, { lines: string[]; color: string }> = {
  allocator: {
    lines: ["USDY · mUSD · Aave V3 · MI4", "Policy caps + risk tolerance"],
    color: "var(--color-primary)",
  },
  risk: {
    lines: ["Peg · oracle · drawdown", "≤2 min trigger to defensive exit"],
    color: "var(--color-warning)",
  },
  reporter: {
    lines: ["Weekly P&L vs baseline", "ERC-8004 attestation per decision"],
    color: "var(--color-accent)",
  },
};

export function FeatureCards() {
  const t = useTranslations("features");
  const features: FeatureKey[] = ["allocator", "risk", "reporter"];

  return (
    <section className="section relative">
      <div className="absolute inset-0 grid-backdrop opacity-30" />
      <div className="container-atma relative">
        <div className="max-w-2xl mb-16">
          <ScrollReveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-4">
              {t("eyebrow")}
            </p>
          </ScrollReveal>
          <ScrollReveal delay={80}>
            <h2 className="display-2 gradient-text">{t("title")}</h2>
          </ScrollReveal>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {features.map((key, i) => (
            <ScrollReveal key={key} delay={150 + i * 100}>
              <article className="card-atma p-7 md:p-8 h-full flex flex-col">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-6"
                  style={{
                    background: `${DETAILS[key].color}1a`,
                    color: DETAILS[key].color,
                    border: `1px solid ${DETAILS[key].color}33`,
                  }}
                >
                  {ICONS[key]}
                </div>

                <h3 className="text-xl font-medium tracking-tight mb-3">
                  {t(`${key}.title`)}
                </h3>
                <p className="text-[15px] leading-relaxed text-[var(--color-text-secondary)] mb-6">
                  {t(`${key}.body`)}
                </p>

                <ul className="mt-auto space-y-2 pt-6 border-t border-white/[0.06]">
                  {DETAILS[key].lines.map((line) => (
                    <li
                      key={line}
                      className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--color-text-muted)] flex items-center gap-2"
                    >
                      <span
                        className="w-1 h-1 rounded-full"
                        style={{ background: DETAILS[key].color }}
                      />
                      {line}
                    </li>
                  ))}
                </ul>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
