"use client";

import { useTranslations } from "next-intl";
import { ScrollReveal } from "@/components/animations/ScrollReveal";

export function HowItWorks() {
  const t = useTranslations("howItWorks");

  const steps = [
    {
      n: "01",
      title: t("step1Title"),
      body: t("step1Body"),
      time: "00:00",
    },
    {
      n: "02",
      title: t("step2Title"),
      body: t("step2Body"),
      time: "00:15",
    },
    {
      n: "03",
      title: t("step3Title"),
      body: t("step3Body"),
      time: "00:30",
    },
  ];

  return (
    <section className="section relative">
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

        <div className="relative">
          {/* vertical line desktop */}
          <div
            aria-hidden
            className="absolute left-[39px] top-6 bottom-6 w-px bg-gradient-to-b from-[var(--color-primary)]/40 via-white/10 to-transparent hide-mobile"
          />

          <div className="space-y-6">
            {steps.map((step, i) => (
              <ScrollReveal key={step.n} delay={i * 120}>
                <div className="flex items-start gap-6 md:gap-10">
                  <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 rounded-2xl bg-[rgba(0,82,255,0.06)] border border-[rgba(0,82,255,0.20)] flex items-center justify-center font-mono text-[15px] text-[var(--color-primary)]">
                      {step.n}
                    </div>
                  </div>
                  <div className="flex-1 pt-2">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl md:text-2xl font-medium tracking-tight">
                        {step.title}
                      </h3>
                      <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] px-2 py-1 rounded-md border border-white/[0.08] bg-white/[0.03]">
                        {step.time}
                      </span>
                    </div>
                    <p className="text-[15px] leading-relaxed text-[var(--color-text-secondary)] max-w-[640px]">
                      {step.body}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
