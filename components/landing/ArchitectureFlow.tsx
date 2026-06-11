"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

/**
 * ArchitectureFlow — an animated SVG that traces the agent pipeline.
 *
 * Nodes:
 *   Live Feeds → AllocatorAgent → RiskAgent → ReporterAgent → Attestation → Reports
 *                                  ↘ (veto)              ↗
 *
 * A particle travels along the path on a loop so the diagram reads as live
 * even without user interaction. The "veto" branch periodically lights up to
 * surface the debate loop primitive.
 */

const NODES = [
  { id: "feeds",      x: 60,  y: 130, w: 96,  h: 56, label: "Live Feeds",      sub: "/api/feeds",         tone: "neutral" as const, href: "/api/feeds" },
  { id: "allocator",  x: 220, y: 130, w: 110, h: 56, label: "AllocatorAgent",  sub: "skill.md → JSON",     tone: "primary" as const, href: "/agents/allocator" },
  { id: "risk",       x: 390, y: 130, w: 110, h: 56, label: "RiskAgent",       sub: "veto authority",     tone: "warm" as const,    href: "/agents/risk" },
  { id: "reporter",   x: 560, y: 130, w: 110, h: 56, label: "ReporterAgent",   sub: "signs the digest",   tone: "lime" as const,    href: "/agents/reporter" },
  { id: "attest",     x: 730, y: 130, w: 96,  h: 56, label: "Attestation",     sub: "ERC-8004 event",     tone: "primary" as const, href: "/runs" },
  { id: "reports",    x: 730, y: 230, w: 96,  h: 48, label: "Reports",         sub: "history",            tone: "neutral" as const, href: "/reports" },
  // Veto branch — risk back to allocator
  { id: "vault",      x: 390, y: 230, w: 110, h: 48, label: "AtmaVault",       sub: "11-state machine",   tone: "neutral" as const, href: "/vault" },
] as const;

const EDGES = [
  { from: "feeds",     to: "allocator", main: true },
  { from: "allocator", to: "risk",      main: true },
  { from: "risk",      to: "reporter",  main: true },
  { from: "reporter",  to: "attest",    main: true },
  { from: "attest",    to: "reports",   main: false },
  // Debate veto path
  { from: "risk",      to: "allocator", main: false, veto: true, curve: -60 },
  // State machine driving the vault
  { from: "allocator", to: "vault",     main: false },
  { from: "vault",     to: "reports",   main: false },
] as const;

const TONE_FG: Record<(typeof NODES)[number]["tone"], string> = {
  primary: "#5b3df0",
  warm: "#ea580c",
  lime: "#65a30d",
  neutral: "#0a0a0a",
};
const TONE_BG: Record<(typeof NODES)[number]["tone"], string> = {
  primary: "#ede9fe",
  warm: "#ffedd5",
  lime: "#ecfccb",
  neutral: "#ffffff",
};
const TONE_BORDER: Record<(typeof NODES)[number]["tone"], string> = {
  primary: "#c7bdf9",
  warm: "#fed7aa",
  lime: "#d9f99d",
  neutral: "#e8e8e8",
};

function nodeById(id: string) {
  return NODES.find((n) => n.id === id)!;
}

function pathFor(from: string, to: string, curve = 0): string {
  const a = nodeById(from);
  const b = nodeById(to);
  const x1 = a.x + a.w / 2;
  const y1 = a.y + a.h / 2;
  const x2 = b.x + b.w / 2;
  const y2 = b.y + b.h / 2;
  if (curve === 0) {
    return `M ${x1},${y1} L ${x2},${y2}`;
  }
  // Quadratic curve for veto loop-back
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 + curve;
  return `M ${x1},${y1} Q ${mx},${my} ${x2},${y2}`;
}

export function ArchitectureFlow() {
  // Cycle the highlighted edge so the diagram looks alive
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setPhase((p) => (p + 1) % 5), 1400);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-3">
            // architecture
          </p>
          <h2 className="display-3 max-w-[640px]">
            Skills-first agents, attested on Mantle.
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/vault">
            <Badge variant="default">Watch a run →</Badge>
          </Link>
          <Link href="/agents/allocator">
            <Badge variant="default">Inspect an agent →</Badge>
          </Link>
        </div>
      </div>

      <div className="relative w-full overflow-x-auto border border-[var(--color-border)] rounded-2xl bg-[var(--color-bg-card-soft)] p-4">
        <svg viewBox="0 0 856 310" className="w-full h-auto min-w-[720px]" aria-label="ATMA architecture flow">
          <defs>
            <marker id="arch-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="#c7bdf9" />
            </marker>
            <marker id="arch-arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="#5b3df0" />
            </marker>
            <marker id="arch-arrow-veto" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="#ea580c" />
            </marker>
          </defs>

          {/* Edges */}
          {EDGES.map((e, i) => {
            const d = pathFor(e.from, e.to, (e as { curve?: number }).curve ?? 0);
            const isMainPath = e.main;
            const isActive = isMainPath && i === phase % EDGES.filter((x) => x.main).length;
            const isVeto = (e as { veto?: boolean }).veto;
            const stroke = isVeto ? "#ea580c" : isActive ? "#5b3df0" : isMainPath ? "#c7bdf9" : "#e8e8e8";
            return (
              <path
                key={i}
                d={d}
                fill="none"
                stroke={stroke}
                strokeWidth={isActive ? 2 : 1.4}
                strokeDasharray={isVeto ? "5 4" : "0"}
                markerEnd={isVeto ? "url(#arch-arrow-veto)" : isActive ? "url(#arch-arrow-active)" : "url(#arch-arrow)"}
                style={{ transition: "stroke 480ms ease" }}
              />
            );
          })}

          {/* Veto label */}
          <text x="305" y="78" fontSize="10" fontFamily="ui-monospace, monospace" fill="#ea580c" textAnchor="middle">
            ← veto → redraft
          </text>

          {/* Animated particle traveling the main path */}
          {EDGES.filter((e) => e.main).map((e, i) => {
            const active = i === phase % EDGES.filter((x) => x.main).length;
            if (!active) return null;
            const a = nodeById(e.from);
            const b = nodeById(e.to);
            return (
              <circle
                key={`particle-${i}`}
                cx={a.x + a.w / 2}
                cy={a.y + a.h / 2}
                r="3"
                fill="#5b3df0"
              >
                <animate
                  attributeName="cx"
                  from={a.x + a.w / 2}
                  to={b.x + b.w / 2}
                  dur="1.4s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="cy"
                  from={a.y + a.h / 2}
                  to={b.y + b.h / 2}
                  dur="1.4s"
                  repeatCount="indefinite"
                />
              </circle>
            );
          })}

          {/* Nodes */}
          {NODES.map((n) => (
            <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
              <a href={n.href}>
                <rect
                  x="0"
                  y="0"
                  width={n.w}
                  height={n.h}
                  rx="8"
                  fill={TONE_BG[n.tone]}
                  stroke={TONE_BORDER[n.tone]}
                  strokeWidth={1.4}
                />
                <text
                  x={n.w / 2}
                  y={n.h / 2 - 4}
                  textAnchor="middle"
                  fontSize="11"
                  fontFamily="ui-monospace, monospace"
                  fontWeight="600"
                  fill={TONE_FG[n.tone]}
                >
                  {n.label}
                </text>
                <text
                  x={n.w / 2}
                  y={n.h / 2 + 10}
                  textAnchor="middle"
                  fontSize="9"
                  fontFamily="ui-monospace, monospace"
                  fill="#858585"
                >
                  {n.sub}
                </text>
              </a>
            </g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-mono">
        <LegendItem color="#5b3df0" label="Active flow (animates)" />
        <LegendItem color="#c7bdf9" label="Main pipeline (idle)" />
        <LegendItem color="#ea580c" label="Veto / debate path" dashed />
        <LegendItem color="#e8e8e8" label="Side effects" />
      </div>
    </div>
  );
}

function LegendItem({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className="block w-6 h-0.5 rounded"
        style={{
          background: dashed ? `repeating-linear-gradient(to right, ${color} 0 5px, transparent 5px 9px)` : color,
        }}
      />
      <span className="text-[var(--color-text-secondary)]">{label}</span>
    </span>
  );
}
