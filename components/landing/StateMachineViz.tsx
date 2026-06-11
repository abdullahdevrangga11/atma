"use client";

import { useEffect, useState } from "react";

const STATES = [
  "idle",
  "analyzing",
  "proposing",
  "executing",
  "attesting",
  "allocated",
  "rebalancing",
  "allocated",
] as const;

const SUBLINES: Record<string, string> = {
  idle: "vault holding · waiting for deposit",
  analyzing: "AllocatorAgent reading live APYs",
  proposing: "weights computed · awaiting signature",
  executing: "routing across 4 mantle assets",
  attesting: "ERC-8004 reputation event emitted",
  allocated: "passive monitoring · 60s heartbeat",
  rebalancing: "yield drift > 50 bps · redistributing",
};

export function StateMachineViz() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % STATES.length), 1800);
    return () => clearInterval(t);
  }, []);

  const current = STATES[idx];

  return (
    <div className="relative w-full h-full min-h-[440px] code-block !rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="code-block-header !py-3 !px-5 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#ff5f57]" />
          <span className="w-2 h-2 rounded-full bg-[#febc2e]" />
          <span className="w-2 h-2 rounded-full bg-[#28c840]" />
          <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-faint)]">
            AtmaVault.sol · state machine
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-faint)]">
          live · sepolia
        </span>
      </div>

      {/* States list */}
      <div className="p-6 md:p-8 font-mono text-[12px] leading-relaxed">
        {STATES.slice(0, 7).map((s, i) => {
          const isActive = i === idx;
          const isPast = i < idx;
          return (
            <div
              key={s + i}
              className="flex items-center gap-4 py-1 transition-colors duration-300"
              style={{
                color: isActive
                  ? "var(--color-accent)"
                  : isPast
                    ? "var(--color-text-secondary)"
                    : "var(--color-text-faint)",
              }}
            >
              <span className="w-6 text-right tabular-nums">
                {String(i).padStart(2, "0")}
              </span>

              <span
                className="block w-4 h-4 flex items-center justify-center border"
                style={{
                  borderColor: isActive
                    ? "var(--color-accent)"
                    : isPast
                      ? "var(--color-border-strong)"
                      : "var(--color-border)",
                  background: isActive ? "var(--color-accent-soft)" : "transparent",
                }}
              >
                {isPast && !isActive && (
                  <svg width="8" height="8" viewBox="0 0 8 8">
                    <path
                      d="M1 4l2 2 4-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] pulse-soft" />
                )}
              </span>

              <span className="uppercase tracking-[0.04em]">{s}</span>

              {isActive && (
                <span className="ml-auto text-[var(--color-text-secondary)] truncate normal-case tracking-normal text-[11px] hide-on-narrow">
                  {SUBLINES[s]}
                </span>
              )}
            </div>
          );
        })}

        {/* Decision footer */}
        <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
          <div className="grid grid-cols-2 gap-3 text-[10px] uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
            <div>
              <p>tx hash</p>
              <p className="font-mono text-[12px] text-[var(--color-text)] normal-case tracking-normal mt-1">
                0x{(0x4f8a + idx * 0xa1b).toString(16).padStart(8, "0")}...
                <span className="text-[var(--color-text-muted)]">b9c2</span>
              </p>
            </div>
            <div>
              <p>agent</p>
              <p className="font-mono text-[12px] text-[var(--color-text)] normal-case tracking-normal mt-1">
                {current === "analyzing" || current === "proposing"
                  ? "AllocatorAgent#1"
                  : current === "executing" || current === "attesting"
                    ? "AllocatorAgent#1"
                    : current === "rebalancing"
                      ? "RiskAgent#2"
                      : "RiskAgent#2 · idle"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sweep line */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px sweep"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--color-accent), transparent)",
        }}
      />
    </div>
  );
}
