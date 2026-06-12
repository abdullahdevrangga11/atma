"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Activity,
  Coins,
  ShieldCheck,
  AlertTriangle,
  Cpu,
  Zap,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { downloadJSON, downloadCSV } from "@/lib/utils/download";

type Stats = {
  totalRuns: number;
  totalAttestations: number;
  totalCostCents: number;
  totalDurationMs: number;
  defensiveExits: number;
  debateAttempts: number;
  avgOutperformanceBps: number;
  firstRunAt: number | null;
  latestRunAt: number | null;
  agentBreakdown: Array<{ agent: string; count: number; avgDurationMs: number }>;
  timeline: Array<{
    id: string;
    at: number;
    outperformanceBps: number;
    riskLevel: "ok" | "warn" | "trigger";
    hadDebate: boolean;
  }>;
};

const AGENT_COLOR: Record<string, string> = {
  AllocatorAgent: "#a78bfa",
  RiskAgent: "#fbbf24",
  ReporterAgent: "#84cc16",
};

export function NetworkDashboard() {
  const [data, setData] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const fetchData = () =>
      fetch("/api/network")
        .then((r) => r.json())
        .then((j) => {
          if (alive) {
            setData(j.data);
            setLoading(false);
          }
        })
        .catch(() => setLoading(false));
    fetchData();
    const id = window.setInterval(fetchData, 5_000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Sparkles className="w-5 h-5 text-[var(--color-primary)] animate-pulse" />
      </div>
    );
  }

  if (!data || data.totalRuns === 0) {
    return (
      <Card>
        <CardHeader>
          <Badge variant="default">// no runs yet</Badge>
          <CardTitle>Empty network</CardTitle>
          <CardDescription>
            Trigger a run on <Link href="/vault" className="underline">/vault</Link> or fire a
            backtest — this dashboard fills in within seconds.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const defExitRate = (data.defensiveExits / data.totalRuns) * 100;

  const snapshot = data; // narrow for the closures below
  function exportJSON() {
    downloadJSON(snapshot, `amana-network-${Date.now()}.json`);
  }
  function exportCSV() {
    downloadCSV(
      snapshot.timeline.map((t) => ({
        runId: t.id,
        at: new Date(t.at).toISOString(),
        outperformanceBps: t.outperformanceBps,
        riskLevel: t.riskLevel,
        hadDebate: t.hadDebate ? 1 : 0,
      })),
      `amana-network-timeline-${Date.now()}.csv`,
    );
  }

  return (
    <div className="space-y-6">
      {/* Export bar */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="w-3 h-3" />
          CSV
        </Button>
        <Button variant="outline" size="sm" onClick={exportJSON}>
          <Download className="w-3 h-3" />
          JSON
        </Button>
      </div>

      {/* Top stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Activity className="w-3.5 h-3.5" />}
          label="orchestration runs"
          value={data.totalRuns.toLocaleString()}
        />
        <StatCard
          icon={<ShieldCheck className="w-3.5 h-3.5" />}
          label="reputation events"
          value={data.totalAttestations.toLocaleString()}
        />
        <StatCard
          icon={<Coins className="w-3.5 h-3.5" />}
          label="total claude cost"
          value={`$${(data.totalCostCents / 100).toFixed(4)}`}
          primary
        />
        <StatCard
          icon={<Zap className="w-3.5 h-3.5" />}
          label="avg outperformance"
          value={`${data.avgOutperformanceBps >= 0 ? "+" : ""}${data.avgOutperformanceBps} bps`}
          primary={data.avgOutperformanceBps > 0}
        />
      </div>

      {/* Second strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<AlertTriangle className="w-3.5 h-3.5" />}
          label="defensive exits"
          value={`${data.defensiveExits} · ${defExitRate.toFixed(1)}%`}
        />
        <StatCard
          icon={<AlertTriangle className="w-3.5 h-3.5" />}
          label="debate retries"
          value={String(data.debateAttempts)}
        />
        <StatCard
          icon={<Cpu className="w-3.5 h-3.5" />}
          label="total agent time"
          value={`${(data.totalDurationMs / 1000).toFixed(1)}s`}
        />
        <StatCard
          icon={<Sparkles className="w-3.5 h-3.5" />}
          label="latest run"
          value={data.latestRunAt ? relative(data.latestRunAt) : "—"}
        />
      </div>

      {/* Outperformance timeline */}
      <Card>
        <CardHeader>
          <Badge variant="default">// outperformance per run</Badge>
          <CardTitle>{data.timeline.length} most recent runs</CardTitle>
          <CardDescription>
            Each bar is one orchestration. Height = outperformance bps vs do-nothing. Reddish bars
            had a defensive exit. Bordered bars survived a debate veto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TimelineChart timeline={data.timeline} />
        </CardContent>
      </Card>

      {/* Agent breakdown */}
      <Card>
        <CardHeader>
          <Badge variant="default">// agent call distribution</Badge>
          <CardTitle>{data.agentBreakdown.reduce((a, b) => a + b.count, 0)} agent calls</CardTitle>
          <CardDescription>
            Including debate retries. RiskAgent fires more than Allocator + Reporter combined when
            vetoes occur.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {data.agentBreakdown.map((a) => {
              const slug = a.agent === "AllocatorAgent" ? "allocator" : a.agent === "RiskAgent" ? "risk" : "reporter";
              return (
                <Link
                  key={a.agent}
                  href={`/agents/${slug}`}
                  className="rounded-lg p-4 border border-[var(--color-border)] bg-[var(--color-bg-card-soft)] hover:bg-white transition-colors"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="block w-2 h-2 rounded-[1px]"
                      style={{ background: AGENT_COLOR[a.agent] }}
                    />
                    <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
                      {a.agent}
                    </span>
                  </div>
                  <p className="text-[28px] font-medium tabular-nums">{a.count}</p>
                  <p className="text-[11px] font-mono text-[var(--color-text-muted)]">
                    avg {a.avgDurationMs}ms
                  </p>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
//  Sub-components
// ───────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, primary,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  primary?: boolean;
}) {
  return (
    <div className="rounded-lg p-4 border border-[var(--color-border)] bg-[var(--color-bg-card-soft)]">
      <div className="flex items-center gap-2 mb-2 text-[var(--color-text-muted)]">
        {icon}
        <span className="font-mono text-[10px] uppercase tracking-[0.06em]">{label}</span>
      </div>
      <p className={cn("text-[22px] font-medium tabular-nums", primary && "text-[var(--color-primary)]")}>{value}</p>
    </div>
  );
}

function TimelineChart({ timeline }: { timeline: Stats["timeline"] }) {
  if (timeline.length === 0) {
    return (
      <p className="text-[12px] text-[var(--color-text-muted)]">No runs yet.</p>
    );
  }
  const W = 880;
  const H = 220;
  const margin = { top: 20, right: 20, bottom: 30, left: 50 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;
  const max = Math.max(...timeline.map((t) => Math.abs(t.outperformanceBps)), 100);
  const yScale = (v: number) => margin.top + innerH / 2 - (v / max) * (innerH / 2);
  const barW = Math.max(8, innerW / timeline.length - 6);
  return (
    <div className="relative w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto min-w-[600px]">
        {/* Center axis */}
        <line
          x1={margin.left}
          x2={W - margin.right}
          y1={margin.top + innerH / 2}
          y2={margin.top + innerH / 2}
          stroke="#e8e8e8"
        />
        <text x={margin.left - 8} y={margin.top + innerH / 2 + 4} textAnchor="end" fontSize="10" fontFamily="ui-monospace, monospace" fill="#858585">
          0 bps
        </text>
        <text x={margin.left - 8} y={margin.top + 4} textAnchor="end" fontSize="10" fontFamily="ui-monospace, monospace" fill="#858585">
          +{max}
        </text>
        <text x={margin.left - 8} y={margin.top + innerH + 4} textAnchor="end" fontSize="10" fontFamily="ui-monospace, monospace" fill="#858585">
          −{max}
        </text>

        {timeline.map((t, i) => {
          const x = margin.left + i * (innerW / timeline.length);
          const isExit = t.riskLevel === "trigger";
          const isWarn = t.riskLevel === "warn";
          const fill = isExit ? "#fca5a5" : isWarn ? "#fcd34d" : "#613BF9";
          const yTop = t.outperformanceBps >= 0 ? yScale(t.outperformanceBps) : margin.top + innerH / 2;
          const h = Math.abs(yScale(t.outperformanceBps) - (margin.top + innerH / 2));
          return (
            <a key={t.id} href={`/runs/${t.id}`}>
              <rect
                x={x + 3}
                y={yTop}
                width={barW}
                height={Math.max(2, h)}
                fill={fill}
                stroke={t.hadDebate ? "#ea580c" : "none"}
                strokeWidth={t.hadDebate ? 1.6 : 0}
              />
              <title>
                run {t.id} · +{t.outperformanceBps} bps · {t.riskLevel}
                {t.hadDebate ? " · debate" : ""}
              </title>
            </a>
          );
        })}
      </svg>
    </div>
  );
}

function relative(at: number): string {
  const diff = Date.now() - at;
  const s = Math.round(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return `${h}h ago`;
}
