import { NextRequest, NextResponse } from "next/server";
import { runStore } from "@/lib/store/runStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/runs?limit=20
 *
 * Returns the most recent orchestration runs plus an aggregate summary
 * computed off the latest run. Used by /reports to render real attestation
 * history instead of static fixtures.
 */
export async function GET(req: NextRequest) {
  const limitRaw = req.nextUrl.searchParams.get("limit");
  const limit = limitRaw ? Math.min(50, Math.max(1, Number(limitRaw))) : 20;

  return NextResponse.json({
    data: {
      runs: runStore.list(limit),
      aggregate: runStore.aggregate(),
      total: runStore.size(),
    },
    error: null,
  });
}
