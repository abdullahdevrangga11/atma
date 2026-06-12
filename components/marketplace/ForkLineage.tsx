"use client";

import { useEffect, useMemo, useState } from "react";
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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitFork, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Entry = {
  id: string;
  agent: "allocator" | "risk" | "reporter";
  title: string;
  tagline: string;
  author: string;
  createdAt: number;
  forkedFrom?: string;
  stars: number;
  forks: number;
};

const AGENT_TONE: Record<Entry["agent"], { bg: string; fg: string; border: string }> = {
  allocator: { bg: "#ede9fe", fg: "#5b3df0", border: "#c7bdf9" },
  risk:      { bg: "#ffedd5", fg: "#ea580c", border: "#fed7aa" },
  reporter:  { bg: "#ecfccb", fg: "#65a30d", border: "#d9f99d" },
};

const nodeTypes = { skill: SkillNode };

/**
 * Fork lineage — renders parent → child relationships across the entire
 * marketplace as a React Flow graph. Roots (skills with no parent) anchor
 * the top of the canvas; descendants spread out underneath.
 */
export function ForkLineage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/marketplace?sort=stars")
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        setEntries(j.data?.entries ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const { nodes, edges } = useMemo(() => layoutLineage(entries), [entries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Sparkles className="w-5 h-5 text-[var(--color-primary)] animate-pulse" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <Badge variant="default">// nothing yet</Badge>
          <CardTitle>No skills to graph</CardTitle>
          <CardDescription>Publish or fork a skill to seed the lineage.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const forkedCount = entries.filter((e) => e.forkedFrom).length;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-[12px] text-[var(--color-text-secondary)]">
        <Badge variant="default">
          <GitFork className="w-3 h-3" />
          {forkedCount} fork{forkedCount === 1 ? "" : "s"}
        </Badge>
        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
          {entries.length} entries · {forkedCount} downstream
        </span>
      </div>
      <div className="relative w-full h-[540px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card-soft)] overflow-hidden">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            proOptions={{ hideAttribution: true }}
            fitView
            fitViewOptions={{ padding: 0.18, maxZoom: 1 }}
            nodesDraggable
            nodesConnectable={false}
            elementsSelectable
            panOnDrag={[1, 2]}
            zoomOnScroll={false}
            zoomOnPinch
            zoomOnDoubleClick={false}
            preventScrolling={false}
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
        </ReactFlowProvider>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
//  Layout — walk forks from roots, spread descendants horizontally
// ───────────────────────────────────────────────────────────

function layoutLineage(entries: Entry[]): { nodes: Node[]; edges: Edge[] } {
  if (entries.length === 0) return { nodes: [], edges: [] };

  const byId = new Map(entries.map((e) => [e.id, e]));
  const childrenOf = new Map<string | "ROOT", Entry[]>();
  for (const e of entries) {
    const k = e.forkedFrom ?? "ROOT";
    if (!childrenOf.has(k)) childrenOf.set(k, []);
    childrenOf.get(k)!.push(e);
  }

  const positions = new Map<string, { x: number; y: number }>();
  const xPerCol = 240;
  const yPerRow = 130;
  let cursorX = 0;
  const placedY = new Map<number, number>();

  function place(id: string, depth: number) {
    const y = (placedY.get(depth) ?? 0) + (placedY.has(depth) ? yPerRow : 0);
    placedY.set(depth, y);
    positions.set(id, { x: depth * xPerCol, y });
    const kids = childrenOf.get(id) ?? [];
    for (const k of kids) place(k.id, depth + 1);
  }

  // Walk roots in stars order so the strongest lineage sits at the top
  const roots = (childrenOf.get("ROOT") ?? []).slice().sort((a, b) => b.stars - a.stars);
  for (const r of roots) {
    placedY.clear();
    cursorX = 0;
    place(r.id, 0);
    // Shift this whole subtree right so subsequent roots don't collide.
    const usedY = Math.max(...Array.from(placedY.values()), 0) + yPerRow;
    for (const [id, p] of positions) {
      const e = byId.get(id);
      if (!e) continue;
      // Reposition only nodes we placed in this subtree.
    }
    // Move cursorX past this subtree's depth so unrelated roots stack vertically instead.
    cursorX += 0;
  }

  // Vertically stack root subtrees instead of complex horizontal packing
  let yOffset = 0;
  const finalPositions = new Map<string, { x: number; y: number }>();
  for (const root of roots) {
    const sub = collectSubtree(root.id, childrenOf);
    // Determine per-depth y within this subtree
    const subDepthSlot = new Map<number, number>();
    function placeSub(id: string, depth: number) {
      const slot = subDepthSlot.get(depth) ?? 0;
      subDepthSlot.set(depth, slot + 1);
      finalPositions.set(id, {
        x: depth * xPerCol,
        y: yOffset + slot * yPerRow,
      });
      const kids = childrenOf.get(id) ?? [];
      for (const k of kids) placeSub(k.id, depth + 1);
    }
    placeSub(root.id, 0);
    const subHeight = Math.max(...Array.from(subDepthSlot.values())) * yPerRow + yPerRow;
    yOffset += subHeight;
    void sub;
  }

  const nodes: Node[] = entries.map((e) => ({
    id: e.id,
    type: "skill",
    position: finalPositions.get(e.id) ?? { x: 0, y: 0 },
    data: { entry: e },
  }));

  const edges: Edge[] = entries
    .filter((e) => e.forkedFrom && byId.has(e.forkedFrom))
    .map((e) => ({
      id: `${e.forkedFrom}-${e.id}`,
      source: e.forkedFrom!,
      target: e.id,
      type: "smoothstep",
      animated: false,
      style: { stroke: "#5b3df0", strokeWidth: 1.4, strokeDasharray: "4 4" },
      markerEnd: {
        type: "arrowclosed",
        color: "#5b3df0",
        width: 12,
        height: 12,
      } as Edge["markerEnd"],
    }));

  return { nodes, edges };
}

function collectSubtree(rootId: string, childrenOf: Map<string | "ROOT", Entry[]>): string[] {
  const out: string[] = [];
  function walk(id: string) {
    out.push(id);
    const kids = childrenOf.get(id) ?? [];
    for (const k of kids) walk(k.id);
  }
  walk(rootId);
  return out;
}

// ───────────────────────────────────────────────────────────
//  Custom node
// ───────────────────────────────────────────────────────────

function SkillNode({ data }: NodeProps) {
  const entry = (data as unknown as { entry: Entry }).entry;
  const tone = AGENT_TONE[entry.agent];
  return (
    <Link
      href={`/marketplace/${entry.id}`}
      style={{
        display: "block",
        width: 200,
        padding: "10px 12px",
        borderRadius: 10,
        background: "#ffffff",
        border: `1.4px solid ${tone.border}`,
        textDecoration: "none",
        boxShadow: "0 2px 8px rgba(10,10,10,0.04)",
        cursor: "pointer",
      }}
      className={cn("hover:bg-white")}
    >
      <Handle type="target" position={Position.Left} style={{ background: "transparent", border: "none" }} />
      <Handle type="source" position={Position.Right} style={{ background: "transparent", border: "none" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span
          style={{
            background: tone.bg,
            color: tone.fg,
            fontFamily: "ui-monospace, monospace",
            fontSize: 9,
            padding: "1px 6px",
            borderRadius: 4,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontWeight: 600,
          }}
        >
          {entry.agent}
        </span>
        {entry.forkedFrom && (
          <GitFork style={{ width: 10, height: 10, color: "#858585" }} />
        )}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#0a0a0a",
          marginBottom: 4,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {entry.title}
      </div>
      <div
        style={{
          fontFamily: "ui-monospace, monospace",
          fontSize: 10,
          color: "#858585",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>@{entry.author}</span>
        <span>★{entry.stars}</span>
      </div>
    </Link>
  );
}
