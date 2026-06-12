import type { NextRequest } from "next/server";
import { z } from "zod";
import { AllocatorAgent } from "@/lib/agents/AllocatorAgent";
import { readHistoricalFeeds } from "@/lib/data/feeds";
import { UserPolicySchema } from "@/lib/agents/types";
import { hashReasoning } from "@/lib/agents/BaseAgent";
import { rateCheck, ipFrom } from "@/lib/cost/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BodySchema = z
  .object({
    rounds: z.number().int().min(2).max(8).optional(),
    skillA: z.string().min(1),
    skillB: z.string().min(1),
    policy: UserPolicySchema.optional(),
    targetAmountUsdc: z.string().regex(/^\d+$/).optional(),
  })
  .strict();

type RoundResult = {
  roundIdx: number;
  weeksAgo: number;
  feeds: { apys: { usdy: number; mUsd: number; aaveSupply: number; mi4Yield: number } };
  a: {
    expectedAPYBps: number;
    weights: { usdyBps: number; mUsdBps: number; aaveBps: number; mi4Bps: number };
    riskScore: number;
    reasoning: string;
    reasoningHash: `0x${string}`;
    durationMs: number;
    costCents: number;
  };
  b: {
    expectedAPYBps: number;
    weights: { usdyBps: number; mUsdBps: number; aaveBps: number; mi4Bps: number };
    riskScore: number;
    reasoning: string;
    reasoningHash: `0x${string}`;
    durationMs: number;
    costCents: number;
  };
  winner: "A" | "B" | "tie";
};

type Summary = {
  rounds: number;
  avgAPYBpsA: number;
  avgAPYBpsB: number;
  winsA: number;
  winsB: number;
  ties: number;
  totalCostCents: number;
  winnerOverall: "A" | "B" | "tie";
};

type Event =
  | { type: "start"; rounds: number }
  | { type: "round-start"; roundIdx: number; weeksAgo: number }
  | { type: "round"; result: RoundResult }
  | { type: "done"; summary: Summary }
  | { type: "error"; message: string };

/**
 * POST /api/abtest/stream
 *
 * Runs N rounds of AllocatorAgent under two competing skill markdowns.
 * Each round uses a unique historical feed snapshot so the two skills face
 * different market conditions across the rounds. Both run in parallel per
 * round.
 *
 * Streams per-round results then a summary.
 */
export async function POST(req: NextRequest) {
  const rl = rateCheck("abtest", ipFrom(req.headers));
  if (!rl.allowed) {
    return new Response(
      `event: error\ndata: ${JSON.stringify({
        message: `A/B rate-limited. Retry in ${rl.retryAfterSec}s.`,
      })}\n\n`,
      { status: 429, headers: { "Content-Type": "text/event-stream", "Retry-After": String(rl.retryAfterSec) } },
    );
  }
  let raw: unknown = {};
  try {
    const text = await req.text();
    raw = text ? JSON.parse(text) : {};
  } catch {
    return errStream("Invalid JSON");
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return errStream("Schema invalid");
  }
  const { rounds = 5, skillA, skillB, policy, targetAmountUsdc } = parsed.data;
  const targetUsdc = targetAmountUsdc ?? "10000000000";

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (evt: Event) =>
        controller.enqueue(enc.encode(`event: ${evt.type}\ndata: ${JSON.stringify(evt)}\n\n`));

      send({ type: "start", rounds });

      const allocA = new AllocatorAgent(skillA);
      const allocB = new AllocatorAgent(skillB);
      let totalA = 0;
      let totalB = 0;
      let winsA = 0;
      let winsB = 0;
      let ties = 0;
      let totalCostCents = 0;

      try {
        for (let i = 0; i < rounds; i++) {
          // Spread weeksAgo across the rounds so each round gets a different market
          const weeksAgo = Math.floor((i * 7) / rounds);
          const feeds = readHistoricalFeeds(weeksAgo);
          send({ type: "round-start", roundIdx: i, weeksAgo });

          const input = {
            targetAmountUsdc: targetUsdc,
            userPolicy: policy ?? {
              maxUsdyBps: 5000,
              maxMUsdBps: 5000,
              maxAaveBps: 5000,
              maxMi4Bps: 1500,
              minLiquidBps: 4000,
              riskTolerance: "balanced" as const,
            },
            liveAPYs: feeds.apys,
            liveRiskSignals: feeds.risk,
          };

          const tA = Date.now();
          const tB = Date.now();
          const [resA, resB] = await Promise.all([
            allocA.propose(input),
            allocB.propose(input),
          ]);
          const durA = Date.now() - tA;
          const durB = Date.now() - tB;
          const hashA = await hashReasoning({ weights: resA.weights, reasoning: resA.reasoning });
          const hashB = await hashReasoning({ weights: resB.weights, reasoning: resB.reasoning });

          totalA += resA.expectedAPYBps;
          totalB += resB.expectedAPYBps;
          totalCostCents += resA.usage.costCents + resB.usage.costCents;

          let winner: "A" | "B" | "tie";
          if (resA.expectedAPYBps > resB.expectedAPYBps) {
            winner = "A";
            winsA += 1;
          } else if (resB.expectedAPYBps > resA.expectedAPYBps) {
            winner = "B";
            winsB += 1;
          } else {
            winner = "tie";
            ties += 1;
          }

          send({
            type: "round",
            result: {
              roundIdx: i,
              weeksAgo,
              feeds: { apys: feeds.apys },
              a: {
                expectedAPYBps: resA.expectedAPYBps,
                weights: resA.weights,
                riskScore: resA.riskScore,
                reasoning: resA.reasoning,
                reasoningHash: hashA,
                durationMs: durA,
                costCents: resA.usage.costCents,
              },
              b: {
                expectedAPYBps: resB.expectedAPYBps,
                weights: resB.weights,
                riskScore: resB.riskScore,
                reasoning: resB.reasoning,
                reasoningHash: hashB,
                durationMs: durB,
                costCents: resB.usage.costCents,
              },
              winner,
            },
          });
        }

        const avgA = Math.round(totalA / rounds);
        const avgB = Math.round(totalB / rounds);
        const winnerOverall: "A" | "B" | "tie" = avgA > avgB ? "A" : avgB > avgA ? "B" : "tie";
        send({
          type: "done",
          summary: {
            rounds,
            avgAPYBpsA: avgA,
            avgAPYBpsB: avgB,
            winsA,
            winsB,
            ties,
            totalCostCents,
            winnerOverall,
          },
        });
      } catch (err) {
        send({ type: "error", message: err instanceof Error ? err.message : "Unknown" });
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

function errStream(msg: string) {
  return new Response(`event: error\ndata: ${JSON.stringify({ message: msg })}\n\n`, {
    status: 400,
    headers: { "Content-Type": "text/event-stream" },
  });
}
