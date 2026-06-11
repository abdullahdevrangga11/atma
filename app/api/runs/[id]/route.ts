import { NextRequest, NextResponse } from "next/server";
import { runStore } from "@/lib/store/runStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/runs/[id]
 *
 * Single-run lookup for the permalink page.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const run = runStore.get(id);
  if (!run) {
    return NextResponse.json(
      { data: null, error: "Run not found" },
      { status: 404 },
    );
  }
  return NextResponse.json({ data: run, error: null });
}
