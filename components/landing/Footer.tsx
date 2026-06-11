"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";

export function Footer() {
  return (
    <footer className="relative pt-24 md:pt-32 pb-12 overflow-hidden">
      <div className="container-atma">
        <ScrollReveal>
          <div className="border border-[var(--color-border)] rounded-2xl p-8 md:p-12 mb-16">
            <div className="grid lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7">
                <p className="eyebrow eyebrow-dot mb-6">// cta</p>
                <h2 className="display-2 max-w-xl mb-6">
                  Try ATMA on Mantle Sepolia.
                  <br />
                  <span className="text-[var(--color-text-muted)]">
                    Open-source. MIT. Audit the markdown.
                  </span>
                </h2>
                <p className="text-[14px] text-[var(--color-text-secondary)] max-w-lg leading-relaxed">
                  DAO treasurer? Crypto-native SMB founder? Startup runway manager?
                  ATMA was built for you. Deposit, watch the agents reason, audit
                  every decision.
                </p>
              </div>
              <div className="lg:col-span-5 flex flex-col items-start lg:items-end justify-center gap-4">
                <a href="/vault" className="btn-solid">
                  Launch vault
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M1 5h8M5 1l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
                <a
                  href="https://github.com/abdullahdevrangga11/atma"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-link"
                >
                  Star on GitHub
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M3 1h6v6M9 1L1 9"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Terminal-style meta footer */}
        <div className="border-t border-[var(--color-border)] pt-8">
          <div className="grid md:grid-cols-12 gap-6">
            <div className="md:col-span-4 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--color-text-muted)] space-y-1">
              <p>
                <span className="text-[var(--color-text-secondary)]">$</span>{" "}
                builder
              </p>
              <p className="text-[var(--color-text)] normal-case tracking-normal text-[13px]">
                Devrangga Hazza Mahiswara
              </p>
              <p>UGM Software Engineering · '23 · Yogyakarta 🇮🇩</p>
            </div>

            <div className="md:col-span-4 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--color-text-muted)] space-y-1">
              <p>
                <span className="text-[var(--color-text-secondary)]">$</span>{" "}
                hackathon
              </p>
              <p className="text-[var(--color-text)] normal-case tracking-normal text-[13px]">
                Mantle Turing Test 2026
              </p>
              <p>AI × RWA Track · Phase 2 AI Awakening</p>
            </div>

            <div className="md:col-span-4 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--color-text-muted)] space-y-1">
              <p>
                <span className="text-[var(--color-text-secondary)]">$</span>{" "}
                source
              </p>
              <p className="text-[var(--color-text)] normal-case tracking-normal text-[13px]">
                github.com/abdullahdevrangga11/atma
              </p>
              <p>MIT · open-source · audit the markdown</p>
            </div>
          </div>

          <div className="mt-12 flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-faint)]">
            <p>© 2026 atma.protocol — built in 3 days, with intent</p>
            <p>mantle sepolia · 5003 · v0.1.0 · built at 13:04 +07</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
