"use client";

import { useMemo } from "react";
import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";

/**
 * Architecture flow rendered with React Flow.
 *
 * Nodes are typed PipelineNode components so we keep full control of the
 * visual identity (tone-mapped fills, sub-labels, click-through links). Edges
 * use React Flow's built-in animated marker, with the main pipeline animated
 * and the veto path styled dashed orange.
 */

type Tone = "primary" | "warm" | "lime" | "neutral";

type PipelineData = {
  label: string;
  sub: string;
  tone: Tone;
  href: string;
};

const TONE_FG: Record<Tone, string> = {
  primary: "#613BF9",
  warm: "#ea580c",
  lime: "#65a30d",
  neutral: "#0a0a0a",
};
const TONE_BG: Record<Tone, string> = {
  primary: "#ede9fe",
  warm: "#ffedd5",
  lime: "#ecfccb",
  neutral: "#ffffff",
};
const TONE_BORDER: Record<Tone, string> = {
  primary: "#c7bdf9",
  warm: "#fed7aa",
  lime: "#d9f99d",
  neutral: "#e8e8e8",
};

const nodeTypes = { pipeline: PipelineNode };

const NODES_DATA: Array<{
  id: string;
  position: { x: number; y: number };
  data: PipelineData;
}> = [
  { id: "feeds",     position: { x: 0,   y: 80 },  data: { label: "Live Feeds",     sub: "/api/feeds",        tone: "neutral", href: "/api/feeds" } },
  { id: "allocator", position: { x: 180, y: 80 },  data: { label: "AllocatorAgent", sub: "skill.md → JSON",   tone: "primary", href: "/agents/allocator" } },
  { id: "risk",      position: { x: 360, y: 80 },  data: { label: "RiskAgent",      sub: "veto authority",    tone: "warm",    href: "/agents/risk" } },
  { id: "reporter",  position: { x: 540, y: 80 },  data: { label: "ReporterAgent",  sub: "signs the digest",  tone: "lime",    href: "/agents/reporter" } },
  { id: "attest",    position: { x: 720, y: 80 },  data: { label: "Attestation",    sub: "ERC-8004 event",    tone: "primary", href: "/runs" } },
  { id: "vault",     position: { x: 360, y: 200 }, data: { label: "AmanaVault",      sub: "11-state machine",  tone: "neutral", href: "/vault" } },
  { id: "reports",   position: { x: 720, y: 200 }, data: { label: "Reports",        sub: "history",           tone: "neutral", href: "/reports" } },
];

const EDGES_DATA: Edge[] = [
  // Main pipeline — animated violet
  { id: "e-feeds-allocator", source: "feeds", target: "allocator", animated: true,
    style: { stroke: "#613BF9", strokeWidth: 1.8 },
    markerEnd: { type: "arrowclosed", color: "#613BF9", width: 14, height: 14 } as Edge["markerEnd"] },
  { id: "e-allocator-risk", source: "allocator", target: "risk", animated: true,
    style: { stroke: "#613BF9", strokeWidth: 1.8 },
    markerEnd: { type: "arrowclosed", color: "#613BF9", width: 14, height: 14 } as Edge["markerEnd"] },
  { id: "e-risk-reporter", source: "risk", target: "reporter", animated: true,
    style: { stroke: "#613BF9", strokeWidth: 1.8 },
    markerEnd: { type: "arrowclosed", color: "#613BF9", width: 14, height: 14 } as Edge["markerEnd"] },
  { id: "e-reporter-attest", source: "reporter", target: "attest", animated: true,
    style: { stroke: "#613BF9", strokeWidth: 1.8 },
    markerEnd: { type: "arrowclosed", color: "#613BF9", width: 14, height: 14 } as Edge["markerEnd"] },

  // Side effects
  { id: "e-allocator-vault", source: "allocator", target: "vault", type: "smoothstep",
    style: { stroke: "#c7bdf9", strokeWidth: 1.2, strokeDasharray: "4 4" },
    markerEnd: { type: "arrowclosed", color: "#c7bdf9", width: 12, height: 12 } as Edge["markerEnd"] },
  { id: "e-attest-reports", source: "attest", target: "reports", type: "smoothstep",
    style: { stroke: "#c7bdf9", strokeWidth: 1.2, strokeDasharray: "4 4" },
    markerEnd: { type: "arrowclosed", color: "#c7bdf9", width: 12, height: 12 } as Edge["markerEnd"] },
  { id: "e-vault-reports", source: "vault", target: "reports", type: "smoothstep",
    style: { stroke: "#c7bdf9", strokeWidth: 1.2, strokeDasharray: "4 4" },
    markerEnd: { type: "arrowclosed", color: "#c7bdf9", width: 12, height: 12 } as Edge["markerEnd"] },

  // Veto path — orange dashed loop-back
  { id: "e-risk-allocator-veto", source: "risk", target: "allocator", type: "smoothstep",
    label: "veto",
    labelStyle: { fontFamily: "ui-monospace, monospace", fontSize: 10, fill: "#ea580c" },
    labelBgStyle: { fill: "#ffedd5" },
    labelBgPadding: [4, 8] as [number, number],
    labelBgBorderRadius: 4,
    style: { stroke: "#ea580c", strokeWidth: 1.6, strokeDasharray: "5 4" },
    markerEnd: { type: "arrowclosed", color: "#ea580c", width: 14, height: 14 } as Edge["markerEnd"] },
];

export function ArchitectureFlow() {
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

      <div className="relative w-full h-[380px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card-soft)] overflow-hidden">
        <ReactFlowProvider>
          <Inner />
        </ReactFlowProvider>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-mono">
        <LegendItem color="#613BF9" label="Main pipeline (animated)" />
        <LegendItem color="#ea580c" label="Veto / debate path" dashed />
        <LegendItem color="#c7bdf9" label="Side effects" dashed />
      </div>
    </div>
  );
}

function Inner() {
  const nodes: Node<PipelineData>[] = useMemo(
    () =>
      NODES_DATA.map((n) => ({
        ...n,
        type: "pipeline",
        draggable: false,
        selectable: false,
      })),
    [],
  );
  return (
    <ReactFlow
      nodes={nodes}
      edges={EDGES_DATA}
      nodeTypes={nodeTypes}
      proOptions={{ hideAttribution: true }}
      panOnDrag={false}
      zoomOnScroll={false}
      zoomOnPinch={false}
      panOnScroll={false}
      preventScrolling={false}
      fitView
      fitViewOptions={{ padding: 0.18, maxZoom: 1 }}
    >
      <Background gap={20} size={1} color="#e8e8e8" />
    </ReactFlow>
  );
}

function PipelineNode({ data }: NodeProps) {
  const d = data as unknown as PipelineData;
  return (
    <a
      href={d.href}
      style={{
        display: "block",
        width: 132,
        height: 64,
        borderRadius: 8,
        background: TONE_BG[d.tone],
        border: `1.4px solid ${TONE_BORDER[d.tone]}`,
        padding: "8px 12px",
        position: "relative",
        fontFamily: "ui-monospace, monospace",
        cursor: "pointer",
        textDecoration: "none",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: "transparent", border: "none" }} />
      <Handle type="source" position={Position.Right} style={{ background: "transparent", border: "none" }} />
      <Handle type="target" position={Position.Top} id="top" style={{ background: "transparent", border: "none" }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: "transparent", border: "none" }} />
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: TONE_FG[d.tone],
          marginBottom: 4,
        }}
      >
        {d.label}
      </div>
      <div style={{ fontSize: 10, color: "#858585" }}>{d.sub}</div>
    </a>
  );
}

function LegendItem({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className="block w-6 h-0.5 rounded"
        style={{
          background: dashed
            ? `repeating-linear-gradient(to right, ${color} 0 5px, transparent 5px 9px)`
            : color,
        }}
      />
      <span className="text-[var(--color-text-secondary)]">{label}</span>
    </span>
  );
}
