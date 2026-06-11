"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

// ─────────────────────────────────────────────────────────
//  Animation primitives — local to this showcase
// ─────────────────────────────────────────────────────────

function useViewportTrigger<T extends HTMLElement>(threshold: number = 0.4) {
  const ref = useRef<T | null>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, active };
}

/**
 * Smoothly counts up to `target` using ease-out-expo. Single source of truth
 * for animated numeric values — no CSS transition should chase the same
 * property concurrently (e.g. AllocBar's width is driven directly off this).
 */
function useCountUp(target: number, durationMs: number, start: boolean, delayMs = 0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let rafId = 0;
    const t = window.setTimeout(() => {
      const startTime = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - startTime) / durationMs, 1);
        const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p); // ease-out-expo
        setValue(target * eased);
        if (p < 1) rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    }, delayMs);
    return () => {
      window.clearTimeout(t);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [target, durationMs, start, delayMs]);
  return value;
}

function useCyclingValue<T>(values: T[], intervalMs: number, start: boolean) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!start) return;
    const id = window.setInterval(
      () => setIdx((i) => (i + 1) % values.length),
      intervalMs,
    );
    return () => window.clearInterval(id);
  }, [values.length, intervalMs, start]);
  return values[idx];
}

function useLiveClock(start: boolean): string {
  const [t, setT] = useState<string>("--:--:--Z");
  useEffect(() => {
    if (!start) return;
    const fmt = () => {
      const d = new Date();
      const hh = String(d.getUTCHours()).padStart(2, "0");
      const mm = String(d.getUTCMinutes()).padStart(2, "0");
      const ss = String(d.getUTCSeconds()).padStart(2, "0");
      return `${hh}:${mm}:${ss}Z`;
    };
    setT(fmt());
    const id = window.setInterval(() => setT(fmt()), 1000);
    return () => window.clearInterval(id);
  }, [start]);
  return t;
}

/**
 * Returns true once `delayMs` has elapsed since `active` became true.
 * Used to stagger sub-element entrances on top of the parent's viewport trigger.
 */
function useDelayedActive(active: boolean, delayMs: number): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(() => setOn(true), delayMs);
    return () => window.clearTimeout(t);
  }, [active, delayMs]);
  return on;
}

// ─────────────────────────────────────────────────────────
//  Static demo data
// ─────────────────────────────────────────────────────────

const NAV_TARGET = 10046.3;
const PNL_TARGET = 46.3;
const APY_TARGET = 4.63;
const BPS_TARGET = 463;
const ATTESTATIONS_TARGET = 12;
const RISK_SCORE = 1;

const ALLOCATIONS = [
  { name: "USDY", bps: 3408, color: "#a78bfa" },
  { name: "mUSD", bps: 3000, color: "#84cc16" },
  { name: "Aave", bps: 3592, color: "#fbbf24" },
  { name: "MI4",  bps: 0,    color: "#f9a8d4", muted: true },
] as const;

const TX_HASHES = [
  "0x4f8a…b9c2",
  "0x9c3d…e7a1",
  "0x2b1e…c5f4",
  "0xa7c4…d8b3",
];

const SIGNERS = ["Allocator#1", "Risk#2", "Reporter#3"];

// ─────────────────────────────────────────────────────────
//  HeroShowcase
// ─────────────────────────────────────────────────────────

export function HeroShowcase() {
  const { ref, active } = useViewportTrigger<HTMLDivElement>(0.3);

  // Number animations — start times are coordinated so the eye reads
  // headline → secondary → allocation in a natural cascade.
  const nav = useCountUp(NAV_TARGET, 1600, active, 0);
  const pnl = useCountUp(PNL_TARGET, 1100, active, 480);
  const apy = useCountUp(APY_TARGET, 1100, active, 620);
  const bps = useCountUp(BPS_TARGET, 1300, active, 760);
  const att = useCountUp(ATTESTATIONS_TARGET, 900, active, 920);

  // Staggered entrance booleans
  const stateBadgeIn = useDelayedActive(active, 350);
  const pnlIn = useDelayedActive(active, 520);

  // Cycling values
  const txHash = useCyclingValue(TX_HASHES, 3600, active);
  const signer = useCyclingValue(SIGNERS, 3600, active);
  const clock = useLiveClock(active);

  return (
    <div ref={ref} className="relative mx-auto max-w-[920px]">
      <div
        className={cn(
          "relative w-full rounded-[20px] border border-[var(--color-border)] bg-[var(--color-bg-card-soft)] overflow-hidden",
          active && "card-lift",
        )}
      >
        {/* Card header strip */}
        <div className="flex items-center justify-between px-7 py-4 border-b border-[var(--color-border)] bg-white/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="block w-2 h-2 rounded-full bg-[var(--color-success)] pulse-soft" />
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
              AtmaVault.sol · Live on Mantle Sepolia
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default">// vault state</Badge>
            <span
              className={cn(
                "transition-all duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                stateBadgeIn
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 -translate-y-1 scale-95",
              )}
            >
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
            <p className="text-[44px] md:text-[48px] leading-none font-medium tabular-nums">
              {formatUSD(nav)}
            </p>

            {/* PnL chip — slides in once active and a beat after NAV starts */}
            <div
              className={cn(
                "mt-4 flex items-center gap-2 text-[12px]",
                "transition-all duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                pnlIn
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-1.5",
              )}
            >
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-mono tabular-nums">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 8V2M2 5l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                +{pnl.toFixed(2)}
              </span>
              <span className="text-[var(--color-text-muted)]">vs entry</span>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-5">
              <Metric label="APY" value={`${apy.toFixed(2)}%`} />
              <Metric
                label="vs do-nothing"
                value={`+${Math.round(bps)} bps`}
                accent
                glow={active}
              />
              <Metric
                label="risk score"
                value={
                  <>
                    {RISK_SCORE} <span className="text-[12px] text-[var(--color-text-muted)]">/10</span>
                  </>
                }
              />
              <Metric label="attestations" value={Math.round(att).toString()} />
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
              {ALLOCATIONS.map((a, i) => (
                <AllocBar
                  key={a.name}
                  name={a.name}
                  bps={a.bps}
                  color={a.color}
                  muted={"muted" in a ? a.muted : false}
                  active={active}
                  delayMs={900 + i * 140}
                />
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-[var(--color-border)] grid grid-cols-3 gap-3">
              <Chip label="// last tx"   value={txHash} />
              <Chip label="// signed by" value={signer} />
              <Chip label="// at"        value={clock} static />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────────────────

function Metric({
  label,
  value,
  accent,
  glow,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
  glow?: boolean;
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-1">
        {label}
      </p>
      <p
        className={cn(
          "text-[18px] font-medium tabular-nums",
          accent ? "text-[var(--color-primary)]" : "text-[var(--color-text)]",
          glow && accent && "glow-pulse",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function AllocBar({
  name,
  bps,
  color,
  muted,
  active,
  delayMs,
}: {
  name: string;
  bps: number;
  color: string;
  muted?: boolean;
  active: boolean;
  delayMs: number;
}) {
  const animated = useCountUp(bps, 1400, active, delayMs);
  const animatedPct = animated / 100;
  // Trigger the shimmer wipe exactly when the bar starts filling, and only once
  const [shimmerKey, setShimmerKey] = useState<number | null>(null);
  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(() => setShimmerKey(Date.now()), delayMs);
    return () => window.clearTimeout(t);
  }, [active, delayMs]);

  return (
    <div className={muted ? "opacity-50" : ""}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="block w-2 h-2 rounded-[1px]" style={{ background: color }} />
          <span className="text-[13px] font-medium text-[var(--color-text)]">{name}</span>
        </div>
        <span className="font-mono text-[12px] text-[var(--color-text-secondary)] tabular-nums">
          {animatedPct.toFixed(2)}%{" "}
          <span className="text-[var(--color-text-muted)]">/ {Math.round(animated)} bps</span>
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-white border border-[var(--color-border)] overflow-hidden">
        {/*
          Width is driven straight off rAF state — no CSS transition chases it,
          so the fill is buttery instead of stair-stepped.
        */}
        <div
          className="h-full rounded-full"
          style={{ width: `${animatedPct}%`, background: color }}
        />
        {shimmerKey !== null && !muted && (
          <span key={shimmerKey} className="shimmer-wipe absolute inset-0 block" />
        )}
      </div>
    </div>
  );
}

function Chip({
  label,
  value,
  static: isStatic,
}: {
  label: string;
  value: string;
  /** When true, value updates without the slide-in animation (e.g. live clock) */
  static?: boolean;
}) {
  return (
    <div className="rounded-md px-3 py-2 bg-white border border-[var(--color-border)] overflow-hidden">
      <p className="font-mono text-[9px] uppercase tracking-[0.06em] text-[var(--color-text-muted)] mb-0.5">
        {label}
      </p>
      {/*
        Key on value forces remount each cycle; the chip-slide-in keyframe
        replaces the old "flicker" hack with a proper slide + blur reveal.
      */}
      <p
        key={isStatic ? undefined : value}
        className={cn(
          "font-mono text-[11px] text-[var(--color-text)] truncate tabular-nums",
          !isStatic && "chip-slide-in",
        )}
      >
        {value}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────

function formatUSD(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
