import { NextResponse } from "next/server";
import { readFeeds } from "@/lib/data/feeds";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/feeds
 *
 * Returns the current synthetic feed snapshot — live APYs, raw oracle
 * prices, and risk-signal levels. Drifts each minute. Public read.
 */
export async function GET() {
  return NextResponse.json({ data: readFeeds(), error: null });
}
