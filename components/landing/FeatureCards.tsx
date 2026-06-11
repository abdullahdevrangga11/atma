"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Three-card pinned scroll-trigger sequence, ported from CodeGrid's
 * "RedoMedia split-card scroll animation" and re-skinned to ATMA's
 * agents.
 *
 * Phases mapped to ScrollTrigger progress:
 *   0.10 → 0.25  : sticky header fades + slides in, container shrinks
 *                  75% → 60%
 *   0.35 trigger : cards split — gap opens, each card gains full 20px
 *                  radius (was a single brick before)
 *   0.70 trigger : cards flip 180deg revealing the back face,
 *                  card 1 + card 3 tilt outward (rotZ ±15, y+30)
 *
 * Below 1000px the effect collapses to a normal stack — the GSAP
 * matchMedia branch wipes inline styles, the CSS @media kicks in.
 */

type Agent = {
  id: "card-1" | "card-2" | "card-3";
  number: string;
  name: string;
  short: string;
  body: string;
  href: string;
  accent: string; // hex
  fg: string; // text on accent
  Icon: () => React.ReactElement;
};

const AGENTS: Agent[] = [
  {
    id: "card-1",
    number: "( 01 )",
    name: "Allocator",
    short: "Treasury allocation under policy",
    body: "Reasons across USDY, mUSD, Aave V3 supply, and MI4 under your policy. Caps, risk tolerance, liquidity floors — enforced before any transaction.",
    href: "/agents/allocator",
    accent: "#5b3df0",
    fg: "#ffffff",
    Icon: AllocatorIcon,
  },
  {
    id: "card-2",
    number: "( 02 )",
    name: "Risk",
    short: "Veto authority + defensive exit",
    body: "Watches peg drift, oracle deviation, drawdown breach. Triggers defensive exit in under two minutes. Vetoes the allocator's proposal when needed.",
    href: "/agents/risk",
    accent: "#fbbf24",
    fg: "#0a0a0a",
    Icon: RiskIcon,
  },
  {
    id: "card-3",
    number: "( 03 )",
    name: "Reporter",
    short: "P&L attestation vs 3 baselines",
    body: "Weekly P&L versus do-nothing, USDC-Aave, and USDY-only baselines. Outperformance in bps. Every decision attested on ERC-8004.",
    href: "/agents/reporter",
    accent: "#84cc16",
    fg: "#0a0a0a",
    Icon: ReporterIcon,
  },
];

function AllocatorIcon() {
  return (
    <svg viewBox="0 0 60 60" fill="none" className="w-12 h-12">
      <rect x="6" y="10" width="48" height="40" rx="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="30" cy="30" r="8" stroke="currentColor" strokeWidth="2" />
      <circle cx="30" cy="30" r="2.5" fill="currentColor" />
    </svg>
  );
}
function RiskIcon() {
  return (
    <svg viewBox="0 0 60 60" fill="none" className="w-12 h-12">
      <path d="M30 4l24 10v18c0 14-10 24-24 28-14-4-24-14-24-28V14L30 4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M20 30l7 7 13-13" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ReporterIcon() {
  return (
    <svg viewBox="0 0 60 60" fill="none" className="w-12 h-12">
      <path d="M10 52V20M22 52V8M34 52v-22M46 52V32" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="6" y1="52" x2="54" y2="52" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ───────────────────────────────────────────────────────────
//  Component
// ───────────────────────────────────────────────────────────

export function FeatureCards() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLHeadingElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    let gapDone = false;
    let flipDone = false;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // Mobile fallback — wipe any inline styles GSAP left behind on resize
      mm.add("(max-width: 999px)", () => {
        [containerRef.current, headerRef.current, ...cardRefs.current].forEach((el) => {
          if (el) (el as HTMLElement).removeAttribute("style");
        });
        return {};
      });

      // Desktop pinned sequence
      mm.add("(min-width: 1000px)", () => {
        gapDone = false;
        flipDone = false;

        const trigger = sectionRef.current;
        if (!trigger) return;

        ScrollTrigger.create({
          trigger,
          start: "top top",
          end: () => `+=${window.innerHeight * 4}px`,
          scrub: 1,
          pin: true,
          pinSpacing: true,
          onUpdate: (self) => {
            const p = self.progress;
            const header = headerRef.current;
            const container = containerRef.current;
            if (!header || !container) return;

            // Header reveal — 0.10..0.25
            if (p >= 0.1 && p <= 0.25) {
              const k = gsap.utils.mapRange(0.1, 0.25, 0, 1, p);
              gsap.set(header, { y: gsap.utils.mapRange(0, 1, 40, 0, k), opacity: k });
            } else if (p < 0.1) {
              gsap.set(header, { y: 40, opacity: 0 });
            } else {
              gsap.set(header, { y: 0, opacity: 1 });
            }

            // Container width — 75% → 60% across 0..0.25
            if (p <= 0.25) {
              gsap.set(container, { width: `${gsap.utils.mapRange(0, 0.25, 75, 60, p)}%` });
            } else {
              gsap.set(container, { width: "60%" });
            }

            // Gap + radius split at 0.35
            if (p >= 0.35 && !gapDone) {
              gsap.to(container, { gap: "20px", duration: 0.5, ease: "power3.out" });
              gsap.to(cardRefs.current.filter(Boolean), {
                borderRadius: "20px",
                duration: 0.5,
                ease: "power3.out",
              });
              gapDone = true;
            } else if (p < 0.35 && gapDone) {
              gsap.to(container, { gap: "0px", duration: 0.5, ease: "power3.out" });
              gsap.to(cardRefs.current[0], { borderRadius: "20px 0 0 20px", duration: 0.5, ease: "power3.out" });
              gsap.to(cardRefs.current[1], { borderRadius: "0px",             duration: 0.5, ease: "power3.out" });
              gsap.to(cardRefs.current[2], { borderRadius: "0 20px 20px 0",   duration: 0.5, ease: "power3.out" });
              gapDone = false;
            }

            // Flip + tilt at 0.7
            if (p >= 0.7 && !flipDone) {
              gsap.to(cardRefs.current.filter(Boolean), {
                rotationY: 180,
                duration: 0.75,
                ease: "power3.inOut",
                stagger: 0.1,
              });
              gsap.to([cardRefs.current[0], cardRefs.current[2]].filter(Boolean), {
                y: 30,
                rotationZ: (i) => [-15, 15][i],
                duration: 0.75,
                ease: "power3.inOut",
              });
              flipDone = true;
            } else if (p < 0.7 && flipDone) {
              gsap.to(cardRefs.current.filter(Boolean), {
                rotationY: 0,
                duration: 0.75,
                ease: "power3.inOut",
                stagger: -0.1,
              });
              gsap.to([cardRefs.current[0], cardRefs.current[2]].filter(Boolean), {
                y: 0,
                rotationZ: 0,
                duration: 0.75,
                ease: "power3.inOut",
              });
              flipDone = false;
            }
          },
        });
        return () => {};
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="split-card-section relative w-full bg-[var(--color-bg)] overflow-hidden flex items-center justify-center"
      style={{ minHeight: "100svh" }}
    >
      <div
        ref={headerRef}
        className="split-card-header absolute top-[18%] left-1/2 -translate-x-1/2 text-center pointer-events-none px-6"
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-3">
          // three agents · one verifiable policy
        </p>
        <h2 className="display-2 max-w-[760px] mx-auto leading-[1.05]">
          Three pillars with one purpose.
        </h2>
      </div>

      <div
        ref={containerRef}
        className="split-card-container relative flex justify-center"
        style={{
          width: "75%",
          perspective: "1000px",
          gap: 0,
          transform: "translateY(40px)",
        }}
      >
        {AGENTS.map((a, i) => (
          <div
            key={a.id}
            id={a.id}
            ref={(el) => { cardRefs.current[i] = el; }}
            className="split-card relative flex-1"
            style={{
              aspectRatio: "5 / 7",
              transformStyle: "preserve-3d",
              transformOrigin: "top",
              borderRadius:
                i === 0 ? "20px 0 0 20px" : i === 2 ? "0 20px 20px 0" : "0px",
            }}
          >
            <CardFront agent={a} />
            <CardBack agent={a} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ───────────────────────────────────────────────────────────
//  Faces
// ───────────────────────────────────────────────────────────

function CardFront({ agent }: { agent: Agent }) {
  return (
    <div
      className="split-card-face absolute inset-0 overflow-hidden flex flex-col"
      style={{
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        borderRadius: "inherit",
        background: "#fafafa",
        border: "1px solid #e8e8e8",
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 px-7 pt-7 flex items-center justify-between"
        style={{ color: agent.accent }}
      >
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] opacity-90">
          {agent.number}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
          agent
        </span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <span style={{ color: agent.accent }} className="mb-7">
          <agent.Icon />
        </span>
        <h3
          className="font-semibold mb-3 leading-none"
          style={{ fontSize: "clamp(28px, 3.8vw, 56px)", color: "#0a0a0a" }}
        >
          {agent.name}
        </h3>
        <p
          className="font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] max-w-[280px]"
        >
          {agent.short}
        </p>
      </div>
      <div className="px-7 pb-7 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
        <span>ATMA</span>
        <span>read more →</span>
      </div>
    </div>
  );
}

function CardBack({ agent }: { agent: Agent }) {
  return (
    <Link
      href={agent.href}
      className="split-card-face absolute inset-0 overflow-hidden flex flex-col p-8 text-left"
      style={{
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: "rotateY(180deg)",
        borderRadius: "inherit",
        background: agent.accent,
        color: agent.fg,
        textDecoration: "none",
      }}
    >
      <div className="flex items-center justify-between" style={{ opacity: 0.6 }}>
        <span className="font-mono text-[11px] uppercase tracking-[0.08em]">{agent.number}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.08em]">{agent.name}</span>
      </div>
      <div className="flex-1 flex flex-col justify-end">
        <p
          className="font-medium mb-6"
          style={{ fontSize: "clamp(20px, 2.2vw, 28px)", lineHeight: 1.15 }}
        >
          {agent.body}
        </p>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] underline underline-offset-4">
          Inspect agent
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
