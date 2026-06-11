"use client";

import { useEffect, useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { cn } from "@/lib/utils/cn";

/**
 * Animated React Flow diagram of the AtmaVault state machine. The orchestrator
 * emits `state` events as the vault transitions through its lifecycle; the
 * diagram highlights the current node + traces the path taken.
 *
 * Why React Flow:
 *   - First-class typed nodes + edges instead of hand-rolled SVG geometry.
 *   - Built-in Controls + Background for the "developer tool" feel.
 *   - Custom Node component lets the active node animate independently.
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

type NodeData = { label: VaultState; current: boolean; visited: boolean };

const POS: Record<VaultState, { x: number; y: number }> = {
  Idle:          { x: 20,  y: 70 },
  Analyzing:     { x: 170, y: 70 },
  Proposing:     { x: 320, y: 70 },
  Executing:     { x: 470, y: 70 },
  Attesting:     { x: 620, y: 70 },
  Allocated:     { x: 770, y: 70 },
  Rebalancing:   { x: 170, y: 170 },
  RiskTriggered: { x: 470, y: 170 },
  DefensiveExit: { x: 620, y: 170 },
  Withdrawing:   { x: 770, y: 170 },
  Completed:     { x: 770, y: 260 },
};

const EDGE_DEFS: Array<{ from: VaultState; to: VaultState }> = [
  { from: "Idle", to: "Analyzing" },
  { from: "Analyzing", to: "Proposing" },
  { from: "Proposing", to: "Executing" },
  { from: "Executing", to: "Attesting" },
  { from: "Attesting", to: "Allocated" },
  { from: "Allocated", to: "Rebalancing" },
  { from: "Rebalancing", to: "Analyzing" },
  { from: "Allocated", to: "RiskTriggered" },
  { from: "RiskTriggered", to: "DefensiveExit" },
  { from: "DefensiveExit", to: "Withdrawing" },
  { from: "Allocated", to: "Withdrawing" },
  { from: "Withdrawing", to: "Completed" },
];

const NODE_WIDTH = 100;
const NODE_HEIGHT = 40;

const nodeTypes = { state: StateNode };

type Props = {
  current: VaultState | null;
  visited: VaultState[];
  className?: string;
};

export function StateMachineViz(props: Props) {
  return (
    <div className={cn("relative w-full h-[360px] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card-soft)] overflow-hidden", props.className)}>
      <ReactFlowProvider>
        <Inner {...props} />
      </ReactFlowProvider>
    </div>
  );
}

function Inner({ current, visited }: Props) {
  const flow = useReactFlow();
  const visitedSet = useMemo(() => new Set(visited), [visited]);

  const nodes: Node<NodeData>[] = useMemo(
    () =>
      STATE_LIST.map((s) => ({
        id: s,
        type: "state",
        position: POS[s],
        data: { label: s, current: current === s, visited: visitedSet.has(s) && current !== s },
        draggable: false,
        selectable: false,
      })),
    [current, visitedSet],
  );

  const edges: Edge[] = useMemo(
    () =>
      EDGE_DEFS.map((e) => {
        const isActiveEdge =
          visitedSet.has(e.from) && (visitedSet.has(e.to) || current === e.to);
        return {
          id: `${e.from}-${e.to}`,
          source: e.from,
          target: e.to,
          type: "smoothstep",
          animated: isActiveEdge,
          style: {
            stroke: isActiveEdge ? "#5b3df0" : "#c7bdf9",
            strokeWidth: isActiveEdge ? 1.8 : 1,
            strokeDasharray: isActiveEdge ? "0" : "3 3",
          },
          markerEnd: {
            type: "arrowclosed",
            color: isActiveEdge ? "#5b3df0" : "#c7bdf9",
            width: 14,
            height: 14,
          },
        } as Edge;
      }),
    [current, visitedSet],
  );

  // Recenter the viewport on the current state node when it changes.
  useEffect(() => {
    if (!current) return;
    flow.fitView({ duration: 480, padding: 0.2, maxZoom: 1 });
  }, [current, flow]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      proOptions={{ hideAttribution: true }}
      panOnDrag={false}
      zoomOnScroll={false}
      zoomOnPinch={false}
      panOnScroll={false}
      preventScrolling={false}
      fitView
      fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
    >
      <Background gap={20} size={1} color="#e8e8e8" />
      <Controls
        showInteractive={false}
        position="bottom-right"
        style={{
          border: "1px solid var(--color-border)",
          borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
        }}
      />
    </ReactFlow>
  );
}

// ───────────────────────────────────────────────────────────
//  Custom node — state pill with current/visited tones
// ───────────────────────────────────────────────────────────

function StateNode({ data }: NodeProps) {
  const d = data as unknown as NodeData;
  return (
    <div
      style={{
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        borderRadius: 8,
        fontFamily: "ui-monospace, monospace",
        fontSize: 11,
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: d.current ? "#5b3df0" : d.visited ? "#ede9fe" : "#ffffff",
        color: d.current ? "#ffffff" : d.visited ? "#5b3df0" : "#0a0a0a",
        border: `1.4px solid ${d.current ? "#5b3df0" : d.visited ? "#c7bdf9" : "#e8e8e8"}`,
        transition: "all 360ms cubic-bezier(0.16, 1, 0.3, 1)",
        position: "relative",
      }}
    >
      {d.current && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            inset: -6,
            borderRadius: 12,
            border: "1.4px solid #5b3df0",
            opacity: 0.4,
            animation: "atma-state-pulse 1.4s ease-in-out infinite",
          }}
        />
      )}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "transparent", border: "none" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "transparent", border: "none" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ background: "transparent", border: "none" }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ background: "transparent", border: "none" }}
      />
      <span style={{ position: "relative", zIndex: 1 }}>{d.label}</span>
    </div>
  );
}
