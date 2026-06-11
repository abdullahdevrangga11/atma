"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, FileText, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// Demo data — would come from /api/agent in production
const REPORT = {
  period: "week-of-2026-06-15",
  actualAPYBps: 463,
  baselines: {
    doNothing: 0,
    usdcAaveOnly: 416,
    usdyOnly: 442,
  },
  reasoning:
    "This week ATMA outperformed 'do nothing' by 463 bps annualized. Versus 'USDC Aave only' baseline, ATMA outperformed by 47 bps thanks to mUSD's 0.18% boost via rebasing. No defensive exits triggered. Risk Agent emitted 6 'warn' heartbeats on Aave oracle deviation (Tuesday 2pm UTC, ~85 minute duration) but reverted to 'ok' without action. All 3 agent identities active. Next snapshot: Sunday 00:00 UTC.",
};

const ATTESTATIONS = [
  { id: 1, agentId: 1001, agentName: "Allocator#1", eventType: "ALLOCATE", txHash: "0x4f8a…b9c2", time: "2026-06-15T09:14:22Z", reasoning: "Balanced tolerance · USDY 34.08% / mUSD 30% / Aave 35.92%" },
  { id: 2, agentId: 2002, agentName: "Risk#2",      eventType: "REPORT",   txHash: "0x9c3d…e7a1", time: "2026-06-15T09:14:38Z", reasoning: "All signals OK · heartbeat" },
  { id: 3, agentId: 2002, agentName: "Risk#2",      eventType: "WARN",     txHash: "0x2b1e…c5f4", time: "2026-06-16T14:02:09Z", reasoning: "Aave oracle 0.58% deviation · monitoring" },
  { id: 4, agentId: 2002, agentName: "Risk#2",      eventType: "REPORT",   txHash: "0xa7c4…d8b3", time: "2026-06-16T15:27:31Z", reasoning: "Oracle returned to band · WARN cleared" },
  { id: 5, agentId: 3003, agentName: "Reporter#3",  eventType: "REPORT",   txHash: "0x1c8e…f019", time: "2026-06-22T00:00:14Z", reasoning: "Weekly snapshot · +463 bps vs do-nothing" },
];

export function ReportsDashboard() {
  const out = REPORT.actualAPYBps - REPORT.baselines.doNothing;
  return (
    <div className="space-y-8">
      {/* Headline metric */}
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="default">// week of 2026-06-15</Badge>
            <Badge variant="success">
              <TrendingUp className="w-3 h-3" />
              live
            </Badge>
          </div>
          <CardTitle>+{out} bps annualized vs do-nothing</CardTitle>
          <CardDescription>
            Actual {(REPORT.actualAPYBps / 100).toFixed(2)}% APY against three baselines. All
            outperformance figures attested via ERC-8004 ReputationRegistry.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <BaselineCard
              label="vs do-nothing"
              baselineBps={REPORT.baselines.doNothing}
              actualBps={REPORT.actualAPYBps}
              accent
            />
            <BaselineCard
              label="vs USDC + Aave"
              baselineBps={REPORT.baselines.usdcAaveOnly}
              actualBps={REPORT.actualAPYBps}
            />
            <BaselineCard
              label="vs USDY only"
              baselineBps={REPORT.baselines.usdyOnly}
              actualBps={REPORT.actualAPYBps}
            />
          </div>
        </CardContent>
      </Card>

      {/* Agent reasoning summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="default">// reporter agent reasoning</Badge>
            <Button variant="outline" size="sm">
              <Download className="w-3 h-3" />
              Export CSV
            </Button>
          </div>
          <CardTitle>Weekly digest</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg p-5 bg-[var(--color-bg-invert)] border border-[var(--color-bg-invert-soft)]">
            <p className="text-[14px] leading-relaxed text-[var(--color-text-on-invert)]">
              {REPORT.reasoning}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Attestation feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="default">// erc-8004 attestation feed</Badge>
            <Badge variant="outline">
              <FileText className="w-3 h-3" />
              5 events
            </Badge>
          </div>
          <CardTitle>On-chain reputation events</CardTitle>
          <CardDescription>
            Every decision is signed by an agent identity and emitted as a
            ReputationEvent. Anyone can query the full trace via Mantle Explorer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
            <div className="grid grid-cols-[60px_1.4fr_1.2fr_1fr_2.5fr] bg-[var(--color-bg-soft)] px-5 py-3 text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] font-mono">
              <span>#</span>
              <span>agent</span>
              <span>event</span>
              <span>tx</span>
              <span>reasoning</span>
            </div>
            {ATTESTATIONS.map((a, i) => (
              <div
                key={a.id}
                className={cn(
                  "grid grid-cols-[60px_1.4fr_1.2fr_1fr_2.5fr] px-5 py-4 items-center text-[12px] hover:bg-[var(--color-bg-soft)] transition-colors",
                  i < ATTESTATIONS.length - 1 && "border-b border-[var(--color-border)]",
                )}
              >
                <span className="font-mono text-[var(--color-text-faint)] tabular-nums">
                  {String(a.id).padStart(2, "0")}
                </span>
                <span className="flex items-center gap-2">
                  <span
                    className="block w-2 h-2 rounded-full"
                    style={{
                      background:
                        a.agentName.startsWith("Allocator")
                          ? "#a78bfa"
                          : a.agentName.startsWith("Risk")
                            ? "#fbbf24"
                            : "#84cc16",
                    }}
                  />
                  <span className="font-mono text-[var(--color-text)]">{a.agentName}</span>
                </span>
                <span>
                  <Badge variant={a.eventType === "WARN" ? "warning" : a.eventType === "ALLOCATE" ? "accent" : "default"}>
                    {a.eventType}
                  </Badge>
                </span>
                <a
                  href={`https://sepolia.mantlescan.xyz/tx/${a.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[var(--color-primary)] hover:underline truncate"
                >
                  {a.txHash}
                </a>
                <span className="text-[var(--color-text-secondary)] truncate">{a.reasoning}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-text-faint)]">
              // showing 5 of 12 events this week
            </p>
            <Button variant="link" size="sm">
              View all on Explorer
              <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BaselineCard({
  label,
  baselineBps,
  actualBps,
  accent,
}: {
  label: string;
  baselineBps: number;
  actualBps: number;
  accent?: boolean;
}) {
  const delta = actualBps - baselineBps;
  return (
    <div className="rounded-lg p-5 border border-[var(--color-border)] bg-[var(--color-bg-card-soft)]">
      <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-3">
        {label}
      </p>
      <div className="flex items-baseline gap-2 mb-2">
        <p
          className={cn(
            "text-[28px] font-medium tabular-nums leading-none",
            accent ? "text-[var(--color-primary)]" : "text-[var(--color-text)]",
          )}
        >
          {delta > 0 ? "+" : ""}
          {delta} bps
        </p>
      </div>
      <p className="text-[11px] font-mono text-[var(--color-text-muted)] tabular-nums">
        actual {(actualBps / 100).toFixed(2)}% · baseline {(baselineBps / 100).toFixed(2)}%
      </p>
    </div>
  );
}
