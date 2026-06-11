import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Orchestrator } from "@/lib/agents/Orchestrator";
import { UserPolicySchema } from "@/lib/agents/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BodySchema = z
  .object({
    policy: UserPolicySchema.optional(),
    targetAmountUsdc: z
      .string()
      .regex(/^\d+$/, "targetAmountUsdc must be a base-10 integer string")
      .optional(),
    entryNAV: z
      .string()
      .regex(/^\d+$/, "entryNAV must be a base-10 integer string")
      .optional(),
  })
  .strict();

let _orchestrator: Orchestrator | null = null;
function getOrchestrator() {
  return _orchestrator ?? (_orchestrator = new Orchestrator());
}

/**
 * POST /api/orchestrate
 *
 * Runs the full agent chain — Allocator → Risk → Reporter — and appends
 * the result to the in-memory run store. Returns the full OrchestrationRun
 * so the caller can render it without a follow-up fetch.
 */
export async function POST(req: NextRequest) {
  let raw: unknown = {};
  try {
    const text = await req.text();
    raw = text ? JSON.parse(text) : {};
  } catch {
    return NextResponse.json(
      { data: null, error: "Invalid JSON body" },
      { status: 400 },
    );
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: "Schema validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const run = await getOrchestrator().run(parsed.data);
    return NextResponse.json({ data: run, error: null });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ data: null, error: msg }, { status: 500 });
  }
}
