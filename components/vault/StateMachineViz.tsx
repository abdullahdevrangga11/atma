"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Animated SVG diagram of the AtmaVault state machine. The orchestrator
 * emits `state` events as the vault transitions through its lifecycle;
 * this component highlights the current node and traces the path taken.
 *
 * Layout mirrors the contract: a happy-path row of 6 states plus 4 side
 * states (Rebalancing, RiskTriggered, Withdrawing, DefensiveExit, Completed).
 */

export const STATE_LIST = [
  "Idle",
  "Analyzing",
  "Proposing",
  "Executing",
  "Attesting",
  "Allocated",
  "Rebalancing",
  "RiskTriggered",
  "Withdrawing",
  "DefensiveExit",
  "Completed",
] as const;
type VaultState = (typeof STATE_LIST)[number];

type Pos = { x: number; y: number };

const POSITIONS: Record<VaultState, Pos> = {
  Idle:           { x: 60,  y: 60 },
  Analyzing:      { x: 200, y: 60 },
  Proposing:      { x: 340, y: 60 },
  Executing:      { x: 480, y: 60 },
  Attesting:      { x: 620, y: 60 },
  Allocated:      { x: 760, y: 60 },
  Rebalancing:    { x: 200, y: 150 },
  RiskTriggered:  { x: 480, y: 150 },
  DefensiveExit:  { x: 620, y: 150 },
  Withdrawing:    { x: 760, y: 150 },
  Completed:      { x: 760, y: 220 },
};

const EDGES: [VaultState, VaultState][] = [
  ["Idle", "Analyzing"],
  ["Analyzing", "Proposing"],
  ["Proposing", "Executing"],
  ["Executing", "Attesting"],
  ["Attesting", "Allocated"],
  ["Allocated", "Rebalancing"],
  ["Rebalancing", "Analyzing"],
  ["Allocated", "RiskTriggered"],
  ["RiskTriggered", "DefensiveExit"],
  ["DefensiveExit", "Withdrawing"],
  ["Allocated", "Withdrawing"],
  ["Withdrawing", "Completed"],
];

type Props = {
  current: VaultState | null;
  visited: VaultState[];
  className?: string;
};

export function StateMachineViz({ current, visited, className }: Props) {
  const visitedSet = new Set(visited);

  return (
    <div className={cn("relative w-full overflow-x-auto", className)}>
      <svg
        viewBox="0 0 840 290"
        className="w-full h-auto min-w-[760px]"
        aria-label="Vault state machine"
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="#c7bdf9" />
          </marker>
          <marker
            id="arrow-active"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="#5b3df0" />
          </marker>
        </defs>

        {/* Edges */}
        {EDGES.map(([from, to], i) => {
          const f = POSITIONS[from];
          const t = POSITIONS[to];
          const isActiveEdge =
            visitedSet.has(from) && (visitedSet.has(to) || current === to);
          return (
            <line
              key={i}
              x1={f.x + 38}
              y1={f.y}
              x2={t.x - 38}
              y2={t.y}
              stroke={isActiveEdge ? "#5b3df0" : "#e8e8e8"}
              strokeWidth={isActiveEdge ? 1.8 : 1}
              strokeDasharray={isActiveEdge ? "0" : "3 3"}
              markerEnd={isActiveEdge ? "url(#arrow-active)" : "url(#arrow)"}
              style={{ transition: "all 360ms cubic-bezier(0.16,1,0.3,1)" }}
            />
          );
        })}

        {/* Nodes */}
        {STATE_LIST.map((s) => {
          const p = POSITIONS[s];
          const isCurrent = current === s;
          const isVisited = visitedSet.has(s) && !isCurrent;
          const isSide =
            s === "Rebalancing" ||
            s === "RiskTriggered" ||
            s === "DefensiveExit" ||
            s === "Withdrawing" ||
            s === "Completed";
          return <Node key={s} label={s} pos={p} current={isCurrent} visited={isVisited} side={isSide} />;
        })}
      </svg>
    </div>
  );
}

function Node({
  label,
  pos,
  current,
  visited,
  side,
}: {
  label: string;
  pos: Pos;
  current: boolean;
  visited: boolean;
  side: boolean;
}) {
  const ringRef = useRef<SVGCircleElement>(null);
  // Bump effect on transition to current
  useEffect(() => {
    if (!current || !ringRef.current) return;
    const el = ringRef.current;
    el.animate(
      [
        { transform: "scale(0.8)", opacity: 0.0 },
        { transform: "scale(1.4)", opacity: 0.0 },
      ],
      { duration: 900, iterations: Infinity, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
    );
  }, [current]);

  const fill = current ? "#5b3df0" : visited ? "#ede9fe" : side ? "#fafafa" : "#ffffff";
  const textColor = current ? "#ffffff" : visited ? "#5b3df0" : side ? "#858585" : "#0a0a0a";
  const stroke = current ? "#5b3df0" : visited ? "#c7bdf9" : "#e8e8e8";

  return (
    <g transform={`translate(${pos.x}, ${pos.y})`} style={{ transition: "all 360ms cubic-bezier(0.16,1,0.3,1)" }}>
      {current && (
        <circle ref={ringRef} cx="0" cy="0" r="34" fill="none" stroke="#5b3df0" strokeWidth="1.4" style={{ transformOrigin: "0 0" }} />
      )}
      <rect
        x="-38"
        y="-16"
        width="76"
        height="32"
        rx="6"
        fill={fill}
        stroke={stroke}
        strokeWidth={current ? 1.8 : 1}
      />
      <text
        x="0"
        y="4"
        textAnchor="middle"
        fontSize="10"
        fontFamily="ui-monospace, monospace"
        fontWeight="500"
        fill={textColor}
      >
        {label}
      </text>
    </g>
  );
}
