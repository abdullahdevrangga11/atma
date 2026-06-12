"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Handle,
  Position,
  useReactFlow,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

/**
 * Four small React Flow scenes used as the diagram decor inside the
 * `ProductSection` bento grid:
 *   - VaultStateDiagram   — AMANA at the centre, 4 RWA assets orbiting
 *   - AgentSwarmDiagram   — 3 agent circles converging on SKILLS
 *   - PolicyAsDataDiagram — SKILL.md → CLAUDE arrow with subtitle
 *   - AttestationDiagram  — registry at top, 5 tx events fanning out
 *                           horizontally so the wide bento tile gets used.
 *
 * Each diagram:
 *   - Enables `nodesDraggable` so the user can rearrange any node by
 *     dragging it — small tactile signal that this is a real graph.
 *   - Marks every edge `animated: true` for React Flow's hardware-
 *     accelerated dash-flow (data-flowing-through-pipe feel).
 *   - Wraps node content with `.amana-flow-node` so the CSS hover rule
 *     lifts the node on pointer enter.
 */

type AssetTone = "violet" | "lime" | "amber" | "pink" | "ink" | "white";

const TONE: Record<
  AssetTone,
  { bg: string; fg: string; border: string }
> = {
  violet: { bg: "#613BF9", fg: "#ffffff", border: "#613BF9" },
  lime:   { bg: "#84cc16", fg: "#ffffff", border: "#84cc16" },
  amber:  { bg: "#fbbf24", fg: "#ffffff", border: "#fbbf24" },
  pink:   { bg: "#f9a8d4", fg: "#1f1f1f", border: "#f9a8d4" },
  ink:    { bg: "#0a0a0a", fg: "#ffffff", border: "#0a0a0a" },
  white:  { bg: "#ffffff", fg: "#0a0a0a", border: "#e8e8e8" },
};

type PillData = { label: string; tone: AssetTone; sub?: string };
type CircleData = { label: string };
type FileData = { label: string };
type ArrowEdgeStyle = Pick<Edge, "style" | "markerEnd" | "animated" | "type">;

function flowEdge(): ArrowEdgeStyle {
  return {
    type: "default",
    animated: true,
    style: { stroke: "#0a0a0a", strokeWidth: 1.4 },
    markerEnd: { type: "arrowclosed", color: "#0a0a0a", width: 10, height: 10 } as Edge["markerEnd"],
  };
}

function flowEdgeViolet(): ArrowEdgeStyle {
  return {
    type: "smoothstep",
    animated: true,
    style: { stroke: "#613BF9", strokeWidth: 1.6 },
    markerEnd: { type: "arrowclosed", color: "#613BF9", width: 10, height: 10 } as Edge["markerEnd"],
  };
}

// ───────────────────────────────────────────────────────────
//  Node renderers
// ───────────────────────────────────────────────────────────

function PillNode({ data }: NodeProps) {
  const d = data as unknown as PillData;
  const tone = TONE[d.tone];
  return (
    <div
      className="amana-flow-node"
      style={{
        padding: "6px 12px",
        borderRadius: 6,
        background: tone.bg,
        color: tone.fg,
        border: `1.4px solid ${tone.border}`,
        fontFamily: "ui-monospace, SF Mono, monospace",
        fontSize: 11,
        fontWeight: 600,
        textAlign: "center",
        minWidth: 56,
        lineHeight: 1.15,
        cursor: "grab",
      }}
    >
      <Handle type="target" position={Position.Top} style={hidden} />
      <Handle type="target" position={Position.Left} style={hidden} />
      <Handle type="source" position={Position.Right} style={hidden} />
      <Handle type="source" position={Position.Bottom} style={hidden} />
      <Handle type="source" position={Position.Top} id="src-top" style={hidden} />
      <Handle type="target" position={Position.Bottom} id="tgt-bottom" style={hidden} />
      <div>{d.label}</div>
      {d.sub && (
        <div style={{ fontSize: 9, opacity: 0.8, marginTop: 2 }}>{d.sub}</div>
      )}
    </div>
  );
}

function CircleNode({ data }: NodeProps) {
  const d = data as unknown as CircleData;
  return (
    <div
      className="amana-flow-node"
      style={{
        width: 56,
        height: 56,
        borderRadius: 999,
        background: "#ffffff",
        border: "1.4px solid #0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "ui-monospace, SF Mono, monospace",
        fontSize: 10,
        fontWeight: 600,
        color: "#0a0a0a",
        cursor: "grab",
      }}
    >
      <Handle type="target" position={Position.Top} style={hidden} />
      <Handle type="target" position={Position.Left} style={hidden} />
      <Handle type="source" position={Position.Right} style={hidden} />
      <Handle type="source" position={Position.Bottom} style={hidden} />
      {d.label}
    </div>
  );
}

function FileNode({ data }: NodeProps) {
  const d = data as unknown as FileData;
  return (
    <div
      className="amana-flow-node"
      style={{
        width: 84,
        height: 100,
        position: "relative",
        background: "#ffffff",
        border: "1.4px solid #0a0a0a",
        fontFamily: "ui-monospace, SF Mono, monospace",
        cursor: "grab",
      }}
    >
      <Handle type="source" position={Position.Right} style={hidden} />
      {/* Folded-corner triangle */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          borderTop: "12px solid #0a0a0a",
          borderRight: "12px solid transparent",
        }}
      />
      <div
        style={{
          marginTop: 14,
          textAlign: "center",
          fontSize: 9,
          fontWeight: 600,
          color: "#0a0a0a",
        }}
      >
        {d.label}
      </div>
      {/* Soft fake lines */}
      <div style={{ marginTop: 10, padding: "0 10px" }}>
        {[64, 80, 70, 50].map((w, i) => (
          <span
            key={i}
            style={{
              display: "block",
              height: 2,
              width: `${w}%`,
              background: "#e8e8e8",
              marginBottom: 5,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function RegistryHeaderNode({ data }: NodeProps) {
  const d = data as unknown as { label: string };
  return (
    <div
      className="amana-flow-node"
      style={{
        padding: "10px 18px 10px 16px",
        background: "#0a0a0a",
        color: "#ffffff",
        borderRadius: 10,
        fontFamily: "ui-monospace, SF Mono, monospace",
        fontSize: 11,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: 10,
        minWidth: 220,
        cursor: "grab",
      }}
    >
      <Handle type="source" position={Position.Bottom} style={hidden} />
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#84cc16",
          boxShadow: "0 0 8px #84cc16",
          animation: "amana-pulse-dot 2.2s ease-in-out infinite",
        }}
      />
      {d.label}
    </div>
  );
}

function TxCardNode({ data }: NodeProps) {
  const d = data as unknown as {
    tx: string;
    agent: string;
    active?: boolean;
  };
  return (
    <div
      className={`amana-flow-node${d.active ? " amana-attest-active" : ""}`}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 5,
        padding: "10px 12px",
        background: d.active ? "#613BF9" : "#ffffff",
        color: d.active ? "#ffffff" : "#0a0a0a",
        border: `1.4px solid ${d.active ? "#613BF9" : "#e8e8e8"}`,
        borderRadius: 8,
        fontFamily: "ui-monospace, SF Mono, monospace",
        fontSize: 10,
        minWidth: 110,
        cursor: "grab",
      }}
    >
      <Handle type="target" position={Position.Top} style={hidden} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ opacity: d.active ? 1 : 0.7, fontWeight: 600 }}>{d.tx}</span>
        <span
          style={{
            width: 10,
            height: 6,
            background: d.active ? "#ffffff" : "#0a0a0a",
            borderRadius: 2,
          }}
        />
      </div>
      <div style={{ fontWeight: 600 }}>{d.agent}</div>
      <div
        style={{
          alignSelf: "flex-start",
          fontSize: 8.5,
          padding: "2px 6px",
          borderRadius: 3,
          background: d.active ? "rgba(255,255,255,0.18)" : "#fafafa",
          color: d.active ? "rgba(255,255,255,0.9)" : "#5e5e5e",
          letterSpacing: "0.06em",
        }}
      >
        ATTEST_REP
      </div>
    </div>
  );
}

const hidden = { background: "transparent", border: "none" } as const;

const nodeTypes = {
  pill: PillNode,
  circle: CircleNode,
  file: FileNode,
  registry: RegistryHeaderNode,
  txcard: TxCardNode,
};

// ───────────────────────────────────────────────────────────
//  Frame wrapper — pan/zoom off but dragging enabled
// ───────────────────────────────────────────────────────────

function Frame({
  nodes,
  edges,
  height = 220,
}: {
  nodes: Node[];
  edges: Edge[];
  height?: number;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ReactFlowProvider>
        <InnerFlow nodes={nodes} edges={edges} />
      </ReactFlowProvider>
    </div>
  );
}

/**
 * Inner React Flow that knows its viewport so it can auto-refit after a
 * user drags a node — keeps the diagram from "disappearing" when someone
 * pulls a node off the canvas edge.
 */
function InnerFlow({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) {
  const flow = useReactFlow();
  const refit = () => {
    requestAnimationFrame(() => {
      flow.fitView({ duration: 420, padding: 0.18, maxZoom: 1 });
    });
  };
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      proOptions={{ hideAttribution: true }}
      fitView
      fitViewOptions={{ padding: 0.18, maxZoom: 1 }}
      panOnDrag={false}
      panOnScroll={false}
      zoomOnScroll={false}
      zoomOnPinch={false}
      zoomOnDoubleClick={false}
      nodesDraggable
      nodesConnectable={false}
      elementsSelectable={false}
      preventScrolling={false}
      onNodeDragStop={refit}
    >
      <Background gap={16} size={1} color="#dcdcdc" />
    </ReactFlow>
  );
}

// ───────────────────────────────────────────────────────────
//  1. Vault state diagram — AMANA + 4 RWA satellites
// ───────────────────────────────────────────────────────────

export function VaultStateDiagram() {
  const nodes = useMemo<Node[]>(
    () => [
      { id: "amana",  type: "pill", position: { x: 150, y: 100 }, data: { label: "AMANA",  tone: "violet" } },
      { id: "usdy",  type: "pill", position: { x: 0,    y: 40  }, data: { label: "USDY",  tone: "violet" } },
      { id: "musd",  type: "pill", position: { x: 300,  y: 40  }, data: { label: "mUSD",  tone: "lime"   } },
      { id: "aave",  type: "pill", position: { x: 0,    y: 160 }, data: { label: "AAVE",  tone: "amber"  } },
      { id: "mi4",   type: "pill", position: { x: 300,  y: 160 }, data: { label: "MI4",   tone: "pink"   } },
    ],
    [],
  );
  const edges = useMemo<Edge[]>(
    () => [
      { id: "e-usdy", source: "usdy", target: "amana", ...flowEdge() },
      { id: "e-musd", source: "musd", target: "amana", ...flowEdge() },
      { id: "e-aave", source: "aave", target: "amana", ...flowEdge() },
      { id: "e-mi4",  source: "mi4",  target: "amana", ...flowEdge() },
    ],
    [],
  );
  return <Frame nodes={nodes} edges={edges} />;
}

// ───────────────────────────────────────────────────────────
//  2. Agent swarm diagram — 3 agents → SKILLS
// ───────────────────────────────────────────────────────────

export function AgentSwarmDiagram() {
  const nodes = useMemo<Node[]>(
    () => [
      { id: "alloc",  type: "circle", position: { x: 30,  y: 40  }, data: { label: "ALLOC" } },
      { id: "risk",   type: "circle", position: { x: 170, y: 0   }, data: { label: "RISK"  } },
      { id: "rprt",   type: "circle", position: { x: 310, y: 40  }, data: { label: "RPRT"  } },
      { id: "skills", type: "pill",   position: { x: 156, y: 170 }, data: { label: "SKILLS", tone: "violet" } },
    ],
    [],
  );
  const edges = useMemo<Edge[]>(
    () => [
      { id: "e-alloc",  source: "alloc",  target: "skills", ...flowEdgeViolet() },
      { id: "e-risk",   source: "risk",   target: "skills", ...flowEdgeViolet() },
      { id: "e-rprt",   source: "rprt",   target: "skills", ...flowEdgeViolet() },
    ],
    [],
  );
  return <Frame nodes={nodes} edges={edges} />;
}

// ───────────────────────────────────────────────────────────
//  3. Policy-as-data — SKILL.md → CLAUDE
// ───────────────────────────────────────────────────────────

export function PolicyAsDataDiagram() {
  const nodes = useMemo<Node[]>(
    () => [
      { id: "file",   type: "file",  position: { x: 20,  y: 70 }, data: { label: "SKILL.md" } },
      { id: "claude", type: "pill",  position: { x: 240, y: 100 }, data: { label: "CLAUDE", sub: "reasons", tone: "violet" } },
    ],
    [],
  );
  const edges = useMemo<Edge[]>(
    () => [
      { id: "e-flow", source: "file", target: "claude", ...flowEdgeViolet() },
    ],
    [],
  );
  return <Frame nodes={nodes} edges={edges} />;
}

// ───────────────────────────────────────────────────────────
//  4. Attestation diagram — registry at top, tx events fan
//     out HORIZONTALLY across the full-width bento tile
// ───────────────────────────────────────────────────────────

export function AttestationDiagram() {
  // Centre-anchored layout — registry top-centre, 5 tx cards in a row below.
  // The middle card is "active" so the eye lands on it first.
  const nodes = useMemo<Node[]>(
    () => [
      { id: "reg",  type: "registry", position: { x: 340, y: 0   }, data: { label: "ERC-8004 reputation registry" } },
      { id: "tx1", type: "txcard",   position: { x: 0,   y: 130 }, data: { tx: "0x4f8a…",  agent: "ALLOC#1" } },
      { id: "tx2", type: "txcard",   position: { x: 170, y: 130 }, data: { tx: "0x59a5…",  agent: "ALLOC#2" } },
      { id: "tx3", type: "txcard",   position: { x: 340, y: 130 }, data: { tx: "0x63c0…",  agent: "ALLOC#3", active: true } },
      { id: "tx4", type: "txcard",   position: { x: 510, y: 130 }, data: { tx: "0x6ddb…",  agent: "ALLOC#4" } },
      { id: "tx5", type: "txcard",   position: { x: 680, y: 130 }, data: { tx: "0x77f6…",  agent: "ALLOC#5" } },
    ],
    [],
  );
  const edges = useMemo<Edge[]>(
    () => [
      { id: "e-reg-tx1", source: "reg", target: "tx1", ...flowEdgeViolet() },
      { id: "e-reg-tx2", source: "reg", target: "tx2", ...flowEdgeViolet() },
      { id: "e-reg-tx3", source: "reg", target: "tx3", ...flowEdgeViolet() },
      { id: "e-reg-tx4", source: "reg", target: "tx4", ...flowEdgeViolet() },
      { id: "e-reg-tx5", source: "reg", target: "tx5", ...flowEdgeViolet() },
    ],
    [],
  );
  return <Frame nodes={nodes} edges={edges} height={260} />;
}
