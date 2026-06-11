"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { GradientOrb } from "@/components/animations/GradientOrb";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="relative pt-32 pb-12 overflow-hidden border-t border-white/[0.06]">
      <GradientOrb
        variant="primary"
        size={500}
        className="bottom-[-200px] left-1/2 -translate-x-1/2"
        delay="2s"
      />

      <div className="container-atma relative">
        <div className="grid md:grid-cols-12 gap-12 mb-20">
          <div className="md:col-span-5">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 bg-[var(--color-primary)] rounded-md rotate-45" />
                <div className="absolute inset-[5px] bg-[var(--color-bg)] rounded-sm rotate-45" />
              </div>
              <span className="font-display font-semibold text-[20px] tracking-tight">
                ATMA
              </span>
            </div>
            <p className="display-2 mb-6 gradient-text max-w-[480px]">
              {t("tagline")}
            </p>
            <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">
              {t("builtBy")}
            </p>
            <p className="mt-2 text-[13px] text-[var(--color-text-muted)] leading-relaxed">
              {t("hackathon")}
            </p>
          </div>

          <div className="md:col-span-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-5">
              {t("sections.product")}
            </p>
            <ul className="space-y-3 text-[14px]">
              <li>
                <Link href="/vault" className="underline-reveal text-[var(--color-text-secondary)] hover:text-white">
                  Vault
                </Link>
              </li>
              <li>
                <Link href="/reports" className="underline-reveal text-[var(--color-text-secondary)] hover:text-white">
                  Reports
                </Link>
              </li>
              <li>
                <Link href="/skills" className="underline-reveal text-[var(--color-text-secondary)] hover:text-white">
                  Skills
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-5">
              {t("sections.resources")}
            </p>
            <ul className="space-y-3 text-[14px]">
              <li>
                <a href="https://github.com/abdullahdevrangga11/atma" target="_blank" rel="noreferrer" className="underline-reveal text-[var(--color-text-secondary)] hover:text-white">
                  GitHub
                </a>
              </li>
              <li>
                <a href="https://github.com/abdullahdevrangga11/atma#architecture" target="_blank" rel="noreferrer" className="underline-reveal text-[var(--color-text-secondary)] hover:text-white">
                  Architecture
                </a>
              </li>
              <li>
                <a href="https://github.com/abdullahdevrangga11/atma#risk_model" target="_blank" rel="noreferrer" className="underline-reveal text-[var(--color-text-secondary)] hover:text-white">
                  Risk Model
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-5">
              {t("sections.social")}
            </p>
            <ul className="space-y-3 text-[14px]">
              <li>
                <a href="https://x.com/" target="_blank" rel="noreferrer" className="underline-reveal text-[var(--color-text-secondary)] hover:text-white">
                  @devrangga on X
                </a>
              </li>
              <li>
                <a href="mailto:abdullahdevrangga@gmail.com" className="underline-reveal text-[var(--color-text-secondary)] hover:text-white">
                  abdullahdevrangga@gmail.com
                </a>
              </li>
              <li>
                <a href="https://dorahacks.io/hackathon/mantleturingtesthackathon2026" target="_blank" rel="noreferrer" className="underline-reveal text-[var(--color-text-secondary)] hover:text-white">
                  DoraHacks
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
            © 2026 ATMA · MIT License
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
            Deployed on Mantle Sepolia · ChainId 5003
          </p>
        </div>
      </div>
    </footer>
  );
}
