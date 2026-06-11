"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";
import Link from "next/link";

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
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
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
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
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
        <path d="M3 19V9m5 10V3m5 16v-7m5 7V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function FeatureCards() {
  return (
    <section className="section bg-[var(--color-bg)]">
      <div className="container-atma">
        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 80}>
              <Link href={f.href} className="card-feature block h-full group">
                <span className="arrow-indicator">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M5 11L11 5M11 5H6M11 5V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <div className="text-[var(--color-text)] mb-6">{f.icon}</div>
                <h3 className="text-[18px] font-medium text-[var(--color-text)] mb-2">
                  {f.title}
                </h3>
                <p className="text-[14px] leading-relaxed text-[var(--color-text-secondary)] pr-6">
                  {f.body}
                </p>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
