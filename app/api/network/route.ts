import { NextResponse } from "next/server";
import { runStore } from "@/lib/store/runStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/network
 *
 * Network-wide stats rolled up from every run in the in-memory store.
 * Powers /network.
 */
export async function GET() {
  const runs = await runStore.list(50);
  if (runs.length === 0) {
    return NextResponse.json({
      data: {
        totalRuns: 0,
        totalAttestations: 0,
        totalCostCents: 0,
        totalDurationMs: 0,
        defensiveExits: 0,
        debateAttempts: 0,
        avgOutperformanceBps: 0,
        firstRunAt: null,
        latestRunAt: null,
        agentBreakdown: [],
        timeline: [],
      },
      error: null,
    });
  }

  let totalCost = 0;
  let totalDuration = 0;
  let defensiveExits = 0;
  let debateAttempts = 0;
  let outperformanceSum = 0;
  const perAgent: Record<string, { count: number; totalMs: number }> = {};

  for (const r of runs) {
    totalCost += r.totalCostCents ?? 0;
    totalDuration += r.finishedAt - r.startedAt;
    if (r.risk.level === "trigger") defensiveExits += 1;
    debateAttempts += r.debate?.length ?? 0;
    outperformanceSum += r.report.outperformanceBps.vsDoNothing;
    for (const s of r.steps) {
      const k = s.agent;
      if (!perAgent[k]) perAgent[k] = { count: 0, totalMs: 0 };
      perAgent[k].count += 1;
      perAgent[k].totalMs += s.durationMs;
    }
  }

  const agentBreakdown = Object.entries(perAgent).map(([agent, v]) => ({
    agent,
    count: v.count,
    avgDurationMs: Math.round(v.totalMs / v.count),
  }));

  // Timeline: latest 20 runs, oldest first, with outperformance bps
  const timeline = [...runs]
    .reverse()
    .slice(-20)
    .map((r) => ({
      id: r.id,
      at: r.startedAt,
      outperformanceBps: r.report.outperformanceBps.vsDoNothing,
      riskLevel: r.risk.level,
      hadDebate: !!r.debate,
    }));

  return NextResponse.json({
    data: {
      totalRuns: runs.length,
      totalAttestations: runs.reduce((a, r) => a + r.steps.length, 0),
      totalCostCents: Math.round(totalCost * 100) / 100,
      totalDurationMs: totalDuration,
      defensiveExits,
      debateAttempts,
      avgOutperformanceBps: Math.round(outperformanceSum / runs.length),
      firstRunAt: Math.min(...runs.map((r) => r.startedAt)),
      latestRunAt: Math.max(...runs.map((r) => r.startedAt)),
      agentBreakdown,
      timeline,
    },
    error: null,
  });
}
