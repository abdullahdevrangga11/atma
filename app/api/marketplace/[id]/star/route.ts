import { NextRequest, NextResponse } from "next/server";
import { marketplaceStore } from "@/lib/store/marketplaceStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/marketplace/[id]/star — increment star count, return updated entry. */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const updated = marketplaceStore.star(id);
  if (!updated) {
    return NextResponse.json({ data: null, error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ data: updated, error: null });
}
