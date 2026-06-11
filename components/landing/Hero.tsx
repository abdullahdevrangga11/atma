"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { GradientOrb } from "@/components/animations/GradientOrb";
import { TypeWriter } from "@/components/animations/TypeWriter";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { NumberCounter } from "@/components/animations/NumberCounter";

export function Hero() {
  const t = useTranslations("hero");

  return (
    <section className="relative min-h-screen flex items-center pt-32 pb-24 overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 grid-backdrop opacity-60" />
      <div className="noise" />
      <GradientOrb
        variant="primary"
        size={720}
        className="top-[-200px] left-[-180px]"
        delay="0s"
      />
      <GradientOrb
        variant="accent"
        size={520}
        className="bottom-[-160px] right-[-120px]"
        delay="4s"
      />

      <div className="container-atma relative z-10">
        {/* Eyebrow chip */}
        <ScrollReveal>
          <div className="chip mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] pulse-glow" />
            {t("eyebrow")}
          </div>
        </ScrollReveal>

        {/* Headline */}
        <ScrollReveal delay={100}>
          <h1 className="display-1 max-w-[1100px] gradient-text">
            {t("title")}
          </h1>
        </ScrollReveal>

        {/* TypeWriter subheadline */}
        <ScrollReveal delay={200}>
          <p className="mt-6 text-[20px] md:text-[22px] font-mono text-[var(--color-accent)]">
            <TypeWriter text={t("subtitleTyped")} speed={28} startDelay={800} />
          </p>
        </ScrollReveal>

        {/* Body */}
        <ScrollReveal delay={300}>
          <p className="mt-5 max-w-[680px] text-[17px] leading-relaxed text-[var(--color-text-secondary)]">
            {t("subtitle")}
          </p>
        </ScrollReveal>

        {/* CTAs */}
        <ScrollReveal delay={400}>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <MagneticButton as="a" href="/vault" strength={0.25}>
              <span className="btn-primary">
                {t("ctaPrimary")}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M3 7H11M11 7L7 3M11 7L7 11"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </MagneticButton>

            <MagneticButton
              as="a"
              href="https://github.com/abdullahdevrangga11/atma"
              target="_blank"
              rel="noreferrer"
              strength={0.15}
            >
              <span className="btn-ghost">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38v-1.34c-2.23.48-2.7-1.07-2.7-1.07-.36-.93-.89-1.17-.89-1.17-.73-.5.05-.49.05-.49.81.06 1.23.83 1.23.83.72 1.22 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.01.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.44 1.11.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                {t("ctaSecondary")}
              </span>
            </MagneticButton>
          </div>
        </ScrollReveal>

        {/* Hero stat strip */}
        <ScrollReveal delay={550}>
          <div className="mt-20 grid grid-cols-3 gap-px bg-white/[0.04] border border-white/[0.06] rounded-2xl overflow-hidden max-w-[860px]">
            <div className="bg-[rgba(10,14,39,0.50)] backdrop-blur-md p-6 md:p-8">
              <p className="text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                {t("statTvlLabel")}
              </p>
              <p className="mt-3 display-2 font-medium text-white">
                {t("statTvl")}
              </p>
            </div>
            <div className="bg-[rgba(10,14,39,0.50)] backdrop-blur-md p-6 md:p-8">
              <p className="text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                {t("statBpsLabel")}
              </p>
              <p className="mt-3 display-2 font-medium">
                <NumberCounter
                  value={463}
                  decimals={0}
                  suffix=" bps"
                  className="text-[var(--color-accent)]"
                />
              </p>
            </div>
            <div className="bg-[rgba(10,14,39,0.50)] backdrop-blur-md p-6 md:p-8">
              <p className="text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                {t("statAgentsLabel")}
              </p>
              <p className="mt-3 display-2 font-medium text-white">
                <NumberCounter value={3} decimals={0} suffix=" agents" />
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hide-mobile">
        <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/30 to-transparent" />
      </div>
    </section>
  );
}
