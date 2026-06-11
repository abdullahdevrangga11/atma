"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";

type Release = {
  title: string;
  body: string;
  date: string;
  accent: string;
};

const RELEASES: Release[] = [
  {
    title: "Day 1 shipped — vault deployed",
    body: "AtmaVault on Mantle Sepolia, ERC-4626, 8 states. 53 Foundry tests passing.",
    date: "Jun 11, 2026",
    accent: "linear-gradient(135deg, #0052ff, #00d4ff)",
  },
  {
    title: "Skills-First architecture",
    body: "Three markdown skill files inform Allocator, Risk, and Reporter agents at runtime. Policy as data.",
    date: "Jun 11, 2026",
    accent: "linear-gradient(135deg, #84cc16, #fbbf24)",
  },
  {
    title: "Inspired by CrossBeam",
    body: "Anthropic Claude Code Hackathon winner taught us: encode domain knowledge as Skills.",
    date: "Jun 10, 2026",
    accent: "linear-gradient(135deg, #a78bfa, #f9a8d4)",
  },
  {
    title: "Pattern-validated from Mizaan",
    body: "What we learned from the Superteam Indonesia hackathon. Won by Octora, Rule, SOLQ — production-grade infra.",
    date: "Jun 11, 2026",
    accent: "linear-gradient(135deg, #fbbf24, #f97316)",
  },
];

export function LatestReleases() {
  return (
    <section className="section bg-[var(--color-bg)]">
      <div className="container-atma">
        <div className="flex items-center justify-between mb-8">
          <ScrollReveal>
            <h2 className="display-3 font-medium">Latest from the build log.</h2>
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {RELEASES.map((r, i) => (
            <ScrollReveal key={r.title} delay={i * 60}>
              <article className="card-feature group !p-0 overflow-hidden h-full flex flex-col">
                <div
                  className="aspect-[4/3] relative overflow-hidden"
                  style={{ background: r.accent }}
                >
                  {/* abstract pixel pattern */}
                  <svg viewBox="0 0 120 90" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
                    {Array.from({ length: 18 }).map((_, k) => {
                      const x = (k * 7 + i * 3) % 110;
                      const y = (k * 4 + i * 2) % 80;
                      const h = 6 + ((k * 3) % 14);
                      return (
                        <rect
                          key={k}
                          x={x}
                          y={y}
                          width="3"
                          height={h}
                          fill="rgba(255,255,255,0.30)"
                        />
                      );
                    })}
                  </svg>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-[16px] font-medium text-[var(--color-text)] leading-snug mb-2">
                    {r.title}
                  </h3>
                  <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed mb-4 flex-1">
                    {r.body}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                    {r.date}
                  </p>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
