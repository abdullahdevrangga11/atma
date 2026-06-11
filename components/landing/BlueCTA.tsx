"use client";

import { Reveal, Up, WordMask } from "@/components/animations/Reveal";

export function BlueCTA() {
  return (
    <section id="cta" className="relative overflow-hidden bg-[var(--color-primary)] text-white">
      <div className="container-atma relative z-10 py-24 md:py-36">
        <Reveal>
          <div className="grid lg:grid-cols-12 gap-16 lg:items-center">
            <div className="lg:col-span-6">
              <h2 className="display-2 max-w-[480px]">
                <WordMask text="Start orchestrating treasury on Mantle." staggerMs={70} />
              </h2>
              <Up delay={650} className="mt-7 max-w-[440px]">
                <p className="text-[16px] text-white/80 leading-relaxed">
                  Open-source MIT. Audit the markdown. Compose ATMA into your own treasury
                  contract.
                </p>
              </Up>
              <Up delay={800}>
                <div className="mt-10 flex flex-wrap items-center gap-3">
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
              </Up>
            </div>

            <Up delay={400} className="lg:col-span-6">
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
            </Up>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
