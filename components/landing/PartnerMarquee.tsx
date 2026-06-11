"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";

const ROWS: { name: string; role: string; group: string }[] = [
  { name: "Mantle", role: "host network · ERC-8004 registry", group: "Ecosystem" },
  { name: "Byreal", role: "Skills CLI · RealClaw", group: "Ecosystem" },
  { name: "Bybit", role: "CEX bridge · Mantle integration", group: "Ecosystem" },
  { name: "Tencent Cloud", role: "Hunyuan inference credits", group: "Infra" },
  { name: "Nansen", role: "wallet labels · smart-money tags", group: "Data" },
  { name: "Elfa AI", role: "sentiment · narrative feed", group: "Data" },
  { name: "Allora", role: "agent infra · judging", group: "Judges" },
  { name: "Animoca Brands", role: "consumer · judging", group: "Judges" },
  { name: "Virtuals Protocol", role: "agent economy · judging", group: "Judges" },
  { name: "Hashed · Caladan", role: "venture · judging", group: "Judges" },
  { name: "Mirana · Four Pillar", role: "alpha track · judging", group: "Judges" },
  { name: "DoraHacks", role: "platform · submission", group: "Org" },
];

export function PartnerMarquee() {
  return (
    <section className="relative py-24 md:py-32 border-y border-[var(--color-border)]">
      <div className="container-atma">
        <div className="grid lg:grid-cols-12 gap-12 mb-10">
          <div className="lg:col-span-4">
            <ScrollReveal>
              <p className="eyebrow eyebrow-dot mb-6">// manifest</p>
            </ScrollReveal>
            <ScrollReveal delay={80}>
              <h2 className="display-3 max-w-sm">
                12 ecosystem participants.
                <br />
                <span className="text-[var(--color-text-muted)]">One on-chain benchmark.</span>
              </h2>
            </ScrollReveal>
          </div>

          <div className="lg:col-span-8 lg:pt-3">
            <ScrollReveal delay={120}>
              <p className="text-[14px] text-[var(--color-text-secondary)] leading-relaxed">
                The Turing Test Hackathon is the first time an on-chain environment has
                been used to benchmark AI agent performance at scale. Every key decision
                is recorded permanently on Mantle. This is the panel ATMA is built for.
              </p>
            </ScrollReveal>
          </div>
        </div>

        <ScrollReveal delay={180}>
          <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
            {ROWS.map((row, i) => (
              <div
                key={row.name}
                className={`grid grid-cols-[80px_1.4fr_2fr_60px] items-center px-6 py-4 hover:bg-[var(--color-surface-hi)] transition-colors group ${
                  i < ROWS.length - 1
                    ? "border-b border-[var(--color-border)]"
                    : ""
                }`}
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-text-faint)] tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-mono text-[13px] text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors">
                  {row.name}
                </span>
                <span className="text-[12px] text-[var(--color-text-secondary)] font-mono lowercase">
                  {row.role}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-text-muted)] text-right">
                  {row.group}
                </span>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
