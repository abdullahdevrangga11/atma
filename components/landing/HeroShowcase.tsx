"use client";

import { Badge } from "@/components/ui/badge";

/**
 * Hero centerpiece — base.org-style product preview card.
 * (FiddleHover lives on the parent <section> in Hero.tsx, so this card just
 * provides the static composition.)
 */
export function HeroShowcase() {
  return (
    <div className="relative mx-auto max-w-[920px]">
      <div>
        <div className="relative w-full rounded-[20px] border border-[var(--color-border)] bg-[var(--color-bg-card-soft)] overflow-hidden">
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
              <Badge variant="accent">allocated</Badge>
            </div>
          </div>

          {/* Card body — pixel-art preview */}
          <div className="grid md:grid-cols-12 gap-0">
            {/* Left: NAV + metrics */}
            <div className="md:col-span-5 p-7 md:p-8 border-b md:border-b-0 md:border-r border-[var(--color-border)] bg-white">
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-3">
                NAV
              </p>
              <p className="text-[44px] md:text-[48px] leading-none font-medium tabular-nums">
                $10,046.30
              </p>
              <div className="mt-4 flex items-center gap-2 text-[12px]">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-mono">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M5 8V2M2 5l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  +46.30
                </span>
                <span className="text-[var(--color-text-muted)]">vs entry</span>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-5">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-1">
                    APY
                  </p>
                  <p className="text-[18px] font-medium tabular-nums">4.63%</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-1">
                    vs do-nothing
                  </p>
                  <p className="text-[18px] font-medium tabular-nums text-[var(--color-primary)]">
                    +463 bps
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-1">
                    risk score
                  </p>
                  <p className="text-[18px] font-medium tabular-nums">
                    1 <span className="text-[12px] text-[var(--color-text-muted)]">/10</span>
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-1">
                    attestations
                  </p>
                  <p className="text-[18px] font-medium tabular-nums">12</p>
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
                <AllocBar name="USDY" bps={3408} color="#a78bfa" />
                <AllocBar name="mUSD" bps={3000} color="#84cc16" />
                <AllocBar name="Aave" bps={3592} color="#fbbf24" />
                <AllocBar name="MI4"  bps={0}    color="#f9a8d4" muted />
              </div>

              <div className="mt-6 pt-5 border-t border-[var(--color-border)] grid grid-cols-3 gap-3">
                <Chip label="// last tx" value="0x4f8a…b9c2" />
                <Chip label="// signed by" value="Allocator#1" />
                <Chip label="// at" value="13:04:22Z" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AllocBar({
  name,
  bps,
  color,
  muted,
}: {
  name: string;
  bps: number;
  color: string;
  muted?: boolean;
}) {
  const pct = bps / 100;
  return (
    <div className={muted ? "opacity-50" : ""}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="block w-2 h-2 rounded-[1px]" style={{ background: color }} />
          <span className="text-[13px] font-medium text-[var(--color-text)]">{name}</span>
        </div>
        <span className="font-mono text-[12px] text-[var(--color-text-secondary)] tabular-nums">
          {pct.toFixed(2)}% <span className="text-[var(--color-text-muted)]">/ {bps} bps</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-white border border-[var(--color-border)] overflow-hidden">
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md px-3 py-2 bg-white border border-[var(--color-border)]">
      <p className="font-mono text-[9px] uppercase tracking-[0.06em] text-[var(--color-text-muted)] mb-0.5">
        {label}
      </p>
      <p className="font-mono text-[11px] text-[var(--color-text)] truncate">{value}</p>
    </div>
  );
}
