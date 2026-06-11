"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";

export function DecisionTrace() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="container-atma">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5 lg:sticky lg:top-32 self-start">
            <ScrollReveal>
              <p className="eyebrow eyebrow-dot mb-6">// decision trace</p>
            </ScrollReveal>
            <ScrollReveal delay={80}>
              <h2 className="display-2 max-w-md">
                Every weight,
                <br />
                <span className="text-[var(--color-text-muted)]">every reason,</span>
                <br />
                attested.
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={160}>
              <p className="mt-6 text-[14px] leading-relaxed text-[var(--color-text-secondary)] max-w-sm">
                An allocation proposal includes the agent's full reasoning. The hash of
                that reasoning is stored on-chain via ERC-8004 ReputationRegistry; the
                full JSON lives on Supabase for audit.
              </p>
            </ScrollReveal>
          </div>

          <div className="lg:col-span-7">
            <ScrollReveal delay={120}>
              <div className="code-block">
                <div className="code-block-header">
                  <span>allocator.propose() · sample output</span>
                  <span className="text-[var(--color-text-faint)]">json</span>
                </div>
                <pre className="!p-6 md:!p-8 text-[12px] leading-[1.7] whitespace-pre">
                  {`{
  `}<span className="tk-key">"weights"</span>{`: {
    `}<span className="tk-key">"usdyBps"</span>{`: `}<span className="tk-num">3408</span>{`,  `}<span className="tk-com">// 34.08% · Ondo treasuries</span>{`
    `}<span className="tk-key">"mUsdBps"</span>{`: `}<span className="tk-num">3000</span>{`,  `}<span className="tk-com">// 30.00% · rebasing wrapper</span>{`
    `}<span className="tk-key">"aaveBps"</span>{`: `}<span className="tk-num">3592</span>{`,  `}<span className="tk-com">// 35.92% · V3 supply boosted</span>{`
    `}<span className="tk-key">"mi4Bps"</span>{`:  `}<span className="tk-num">0</span>{`     `}<span className="tk-com">// excluded · balanced tolerance</span>{`
  },
  `}<span className="tk-key">"expectedAPY"</span>{`: `}<span className="tk-num">463</span>{`,            `}<span className="tk-com">// basis points</span>{`
  `}<span className="tk-key">"riskScore"</span>{`: `}<span className="tk-num">1</span>{`,
  `}<span className="tk-key">"reasoning"</span>{`: `}<span className="tk-str">"Balanced tolerance excludes MI4. Aave's 25bp
    risk discount still leaves highest yield; capped to
    mUSD at 30% by policy. USDY + mUSD provide 64%
    liquid buffer above 50% minimum."</span>{`,
  `}<span className="tk-key">"reasoningHash"</span>{`: `}<span className="tk-str">"0x7c4a...e8b9"</span>{`,
  `}<span className="tk-key">"signedBy"</span>{`: `}<span className="tk-str">"AllocatorAgent#1"</span>{`,
  `}<span className="tk-key">"attestationTx"</span>{`: `}<span className="tk-str">"0x4f8a...b9c2"</span>{`,
  `}<span className="tk-key">"timestamp"</span>{`: `}<span className="tk-num">{Math.floor(Date.now() / 1000)}</span>{`
}`}
                </pre>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="border border-[var(--color-border)] rounded-md px-4 py-3 flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] pulse-soft" />
                  <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--color-text-secondary)]">
                    on-chain hash · queryable
                  </span>
                </div>
                <div className="border border-[var(--color-border)] rounded-md px-4 py-3 flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)]" />
                  <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--color-text-secondary)]">
                    full json · supabase storage
                  </span>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
