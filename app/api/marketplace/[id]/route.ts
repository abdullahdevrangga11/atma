import { NextRequest, NextResponse } from "next/server";
import { marketplaceStore } from "@/lib/store/marketplaceStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const entry = marketplaceStore.get(id);
  if (!entry) {
    return NextResponse.json({ data: null, error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ data: entry, error: null });
}
