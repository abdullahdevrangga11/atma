import { NextRequest, NextResponse } from "next/server";
import { runStore } from "@/lib/store/runStore";
import { AGENT_BY_SLUG } from "@/lib/agents/identity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/agent-stats/[slug]
 *
 * Per-agent stats sliced from the in-memory run store. Powers the agent
 * profile page — decisions feed, avg duration, total reputation events, etc.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const identity = AGENT_BY_SLUG[slug];
  if (!identity) {
    return NextResponse.json({ data: null, error: "Unknown agent" }, { status: 404 });
  }
  const agentName = identity.name;
  const runs = runStore.list(50);

  const decisions = runs.flatMap((r) => {
    const stepIdx = r.steps.findIndex((s) => s.agent === agentName);
    if (stepIdx === -1) return [];
    const step = r.steps[stepIdx];
    let label = "REPORT";
    let summary = "";
    if (agentName === "AllocatorAgent") {
      label = "ALLOCATE";
      const w = r.proposal.weights;
      summary = `USDY ${(w.usdyBps / 100).toFixed(0)}% · mUSD ${(w.mUsdBps / 100).toFixed(0)}% · Aave ${(w.aaveBps / 100).toFixed(0)}% · MI4 ${(w.mi4Bps / 100).toFixed(0)}%`;
    } else if (agentName === "RiskAgent") {
      label = r.risk.level === "ok" ? "REPORT" : r.risk.level === "warn" ? "WARN" : "DEFENSIVE_EXIT";
      summary = `level=${r.risk.level} · ${r.risk.signal}`;
    } else {
      label = "REPORT";
      summary = `+${r.report.actualAPYBps} bps actual · +${r.report.outperformanceBps.vsDoNothing} vs do-nothing`;
    }
    return [
      {
        runId: r.id,
        at: step.startedAt,
        durationMs: step.durationMs,
        reasoningHash: step.reasoningHash,
        label,
        summary,
      },
    ];
  });

  const durations = decisions.map((d) => d.durationMs);
  const avgMs = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;
  const fastestMs = durations.length ? Math.min(...durations) : 0;
  const slowestMs = durations.length ? Math.max(...durations) : 0;

  return NextResponse.json({
    data: {
      identity,
      stats: {
        totalDecisions: decisions.length,
        avgDurationMs: avgMs,
        fastestMs,
        slowestMs,
        firstDecisionAt: decisions.length ? Math.min(...decisions.map((d) => d.at)) : null,
        latestDecisionAt: decisions.length ? Math.max(...decisions.map((d) => d.at)) : null,
      },
      decisions,
    },
    error: null,
  });
}
