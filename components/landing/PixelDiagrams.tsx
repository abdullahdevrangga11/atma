"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

/**
 * Four small React Flow scenes used as the diagram decor inside the
 * `ProductSection` bento grid:
 *   - VaultStateDiagram   — ATMA at the centre, 4 RWA assets orbiting
 *   - AgentSwarmDiagram   — 3 agent circles converging on SKILLS
 *   - PolicyAsDataDiagram — SKILL.md → CLAUDE arrow with subtitle
 *   - AttestationDiagram  — REGISTRY in the middle, tx events as satellites
 *
 * All four reuse a tiny `Frame` wrapper that turns off pan/zoom and renders
 * a soft dotted Background so the diagrams read as decorative-but-real.
 */

type AssetTone = "violet" | "lime" | "amber" | "pink" | "ink" | "white";

const TONE: Record<
  AssetTone,
  { bg: string; fg: string; border: string }
> = {
  violet: { bg: "#5b3df0", fg: "#ffffff", border: "#5b3df0" },
  lime:   { bg: "#84cc16", fg: "#ffffff", border: "#84cc16" },
  amber:  { bg: "#fbbf24", fg: "#ffffff", border: "#fbbf24" },
  pink:   { bg: "#f9a8d4", fg: "#1f1f1f", border: "#f9a8d4" },
  ink:    { bg: "#0a0a0a", fg: "#ffffff", border: "#0a0a0a" },
  white:  { bg: "#ffffff", fg: "#0a0a0a", border: "#e8e8e8" },
};

type PillData = { label: string; tone: AssetTone; sub?: string };
type CircleData = { label: string };
type FileData = { label: string };
type ArrowEdgeStyle = Pick<Edge, "style" | "markerEnd">;

function solidEdge(): ArrowEdgeStyle {
  return {
    style: { stroke: "#0a0a0a", strokeWidth: 1.2 },
    markerEnd: { type: "arrowclosed", color: "#0a0a0a", width: 10, height: 10 } as Edge["markerEnd"],
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
      style={{
        width: 84,
        height: 100,
        position: "relative",
        background: "#ffffff",
        border: "1.4px solid #0a0a0a",
        fontFamily: "ui-monospace, SF Mono, monospace",
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
      style={{
        padding: "8px 16px 8px 14px",
        background: "#0a0a0a",
        color: "#ffffff",
        borderRadius: 8,
        fontFamily: "ui-monospace, SF Mono, monospace",
        fontSize: 10,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: 10,
        minWidth: 200,
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
        }}
      />
      {d.label}
    </div>
  );
}

function TxRowNode({ data }: NodeProps) {
  const d = data as unknown as {
    tx: string;
    agent: string;
    active?: boolean;
  };
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "82px 64px 60px 12px",
        gap: 8,
        alignItems: "center",
        padding: "6px 10px",
        background: d.active ? "#5b3df0" : "#ffffff",
        color: d.active ? "#ffffff" : "#0a0a0a",
        border: `1.4px solid ${d.active ? "#5b3df0" : "#e8e8e8"}`,
        borderRadius: 6,
        fontFamily: "ui-monospace, SF Mono, monospace",
        fontSize: 9.5,
        minWidth: 240,
      }}
    >
      <Handle type="target" position={Position.Top} style={hidden} />
      <span style={{ opacity: d.active ? 1 : 0.7 }}>{d.tx}</span>
      <span>{d.agent}</span>
      <span style={{ opacity: 0.85 }}>ATTEST</span>
      <span
        style={{
          width: 10,
          height: 6,
          background: d.active ? "#ffffff" : "#0a0a0a",
          borderRadius: 2,
        }}
      />
    </div>
  );
}

const hidden = { background: "transparent", border: "none" } as const;

const nodeTypes = {
  pill: PillNode,
  circle: CircleNode,
  file: FileNode,
  registry: RegistryHeaderNode,
  txrow: TxRowNode,
};

// ───────────────────────────────────────────────────────────
//  Frame wrapper — locks down all interaction
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
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          preventScrolling={false}
        >
          <Background gap={16} size={1} color="#dcdcdc" />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
//  1. Vault state diagram — ATMA + 4 RWA satellites
// ───────────────────────────────────────────────────────────

export function VaultStateDiagram() {
  const nodes = useMemo<Node[]>(
    () => [
      { id: "atma",  type: "pill", position: { x: 150, y: 100 }, data: { label: "ATMA",  tone: "violet" }, draggable: false, selectable: false },
      { id: "usdy",  type: "pill", position: { x: 0,    y: 40  }, data: { label: "USDY",  tone: "violet" }, draggable: false, selectable: false },
      { id: "musd",  type: "pill", position: { x: 300,  y: 40  }, data: { label: "mUSD",  tone: "lime"   }, draggable: false, selectable: false },
      { id: "aave",  type: "pill", position: { x: 0,    y: 160 }, data: { label: "AAVE",  tone: "amber"  }, draggable: false, selectable: false },
      { id: "mi4",   type: "pill", position: { x: 300,  y: 160 }, data: { label: "MI4",   tone: "pink"   }, draggable: false, selectable: false },
    ],
    [],
  );
  const edges = useMemo<Edge[]>(
    () => [
      { id: "e-usdy", source: "usdy", target: "atma", ...solidEdge() },
      { id: "e-musd", source: "musd", target: "atma", ...solidEdge() },
      { id: "e-aave", source: "aave", target: "atma", ...solidEdge() },
      { id: "e-mi4",  source: "mi4",  target: "atma", ...solidEdge() },
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
      { id: "alloc",  type: "circle", position: { x: 30,  y: 40  }, data: { label: "ALLOC" }, draggable: false, selectable: false },
      { id: "risk",   type: "circle", position: { x: 170, y: 0   }, data: { label: "RISK"  }, draggable: false, selectable: false },
      { id: "rprt",   type: "circle", position: { x: 310, y: 40  }, data: { label: "RPRT"  }, draggable: false, selectable: false },
      { id: "skills", type: "pill",   position: { x: 156, y: 170 }, data: { label: "SKILLS", tone: "violet" }, draggable: false, selectable: false },
    ],
    [],
  );
  const edges = useMemo<Edge[]>(
    () => [
      { id: "e-alloc",  source: "alloc",  target: "skills", ...solidEdge() },
      { id: "e-risk",   source: "risk",   target: "skills", ...solidEdge() },
      { id: "e-rprt",   source: "rprt",   target: "skills", ...solidEdge() },
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
      { id: "file",   type: "file",  position: { x: 20,  y: 70 }, data: { label: "SKILL.md" }, draggable: false, selectable: false },
      { id: "claude", type: "pill",  position: { x: 240, y: 100 }, data: { label: "CLAUDE", sub: "reasons", tone: "violet" }, draggable: false, selectable: false },
    ],
    [],
  );
  const edges = useMemo<Edge[]>(
    () => [
      { id: "e-flow", source: "file", target: "claude", ...solidEdge() },
    ],
    [],
  );
  return <Frame nodes={nodes} edges={edges} />;
}

// ───────────────────────────────────────────────────────────
//  4. Attestation diagram — registry header + tx rows
// ───────────────────────────────────────────────────────────

export function AttestationDiagram() {
  const nodes = useMemo<Node[]>(
    () => [
      { id: "reg",  type: "registry", position: { x: 0, y: 0 }, data: { label: "ERC-8004 reputation registry" }, draggable: false, selectable: false },
      { id: "tx1", type: "txrow", position: { x: 0, y: 50  }, data: { tx: "0x4f8a…",  agent: "ALLOC#1" }, draggable: false, selectable: false },
      { id: "tx2", type: "txrow", position: { x: 0, y: 86  }, data: { tx: "0x59a5…",  agent: "ALLOC#2", active: true }, draggable: false, selectable: false },
      { id: "tx3", type: "txrow", position: { x: 0, y: 122 }, data: { tx: "0x63c0…",  agent: "ALLOC#3" }, draggable: false, selectable: false },
      { id: "tx4", type: "txrow", position: { x: 0, y: 158 }, data: { tx: "0x6ddb…",  agent: "ALLOC#4" }, draggable: false, selectable: false },
      { id: "tx5", type: "txrow", position: { x: 0, y: 194 }, data: { tx: "0x77f6…",  agent: "ALLOC#5" }, draggable: false, selectable: false },
    ],
    [],
  );
  return <Frame nodes={nodes} edges={[]} height={240} />;
}
