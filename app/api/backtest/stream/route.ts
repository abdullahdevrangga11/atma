import type { NextRequest } from "next/server";
import { z } from "zod";
import { Orchestrator } from "@/lib/agents/Orchestrator";
import { UserPolicySchema } from "@/lib/agents/types";
import { readHistoricalFeeds } from "@/lib/data/feeds";
import { rateCheck, ipFrom } from "@/lib/cost/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BodySchema = z
  .object({
    // Cap at 6 weeks in production to keep cost predictable. Local dev
    // bypasses by setting ATMA_ALLOW_LONG_BACKTEST=1.
    weeks: z.number().int().min(2).max(process.env.ATMA_ALLOW_LONG_BACKTEST === "1" ? 12 : 6).optional(),
    policy: UserPolicySchema.optional(),
    targetAmountUsdc: z.string().regex(/^\d+$/).optional(),
  })
  .strict();

type WeekPoint = {
  weekIdx: number;
  weeksAgo: number;
  apys: { usdy: number; mUsd: number; aaveSupply: number; mi4Yield: number };
  riskLevel: "ok" | "warn" | "trigger";
  weights: { usdyBps: number; mUsdBps: number; aaveBps: number; mi4Bps: number };
  expectedAPYBps: number;
  realisedReturnBps: number;
  navEnd: number;
  baselineNav: { doNothing: number; aaveOnly: number; usdyOnly: number };
  costCents: number;
  durationMs: number;
  reasoningHashes: `0x${string}`[];
  runId: string;
};

type Event =
  | { type: "start"; weeks: number; entry: number }
  | { type: "week-start"; weekIdx: number; weeksAgo: number }
  | { type: "token"; weekIdx: number; agent: "AllocatorAgent" | "RiskAgent" | "ReporterAgent"; chunk: string }
  | { type: "agent-done"; weekIdx: number; agent: "AllocatorAgent" | "RiskAgent" | "ReporterAgent"; durationMs: number }
  | { type: "week"; point: WeekPoint }
  | {
      type: "done";
      summary: {
        finalNavATMA: number;
        finalNavDoNothing: number;
        finalNavAaveOnly: number;
        finalNavUsdyOnly: number;
        cumulativeReturnBps: number;
        avgWeeklyBps: number;
        maxDrawdownBps: number;
        totalCostCents: number;
        defensiveExits: number;
      };
    }
  | { type: "error"; message: string };

/**
 * POST /api/backtest/stream
 *
 * Streams N weekly orchestrations with live Claude reasoning per agent step.
 * Each agent's token deltas surface in real time so the UI can render the
 * model thinking even during a multi-minute replay.
 */
export async function POST(req: NextRequest) {
  const rl = rateCheck("backtest", ipFrom(req.headers));
  if (!rl.allowed) {
    return new Response(
      `event: error\ndata: ${JSON.stringify({
        message: `Backtest rate-limited. Retry in ${rl.retryAfterSec}s. (Backtests are expensive — please be gentle.)`,
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
    return errStream(`Schema: ${parsed.error.issues.map((i) => i.message).join(", ")}`);
  }
  const { weeks = 4, policy, targetAmountUsdc } = parsed.data;
  const entry = Number(targetAmountUsdc ?? "10000000000") / 1_000_000;

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (evt: Event) =>
        controller.enqueue(enc.encode(`event: ${evt.type}\ndata: ${JSON.stringify(evt)}\n\n`));

      send({ type: "start", weeks, entry });

      const orchestrator = new Orchestrator();
      let nav = entry;
      let navDoNothing = entry;
      let navAaveOnly = entry;
      let navUsdyOnly = entry;
      let totalCost = 0;
      let defensiveExits = 0;
      let peak = entry;
      let maxDrawdown = 0;
      const weeklyReturnsBps: number[] = [];

      try {
        for (let i = 0; i < weeks; i++) {
          const weeksAgo = weeks - 1 - i;
          const feeds = readHistoricalFeeds(weeksAgo);
          const weekStart = Date.now();
          send({ type: "week-start", weekIdx: i, weeksAgo });

          let weekCostCents = 0;
          const hashes: `0x${string}`[] = [];

          // Use runStream so per-week reasoning streams through to the client.
          const run = await orchestrator.runStream(
            { policy, targetAmountUsdc, entryNAV: targetAmountUsdc, feedsOverride: feeds },
            (evt) => {
              if (evt.type === "token") {
                send({ type: "token", weekIdx: i, agent: evt.agent, chunk: evt.chunk });
              } else if (evt.type === "allocator" || evt.type === "risk" || evt.type === "reporter") {
                const agent =
                  evt.type === "allocator"
                    ? "AllocatorAgent"
                    : evt.type === "risk"
                      ? "RiskAgent"
                      : "ReporterAgent";
                send({
                  type: "agent-done",
                  weekIdx: i,
                  agent,
                  durationMs: evt.step.durationMs,
                });
                hashes.push(evt.step.reasoningHash);
              } else if (evt.type === "cost") {
                weekCostCents = evt.total.costCents;
              }
            },
          );

          if (run.risk.level === "trigger") defensiveExits += 1;

          // Realised weekly return — weighted blend / 52 weeks
          const w = run.proposal.weights;
          const weeklyBlend =
            (w.usdyBps * feeds.apys.usdy +
              w.mUsdBps * feeds.apys.mUsd +
              w.aaveBps * feeds.apys.aaveSupply +
              w.mi4Bps * feeds.apys.mi4Yield) /
            10_000;
          let weeklyReturn = weeklyBlend / 52;
          if (run.risk.level === "trigger") weeklyReturn = -0.0005;
          nav = nav * (1 + weeklyReturn);

          const realisedBps = Math.round(weeklyReturn * 10_000);
          weeklyReturnsBps.push(realisedBps);

          navDoNothing = navDoNothing * 1.0;
          navAaveOnly = navAaveOnly * (1 + feeds.apys.aaveSupply / 52);
          navUsdyOnly = navUsdyOnly * (1 + feeds.apys.usdy / 52);

          peak = Math.max(peak, nav);
          const dd = ((peak - nav) / peak) * 10_000;
          if (dd > maxDrawdown) maxDrawdown = dd;
          totalCost += weekCostCents;

          send({
            type: "week",
            point: {
              weekIdx: i,
              weeksAgo,
              apys: feeds.apys,
              riskLevel: run.risk.level,
              weights: run.proposal.weights,
              expectedAPYBps: run.proposal.expectedAPYBps,
              realisedReturnBps: realisedBps,
              navEnd: nav,
              baselineNav: {
                doNothing: navDoNothing,
                aaveOnly: navAaveOnly,
                usdyOnly: navUsdyOnly,
              },
              costCents: weekCostCents,
              durationMs: Date.now() - weekStart,
              reasoningHashes: hashes,
              runId: run.id,
            },
          });
        }

        const cumulativeReturnBps = Math.round(((nav - entry) / entry) * 10_000);
        const avgWeeklyBps =
          weeklyReturnsBps.length > 0
            ? Math.round(weeklyReturnsBps.reduce((a, b) => a + b, 0) / weeklyReturnsBps.length)
            : 0;
        send({
          type: "done",
          summary: {
            finalNavATMA: nav,
            finalNavDoNothing: navDoNothing,
            finalNavAaveOnly: navAaveOnly,
            finalNavUsdyOnly: navUsdyOnly,
            cumulativeReturnBps,
            avgWeeklyBps,
            maxDrawdownBps: Math.round(maxDrawdown),
            totalCostCents: totalCost,
            defensiveExits,
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
