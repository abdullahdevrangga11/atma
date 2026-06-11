"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";

export function BlueCTA() {
  return (
    <section id="cta" className="relative overflow-hidden bg-[var(--color-primary)] text-white">
      <div className="container-atma relative z-10 py-16 md:py-24">
        <div className="grid lg:grid-cols-12 gap-12 items-end">
          <div className="lg:col-span-6">
            <ScrollReveal>
              <h2 className="display-2 max-w-[420px]">Start orchestrating treasury on Mantle.</h2>
            </ScrollReveal>
            <ScrollReveal delay={80}>
              <p className="mt-5 text-[15px] text-white/80 max-w-[420px]">
                Open-source MIT. Audit the markdown. Compose ATMA into your own treasury
                contract.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={160}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a href="/vault" className="btn-on-blue-primary">
                  <span className="block w-3.5 h-3.5 rounded-[2px] bg-[var(--color-primary)]" aria-hidden />
                  Launch on ATMA
                </a>
                <a
                  href="https://github.com/abdullahdevrangga11/atma"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-on-blue-outline"
                >
                  View on GitHub
                </a>
              </div>
            </ScrollReveal>
          </div>

          {/* Pixel-art bar chart on right */}
          <div className="lg:col-span-6">
            <svg viewBox="0 0 480 180" className="w-full h-auto" aria-hidden>
              {Array.from({ length: 60 }).map((_, i) => {
                const heights = [10, 22, 14, 30, 18, 26, 40, 24, 12, 36, 28, 42, 50, 34, 22, 38, 46, 30, 14, 28, 36, 44, 52, 40, 28, 18, 32, 46, 38, 24, 30, 42, 56, 48, 34, 22, 30, 44, 36, 22, 16, 28, 40, 32, 20, 26, 38, 50, 42, 30, 18, 24, 36, 28, 16, 22, 34, 26, 18, 12];
                const h = heights[i] ?? 20;
                const x = i * 8;
                const colors = ["rgba(255,255,255,0.35)", "rgba(255,255,255,0.55)", "#fbbf24", "#f9a8d4"];
                const fill = colors[i % colors.length];
                return (
                  <rect
                    key={i}
                    x={x}
                    y={150 - h}
                    width="4"
                    height={h}
                    fill={fill}
                  />
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
