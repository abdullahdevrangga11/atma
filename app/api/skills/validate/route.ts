import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { lintSkill, summarise } from "@/lib/skills/linter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  agent: z.enum(["allocator", "risk", "reporter"]),
  body: z.string().min(1).max(40_000),
});

/**
 * POST /api/skills/validate
 *   { agent, body } → { issues, summary }
 *
 * Pure synchronous linter — no Claude call, runs in ~1ms. Used by the
 * /skills playground inline + can be hit by external CI to gate skill
 * PRs before merge.
 */
export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ data: null, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: "Schema invalid", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const issues = lintSkill(parsed.data.body, parsed.data.agent);
  return NextResponse.json({
    data: { issues, summary: summarise(issues) },
    error: null,
  });
}
