"use client";

import Link from "next/link";
import { Reveal, Up, WordMask } from "@/components/animations/Reveal";

type Feature = {
  title: string;
  body: string;
  href: string;
  icon: React.ReactNode;
};

const FEATURES: Feature[] = [
  {
    title: "Allocator",
    body: "Reasons across USDY, mUSD, Aave V3 supply, and MI4 under your policy. Caps, risk tolerance, liquidity floors — enforced before any tx.",
    href: "/skills",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="transition-transform duration-700 group-hover:rotate-180">
        <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="11" cy="11" r="2" fill="currentColor" />
        <path d="M11 1v3M11 18v3M1 11h3M18 11h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Risk",
    body: "Watches peg drift, oracle deviation, drawdown breach. Triggers defensive exit in under 2 minutes — replicates March 10 wstETH glitch as a test.",
    href: "/skills",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="transition-transform duration-700 group-hover:scale-110">
        <path d="M11 1l9 6v8l-9 6-9-6V7l9-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M11 7v5M11 15h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Reporter",
    body: "Weekly P&L vs do-nothing baseline. Outperformance in basis points. Compliance CSV export. Every decision attested on ERC-8004.",
    href: "/reports",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 19V9m5 10V3m5 16v-7m5 7V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="origin-bottom transition-transform duration-700 group-hover:scale-y-110" />
      </svg>
    ),
  },
];

export function FeatureCards() {
  return (
    <section className="section bg-[var(--color-bg)]">
      <div className="container-atma">
        <Reveal>
          <div className="max-w-[640px] mb-20">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-5">
              <Up delay={0}>// three agents · one verifiable policy</Up>
            </p>
            <h2 className="display-2 text-[var(--color-text)]">
              <WordMask text="Composable." staggerMs={70} />{" "}
              <WordMask text="Auditable." staggerMs={70} baseDelayMs={120} />{" "}
              <WordMask text="Always-on." staggerMs={70} baseDelayMs={240} />
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <Up key={f.title} delay={500 + i * 100}>
                <Link href={f.href} className="card-feature block h-full group !p-10 relative overflow-hidden">
                  <span className="arrow-indicator">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M5 13L13 5M13 5H7M13 5V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>

                  {/* Hover gradient sweep */}
                  <span aria-hidden className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[var(--color-primary-soft)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <div className="text-[var(--color-text)] mb-8 relative">
                    {f.icon}
                  </div>
                  <h3 className="text-[19px] font-medium text-[var(--color-text)] mb-3 relative">
                    {f.title}
                  </h3>
                  <p className="text-[14px] leading-relaxed text-[var(--color-text-secondary)] pr-6 relative">
                    {f.body}
                  </p>
                </Link>
              </Up>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
