import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { marketplaceStore } from "@/lib/store/marketplaceStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({ author: z.string().min(2).max(40) });

/** POST /api/marketplace/[id]/fork — create a derivative entry, bump parent's fork count. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ data: null, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: "Author required" }, { status: 400 });
  }
  const forked = marketplaceStore.fork(id, parsed.data.author);
  if (!forked) {
    return NextResponse.json({ data: null, error: "Parent not found" }, { status: 404 });
  }
  return NextResponse.json({ data: forked, error: null });
}
