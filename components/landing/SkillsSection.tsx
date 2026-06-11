"use client";

import { useState } from "react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";

type SkillTab = {
  id: string;
  filename: string;
  agent: string;
  body: React.ReactNode;
};

const TABS: SkillTab[] = [
  {
    id: "allocation",
    filename: "skills/mantle-rwa-allocation.skill.md",
    agent: "AllocatorAgent",
    body: (
      <>
        <span className="tk-com"># Skill: Mantle RWA Allocation</span>{"\n"}
        {"\n"}
        <span className="tk-com">## Decision Tree</span>{"\n"}
        {"\n"}
        <span className="tk-com">### Step 1: Apply hard policy constraints</span>{"\n"}
        {"\n"}
        <span className="tk-key">if</span> any asset's "max" bp = 0,{" "}
        <span className="tk-fn">exclude</span> from candidates.{"\n"}
        <span className="tk-key">if</span> any asset's risk signal ={" "}
        <span className="tk-str">"warn"</span>,{" "}
        <span className="tk-fn">reduce</span> allowed cap by{" "}
        <span className="tk-num">50%</span>.{"\n"}
        <span className="tk-key">if</span> any asset's risk signal ={" "}
        <span className="tk-str">"trigger"</span>,{" "}
        <span className="tk-fn">exclude</span> entirely.{"\n"}
        {"\n"}
        <span className="tk-com">### Step 3: Optimize for risk-adjusted yield</span>{"\n"}
        {"\n"}
        <span className="tk-typ">adjustedAPY</span> = liveAPY -{" "}
        <span className="tk-fn">riskPenalty</span>(asset){"\n"}
        {"  "}<span className="tk-key">where</span> riskPenalty:{"\n"}
        {"    "}USDY:{"   "}
        <span className="tk-num">5</span> bps{"  "}
        <span className="tk-com">// treasury-backed</span>{"\n"}
        {"    "}mUSD:{"   "}
        <span className="tk-num">8</span> bps{"  "}
        <span className="tk-com">// wrapper risk</span>{"\n"}
        {"    "}Aave:{"   "}
        <span className="tk-num">25</span> bps{" "}
        <span className="tk-com">// contract + oracle</span>{"\n"}
        {"    "}MI4:{"    "}
        <span className="tk-num">75</span> bps{" "}
        <span className="tk-com">// price + index manager</span>{"\n"}
      </>
    ),
  },
  {
    id: "risk",
    filename: "skills/mantle-risk-monitoring.skill.md",
    agent: "RiskAgent",
    body: (
      <>
        <span className="tk-com"># Skill: Mantle Risk Monitoring</span>{"\n"}
        {"\n"}
        <span className="tk-com">## USDY Peg Signal</span>{"\n"}
        {"\n"}
        <span className="tk-typ">deviation</span> ={" "}
        <span className="tk-fn">abs</span>(usdyPrice - 1.0){"\n"}
        <span className="tk-key">if</span> deviation &gt;{" "}
        <span className="tk-num">0.02</span>:{"  "}
        <span className="tk-key">return</span>{" "}
        <span className="tk-str">"trigger"</span>{" "}
        <span className="tk-com">// &gt; 2%</span>{"\n"}
        <span className="tk-key">if</span> deviation &gt;{" "}
        <span className="tk-num">0.005</span>:{" "}
        <span className="tk-key">return</span>{" "}
        <span className="tk-str">"warn"</span>{"    "}
        <span className="tk-com">// &gt; 0.5%</span>{"\n"}
        <span className="tk-key">return</span>{" "}
        <span className="tk-str">"ok"</span>{"\n"}
        {"\n"}
        <span className="tk-com">
          {"## Real-world precedent\n"}
          {"# March 10, 2026: Aave V3 Mantle wstETH oracle glitch\n"}
          {"# → $27M unfair liquidations.\n"}
          {"# ATMA would have triggered defensive exit at 2min sustained."}
        </span>
      </>
    ),
  },
  {
    id: "reporter",
    filename: "skills/treasury-reporting.skill.md",
    agent: "ReporterAgent",
    body: (
      <>
        <span className="tk-com"># Skill: Treasury Reporting</span>{"\n"}
        {"\n"}
        <span className="tk-com">## Baselines</span>{"\n"}
        {"\n"}
        <span className="tk-fn">doNothingPnL</span>{"   "}={" "}
        <span className="tk-num">0</span>{" "}
        <span className="tk-com">// idle USDC = 0% APY</span>{"\n"}
        <span className="tk-fn">usdcAaveOnly</span>{"    "}={" "}
        <span className="tk-fn">simulate</span>(deposit, avgAaveSupplyAPY){"\n"}
        <span className="tk-fn">usdyOnly</span>{"        "}={" "}
        <span className="tk-fn">simulate</span>(deposit, usdyExchangeRate){"\n"}
        {"\n"}
        <span className="tk-typ">outperformanceBps</span> = (actualAPY -
        baseline) ×{" "}
        <span className="tk-num">10000</span>{"\n"}
        {"\n"}
        <span className="tk-com">## CSV schema (compliance export)</span>{"\n"}
        {"\n"}
        timestamp, event_type, asset, amount_usdc,{"\n"}
        amount_underlying, tx_hash,{" "}
        <span className="tk-key">agent_id</span>,{"\n"}
        reasoning_hash, nav_before, nav_after{"\n"}
      </>
    ),
  },
];

export function SkillsSection() {
  const [active, setActive] = useState<string>(TABS[0].id);
  const tab = TABS.find((t) => t.id === active) ?? TABS[0];

  return (
    <section className="relative py-24 md:py-32 border-y border-[var(--color-border)] hatch">
      <div className="container-atma">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-4">
            <ScrollReveal>
              <p className="eyebrow eyebrow-dot mb-6">// skills-first</p>
            </ScrollReveal>
            <ScrollReveal delay={80}>
              <h2 className="display-2">
                Agents read
                <br />
                <span className="text-[var(--color-text-muted)]">markdown,</span>
                <br />
                not hardcoded rules.
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={160}>
              <p className="mt-6 text-[14px] leading-relaxed text-[var(--color-text-secondary)] max-w-sm">
                Inspired by{" "}
                <a
                  href="https://claude.com/blog/meet-the-winners-of-our-built-with-opus-4-6-claude-code-hackathon"
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-[var(--color-text-muted)] hover:decoration-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
                >
                  CrossBeam
                </a>{" "}
                — first prize in Anthropic's Claude Code Hackathon. Each agent loads its
                Skill markdown at runtime. Policy update = file commit. No redeploy.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={240}>
              <ul className="mt-8 space-y-2">
                {TABS.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setActive(t.id)}
                      data-cursor-hover
                      className={`group w-full text-left flex items-center justify-between gap-3 py-2.5 border-b border-[var(--color-border)] transition-colors ${
                        active === t.id
                          ? "border-[var(--color-accent)]"
                          : "hover:border-[var(--color-border-strong)]"
                      }`}
                    >
                      <div>
                        <p
                          className={`font-mono text-[13px] ${
                            active === t.id
                              ? "text-[var(--color-accent)]"
                              : "text-[var(--color-text)]"
                          }`}
                        >
                          {t.agent}
                        </p>
                        <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-text-muted)] mt-1">
                          {t.filename}
                        </p>
                      </div>
                      <span
                        className={`font-mono text-[16px] ${
                          active === t.id
                            ? "text-[var(--color-accent)]"
                            : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]"
                        }`}
                      >
                        →
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollReveal>
          </div>

          <div className="lg:col-span-8">
            <ScrollReveal delay={120}>
              <div className="code-block">
                <div className="code-block-header">
                  <span>{tab.filename}</span>
                  <span className="text-[var(--color-text-faint)]">
                    read at runtime · injected into LLM context
                  </span>
                </div>
                <pre className="!p-6 md:!p-8 text-[12.5px] leading-[1.7]">
                  {tab.body}
                </pre>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
