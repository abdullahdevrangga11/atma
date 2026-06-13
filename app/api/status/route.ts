import { NextResponse } from "next/server";
import { runStore } from "@/lib/store/runStore";
import { currentProvider } from "@/lib/agents/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/status — public health + activity snapshot.
 *
 * Designed for judges, sponsors, and uptime monitors to verify the deploy is
 * alive and producing real orchestrations. Cheaper than /api/runs (no list
 * payload) and includes provider + cost info so the cost meter on the landing
 * page has a single source of truth.
 */

const BOOT_AT = Date.now();

export async function GET() {
  const [agg, recentRuns, total] = await Promise.all([
    runStore.aggregate(),
    runStore.list(50),
    runStore.size(),
  ]);
  const latest = agg?.latest;

  const totalCostCents = recentRuns.reduce(
    (acc, r) => acc + (r.totalCostCents ?? 0),
    0,
  );

  return NextResponse.json({
    data: {
      status: "ok",
      version: "1.0.0",
      uptimeSec: Math.floor((Date.now() - BOOT_AT) / 1000),
      llm: currentProvider(),
      runs: {
        total,
        attestations: agg?.totalAttestations ?? 0,
        totalCostCents: Number(totalCostCents.toFixed(4)),
        latest: latest
          ? {
              id: latest.id,
              startedAt: latest.startedAt,
              finishedAt: latest.finishedAt,
              actualAPYBps: latest.report.actualAPYBps,
              outperformanceBps: latest.report.outperformanceBps,
              costCents: latest.totalCostCents ?? null,
            }
          : null,
      },
    },
    error: null,
  });
}
