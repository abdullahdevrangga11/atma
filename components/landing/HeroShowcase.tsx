"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Badge } from "@/components/ui/badge";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// ─────────────────────────────────────────────────────────
//  Static demo data
// ─────────────────────────────────────────────────────────

const NAV = 10046.3;
const PNL = 46.3;
const APY = 4.63;
const BPS = 463;
const ATT = 12;
const RISK = 1;

const ALLOCATIONS = [
  { name: "USDY", bps: 3408, color: "#a78bfa" },
  { name: "mUSD", bps: 3000, color: "#84cc16" },
  { name: "Aave", bps: 3592, color: "#fbbf24" },
  { name: "MI4",  bps: 0,    color: "#f9a8d4", muted: true },
] as const;

const TX_HASHES = ["0x4f8a…b9c2", "0x9c3d…e7a1", "0x2b1e…c5f4", "0xa7c4…d8b3"];
const SIGNERS = ["Allocator#1", "Risk#2", "Reporter#3"];

// ─────────────────────────────────────────────────────────
//  HeroShowcase — single GSAP timeline drives everything
// ─────────────────────────────────────────────────────────

export function HeroShowcase() {
  // Root and card refs
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Animated text targets — written directly by GSAP onUpdate
  const navEl = useRef<HTMLParagraphElement>(null);
  const apyEl = useRef<HTMLSpanElement>(null);
  const bpsEl = useRef<HTMLSpanElement>(null);
  const attEl = useRef<HTMLSpanElement>(null);
  const pnlChip = useRef<HTMLDivElement>(null);
  const pnlValue = useRef<HTMLSpanElement>(null);
  const stateBadge = useRef<HTMLSpanElement>(null);

  // Allocation bars and their inline labels
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const shimmerRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Live clock (interval-driven, no GSAP needed)
  const [clock, setClock] = useState("--:--:--Z");
  useEffect(() => {
    const fmt = () => {
      const d = new Date();
      const hh = String(d.getUTCHours()).padStart(2, "0");
      const mm = String(d.getUTCMinutes()).padStart(2, "0");
      const ss = String(d.getUTCSeconds()).padStart(2, "0");
      return `${hh}:${mm}:${ss}Z`;
    };
    setClock(fmt());
    const id = window.setInterval(() => setClock(fmt()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Cycling chip values (separate cadence) — GSAP plays the slide-in keyframe
  // on each value change via a key-driven refs pattern below.
  const [txIdx, setTxIdx] = useState(0);
  const [signerIdx, setSignerIdx] = useState(0);
  const txEl = useRef<HTMLParagraphElement>(null);
  const signerEl = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTxIdx((i) => (i + 1) % TX_HASHES.length);
      setSignerIdx((i) => (i + 1) % SIGNERS.length);
    }, 3600);
    return () => window.clearInterval(id);
  }, []);

  // Play the slide-in animation whenever the index changes (including initial mount)
  useEffect(() => {
    if (!txEl.current) return;
    gsap.fromTo(
      txEl.current,
      { y: 6, filter: "blur(3px)", opacity: 0 },
      { y: 0, filter: "blur(0px)", opacity: 1, duration: 0.36, ease: "expo.out" },
    );
  }, [txIdx]);
  useEffect(() => {
    if (!signerEl.current) return;
    gsap.fromTo(
      signerEl.current,
      { y: 6, filter: "blur(3px)", opacity: 0 },
      { y: 0, filter: "blur(0px)", opacity: 1, duration: 0.36, ease: "expo.out" },
    );
  }, [signerIdx]);

  // Master entrance timeline — fires once when the card enters viewport
  useEffect(() => {
    if (!rootRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top 82%",
          once: true,
        },
        defaults: { ease: "expo.out" },
      });

      // 1. Card lifts in — soft scale + shadow grow
      tl.fromTo(
        cardRef.current,
        {
          y: 8,
          scale: 0.985,
          opacity: 0,
          boxShadow: "0 2px 12px -4px rgba(0,0,0,0.04)",
        },
        {
          y: 0,
          scale: 1,
          opacity: 1,
          boxShadow: "0 30px 80px -28px rgba(0,0,0,0.18)",
          duration: 0.95,
        },
        0,
      );

      // 2. NAV counts up from 0
      const navState = { n: 0 };
      tl.to(navState, {
        n: NAV,
        duration: 1.6,
        onUpdate: () => {
          if (navEl.current) navEl.current.textContent = formatUSD(navState.n);
        },
      }, 0.1);

      // 3. State badge lands
      tl.fromTo(
        stateBadge.current,
        { y: -4, scale: 0.94, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, duration: 0.7 },
        0.35,
      );

      // 4. PnL chip slides up + counts the +46.30
      const pnlState = { n: 0 };
      tl.fromTo(
        pnlChip.current,
        { y: 6, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7 },
        0.48,
      ).to(
        pnlState,
        {
          n: PNL,
          duration: 1.1,
          onUpdate: () => {
            if (pnlValue.current) pnlValue.current.textContent = `+${pnlState.n.toFixed(2)}`;
          },
        },
        0.48,
      );

      // 5. Secondary metrics — APY, +bps (with overshoot back ease for accent),
      //    risk score is static, attestations rolls.
      const apyState = { n: 0 };
      tl.to(apyState, {
        n: APY,
        duration: 1.1,
        onUpdate: () => {
          if (apyEl.current) apyEl.current.textContent = `${apyState.n.toFixed(2)}%`;
        },
      }, 0.62);

      const bpsState = { n: 0 };
      tl.to(bpsState, {
        n: BPS,
        duration: 1.4,
        ease: "back.out(1.3)",
        onUpdate: () => {
          if (bpsEl.current) bpsEl.current.textContent = `+${Math.round(bpsState.n)}`;
        },
      }, 0.76);

      const attState = { n: 0 };
      tl.to(attState, {
        n: ATT,
        duration: 0.9,
        onUpdate: () => {
          if (attEl.current) attEl.current.textContent = String(Math.round(attState.n));
        },
      }, 0.92);

      // 6. Allocation bars — width + label count + shimmer wipe, staggered
      ALLOCATIONS.forEach((a, i) => {
        const bar = barRefs.current[i];
        const lbl = labelRefs.current[i];
        const shimmer = shimmerRefs.current[i];
        if (!bar) return;
        const at = 0.95 + i * 0.13;
        const pct = a.bps / 100;
        const muted = "muted" in a && a.muted;

        const state = { bps: 0 };
        tl.to(state, {
          bps: a.bps,
          duration: 1.5,
          onUpdate: () => {
            const p = state.bps / 100;
            bar.style.width = `${p}%`;
            if (lbl) {
              lbl.firstChild!.textContent = `${p.toFixed(2)}% `;
              (lbl.lastChild as HTMLElement).textContent = `/ ${Math.round(state.bps)} bps`;
            }
          },
        }, at);

        if (shimmer && !muted) {
          tl.fromTo(
            shimmer,
            { xPercent: -120, opacity: 0 },
            { xPercent: 220, opacity: 0.85, duration: 1.4, ease: "expo.out" },
            at + 0.15,
          );
        }
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="relative mx-auto max-w-[920px]">
      <div
        ref={cardRef}
        className="relative w-full rounded-[20px] border border-[var(--color-border)] bg-[var(--color-bg-card-soft)] overflow-hidden"
        style={{ willChange: "transform, opacity, box-shadow" }}
      >
        {/* Card header strip */}
        <div className="flex items-center justify-between px-7 py-4 border-b border-[var(--color-border)] bg-white/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="block w-2 h-2 rounded-full bg-[var(--color-success)] pulse-soft" />
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
              AmanaVault.sol · Live on Mantle Sepolia
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default">// vault state</Badge>
            <span ref={stateBadge} style={{ opacity: 0, display: "inline-block" }}>
              <Badge variant="accent">allocated</Badge>
            </span>
          </div>
        </div>

        {/* Card body */}
        <div className="grid md:grid-cols-12 gap-0">
          {/* Left: NAV + metrics */}
          <div className="md:col-span-5 p-7 md:p-8 border-b md:border-b-0 md:border-r border-[var(--color-border)] bg-white">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-3">
              NAV
            </p>
            <p
              ref={navEl}
              className="text-[44px] md:text-[48px] leading-none font-medium tabular-nums"
            >
              $0.00
            </p>

            {/* PnL chip — slides in once active */}
            <div
              ref={pnlChip}
              className="mt-4 flex items-center gap-2 text-[12px]"
              style={{ opacity: 0 }}
            >
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-mono tabular-nums">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 8V2M2 5l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span ref={pnlValue}>+0.00</span>
              </span>
              <span className="text-[var(--color-text-muted)]">vs entry</span>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-5">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-1">
                  APY
                </p>
                <p className="text-[18px] font-medium tabular-nums text-[var(--color-text)]">
                  <span ref={apyEl}>0.00%</span>
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-1">
                  vs do-nothing
                </p>
                <p className="text-[18px] font-medium tabular-nums text-[var(--color-primary)] glow-pulse">
                  <span ref={bpsEl}>+0</span> bps
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-1">
                  risk score
                </p>
                <p className="text-[18px] font-medium tabular-nums text-[var(--color-text)]">
                  {RISK} <span className="text-[12px] text-[var(--color-text-muted)]">/10</span>
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-1">
                  attestations
                </p>
                <p className="text-[18px] font-medium tabular-nums text-[var(--color-text)]">
                  <span ref={attEl}>0</span>
                </p>
              </div>
            </div>
          </div>

          {/* Right: Allocation bars */}
          <div className="md:col-span-7 p-7 md:p-8 bg-[var(--color-bg-card-soft)]">
            <div className="flex items-center justify-between mb-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                Current Allocation
              </p>
              <p className="font-mono text-[10px] tracking-[0.04em] text-[var(--color-text-muted)]">
                4 assets · 10,000 bps
              </p>
            </div>

            <div className="space-y-3.5">
              {ALLOCATIONS.map((a, i) => {
                const muted = "muted" in a && a.muted;
                return (
                  <div key={a.name} className={muted ? "opacity-50" : ""}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="block w-2 h-2 rounded-[1px]" style={{ background: a.color }} />
                        <span className="text-[13px] font-medium text-[var(--color-text)]">{a.name}</span>
                      </div>
                      <span
                        ref={(el) => { labelRefs.current[i] = el; }}
                        className="font-mono text-[12px] text-[var(--color-text-secondary)] tabular-nums"
                      >
                        <span>0.00% </span>
                        <span className="text-[var(--color-text-muted)]">/ 0 bps</span>
                      </span>
                    </div>
                    <div className="relative h-2 rounded-full bg-white border border-[var(--color-border)] overflow-hidden">
                      <div
                        ref={(el) => { barRefs.current[i] = el; }}
                        className="h-full rounded-full"
                        style={{ width: "0%", background: a.color }}
                      />
                      {!muted && (
                        <span
                          ref={(el) => { shimmerRefs.current[i] = el; }}
                          aria-hidden
                          className="absolute inset-0 block pointer-events-none"
                          style={{
                            background:
                              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)",
                            transform: "translateX(-120%)",
                            opacity: 0,
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-5 border-t border-[var(--color-border)] grid grid-cols-3 gap-3">
              <div className="rounded-md px-3 py-2 bg-white border border-[var(--color-border)] overflow-hidden">
                <p className="font-mono text-[9px] uppercase tracking-[0.06em] text-[var(--color-text-muted)] mb-0.5">
                  // last tx
                </p>
                <p ref={txEl} className="font-mono text-[11px] text-[var(--color-text)] truncate tabular-nums">
                  {TX_HASHES[txIdx]}
                </p>
              </div>
              <div className="rounded-md px-3 py-2 bg-white border border-[var(--color-border)] overflow-hidden">
                <p className="font-mono text-[9px] uppercase tracking-[0.06em] text-[var(--color-text-muted)] mb-0.5">
                  // signed by
                </p>
                <p ref={signerEl} className="font-mono text-[11px] text-[var(--color-text)] truncate tabular-nums">
                  {SIGNERS[signerIdx]}
                </p>
              </div>
              <div className="rounded-md px-3 py-2 bg-white border border-[var(--color-border)] overflow-hidden">
                <p className="font-mono text-[9px] uppercase tracking-[0.06em] text-[var(--color-text-muted)] mb-0.5">
                  // at
                </p>
                <p className="font-mono text-[11px] text-[var(--color-text)] truncate tabular-nums">
                  {clock}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatUSD(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
