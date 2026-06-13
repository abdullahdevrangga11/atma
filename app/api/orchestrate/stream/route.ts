import type { NextRequest } from "next/server";
import { z } from "zod";
import { Orchestrator, type OrchestrationEvent } from "@/lib/agents/Orchestrator";
import { UserPolicySchema } from "@/lib/agents/types";
import { rateCheck, ipFrom } from "@/lib/cost/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BodySchema = z
  .object({
    policy: UserPolicySchema.optional(),
    targetAmountUsdc: z.string().regex(/^\d+$/).optional(),
    entryNAV: z.string().regex(/^\d+$/).optional(),
    // Demo "Debate mode" toggle: forces a stressed oracle so Risk vetoes and
    // the orchestrator retries. The VaultDemo UI sends this.
    forceDebate: z.boolean().optional(),
  })
  .strict();

let _orchestrator: Orchestrator | null = null;

/**
 * POST /api/orchestrate/stream
 *
 * Server-Sent Events stream of the agent chain. Each event arrives as soon as
 * the corresponding agent finishes:
 *
 *   event: start      → { runId, feeds }
 *   event: allocator  → { step, proposal }
 *   event: risk       → { step, risk }
 *   event: reporter   → { step, report }
 *   event: done       → { run }     // final, with full OrchestrationRun
 *   event: error      → { message }
 */
export async function POST(req: NextRequest) {
  // Rate limit before we spend a single Claude token
  const rl = rateCheck("orchestrate", ipFrom(req.headers));
  if (!rl.allowed) {
    return new Response(
      `event: error\ndata: ${JSON.stringify({
        message: `Rate limit: ${rl.reason === "cooldown" ? "wait a few seconds" : "hourly cap reached"}. Retry in ${rl.retryAfterSec}s.`,
      })}\n\n`,
      {
        status: 429,
        headers: {
          "Content-Type": "text/event-stream",
          "Retry-After": String(rl.retryAfterSec),
        },
      },
    );
  }

  let raw: unknown = {};
  try {
    const text = await req.text();
    raw = text ? JSON.parse(text) : {};
  } catch {
    return new Response(
      `event: error\ndata: ${JSON.stringify({ message: "Invalid JSON" })}\n\n`,
      {
        status: 400,
        headers: { "Content-Type": "text/event-stream" },
      },
    );
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return new Response(
      `event: error\ndata: ${JSON.stringify({ message: "Schema validation failed", issues: parsed.error.issues })}\n\n`,
      { status: 400, headers: { "Content-Type": "text/event-stream" } },
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (event: OrchestrationEvent) => {
        const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(enc.encode(payload));
      };
      const orchestrator = (_orchestrator ??= new Orchestrator());
      try {
        await orchestrator.runStream(parsed.data, send);
      } catch {
        // runStream emits an "error" event before throwing; nothing extra to do.
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
