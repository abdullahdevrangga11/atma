"use client";

import Link from "next/link";
import { Reveal, Up, WordMask, ScaleIn } from "@/components/animations/Reveal";
import {
  VaultStateDiagram,
  AgentSwarmDiagram,
  AttestationDiagram,
  PolicyAsDataDiagram,
} from "@/components/landing/PixelDiagrams";
import { cn } from "@/lib/utils/cn";

/**
 * Bento grid showcase — varied col-spans + row-spans give the four
 * diagram cards a magazine rhythm instead of the previous 2×2 grid.
 *
 * Layout on md+:
 *   Row 1:  [Allocation: cols 1-7] [Skills: cols 8-12, spans 2 rows]
 *   Row 2:  [Policy:     cols 1-7] [Skills continues               ]
 *   Row 3:  [Attestation full width 1-12                            ]
 *
 * Falls back to single-column stack on mobile.
 */

type BentoTile = {
  diagram: React.ReactNode;
  title: string;
  body: string;
  /** Tailwind className driving the grid placement on md+ */
  span: string;
  delay: number;
};

export function ProductSection() {
  const tiles: BentoTile[] = [
    {
      diagram: <VaultStateDiagram />,
      title: "Allocation as a primitive.",
      body: "One vault contract. Four Mantle RWA assets. Eight states enforced at the contract level. Every transition gas-cheap and queryable on Mantle Explorer.",
      span: "md:col-span-7",
      delay: 120,
    },
    {
      diagram: <AgentSwarmDiagram />,
      title: "Skills-first reasoning.",
      body: "Three specialized agents — Allocator, Risk, Reporter — each loads its markdown skill at runtime. Policy update = file commit. No redeploy. No hardcoded scripts dressed as agents.",
      // Tall tile on the right, spans both upper rows
      span: "md:col-span-5 md:row-span-2",
      delay: 240,
    },
    {
      diagram: <PolicyAsDataDiagram />,
      title: "Policy as data, not code.",
      body: "Inspired by CrossBeam — first prize in Anthropic's Claude Code Hackathon. Skills live as markdown reference files. Auditable. Updatable. Composable by downstream dApps.",
      span: "md:col-span-7",
      delay: 360,
    },
    {
      diagram: <AttestationDiagram />,
      title: "Every decision attested.",
      body: "ERC-8004 reputation events emit per allocation, rebalance, and defensive exit. Judges, regulators, and downstream protocols can query the full trace without permission.",
      // Spans both columns and one row of the auto-grid. The diagram itself
      // is horizontal — 5 tx cards in a single row across the full width.
      span: "md:col-span-12 md:min-h-[440px]",
      delay: 480,
    },
  ];

  return (
    <section className="section bg-[var(--color-bg)]">
      <div className="container-amana">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-10 mb-20">
            <h2 className="display-2 max-w-[680px]">
              <span className="font-semibold">
                <WordMask text="AMANA" staggerMs={70} />
              </span>{" "}
              <span className="text-[var(--color-text-secondary)] font-normal">
                <WordMask text="is the protocol for treasury at scale." staggerMs={60} baseDelayMs={120} />
              </span>
            </h2>
            <Up delay={600}>
              <Link href="#cta" className="btn-outline whitespace-nowrap">
                Explore Architecture
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 5h8M5 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </Up>
          </div>
        </Reveal>

        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-12 md:auto-rows-[minmax(340px,auto)] gap-5">
            {tiles.map((t) => (
              <ScaleIn key={t.title} delay={t.delay} className={cn(t.span)}>
                <BentoCard tile={t} />
              </ScaleIn>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function BentoCard({ tile }: { tile: BentoTile }) {
  return (
    <div className="card-diagram !p-7 md:!p-9 h-full flex flex-col">
      <div className="flex-1 min-h-0 rounded-2xl overflow-hidden bg-[var(--color-bg-card-soft)] mb-6 flex items-center justify-center">
        {tile.diagram}
      </div>
      <h3 className="text-[20px] md:text-[22px] font-medium mb-2 tracking-[-0.01em]">{tile.title}</h3>
      <p className="text-[14px] md:text-[15px] text-[var(--color-text-secondary)] leading-relaxed">
        {tile.body}
      </p>
    </div>
  );
}
