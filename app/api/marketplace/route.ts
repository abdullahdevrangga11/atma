import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { marketplaceStore } from "@/lib/store/marketplaceStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/marketplace?agent=allocator&sort=stars
 *   Returns the marketplace listing. Optional filter by agent and
 *   sort by stars / forks / new.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const agent = sp.get("agent") as "allocator" | "risk" | "reporter" | null;
  const sort = (sp.get("sort") ?? "stars") as "new" | "stars" | "forks";
  return NextResponse.json({
    data: {
      entries: marketplaceStore.list({
        agent: agent ?? undefined,
        sort,
      }),
      total: marketplaceStore.count(),
    },
    error: null,
  });
}

const PublishBody = z.object({
  agent: z.enum(["allocator", "risk", "reporter"]),
  title: z.string().min(3).max(80),
  tagline: z.string().min(8).max(140),
  body: z.string().min(40).max(20_000),
  author: z.string().min(2).max(40),
  forkedFrom: z.string().optional(),
});

/**
 * POST /api/marketplace
 *   Publish a new skill entry.
 */
export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ data: null, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = PublishBody.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: "Schema invalid", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const entry = marketplaceStore.publish(parsed.data);
  return NextResponse.json({ data: entry, error: null });
}
