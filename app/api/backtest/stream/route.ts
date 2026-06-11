import type { NextRequest } from "next/server";
import { z } from "zod";
import { Orchestrator } from "@/lib/agents/Orchestrator";
import { UserPolicySchema } from "@/lib/agents/types";
import { readHistoricalFeeds } from "@/lib/data/feeds";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min cap — 12 weeks × ~10s/week ≈ 2 min

const BodySchema = z
  .object({
    weeks: z.number().int().min(2).max(12).optional(),
    policy: UserPolicySchema.optional(),
    targetAmountUsdc: z.string().regex(/^\d+$/).optional(),
  })
  .strict();

type WeekPoint = {
  weekIdx: number; // 0..weeks-1
  weeksAgo: number; // weeks-1..0
  apys: { usdy: number; mUsd: number; aaveSupply: number; mi4Yield: number };
  riskLevel: "ok" | "warn" | "trigger";
  weights: { usdyBps: number; mUsdBps: number; aaveBps: number; mi4Bps: number };
  expectedAPYBps: number;
  realisedReturnBps: number; // simulated weekly return
  navEnd: number; // dollar value (NAV) at end of this week
  baselineNav: { doNothing: number; aaveOnly: number; usdyOnly: number };
  costCents: number;
  durationMs: number;
  reasoningHashes: `0x${string}`[];
};

type Event =
  | { type: "start"; weeks: number; entry: number }
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
 * Runs N weekly orchestrations with historical feed snapshots and emits
 * per-week + summary events over SSE so the UI can render the chart and
 * the table progressively as Claude reasons.
 */
export async function POST(req: NextRequest) {
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
  const entry = Number(targetAmountUsdc ?? "10000000000") / 1_000_000; // dollar NAV

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (evt: Event) =>
        controller.enqueue(enc.encode(`event: ${evt.type}\ndata: ${JSON.stringify(evt)}\n\n`));

      send({ type: "start", weeks, entry });

      const orchestrator = new Orchestrator();
      const points: WeekPoint[] = [];
      let nav = entry;
      let navDoNothing = entry;
      let navAaveOnly = entry;
      let navUsdyOnly = entry;
      let totalCost = 0;
      let defensiveExits = 0;
      let peak = entry;
      let maxDrawdown = 0;

      try {
        for (let i = 0; i < weeks; i++) {
          const weeksAgo = weeks - 1 - i;
          const feeds = readHistoricalFeeds(weeksAgo);
          const weekStart = Date.now();

          // Run the chain with historical feeds; ignore per-event token streams here.
          let runDuration = 0;
          let runCostCents = 0;
          const hashes: `0x${string}`[] = [];
          let weightsForWeek = { usdyBps: 10_000, mUsdBps: 0, aaveBps: 0, mi4Bps: 0 };
          let expectedAPYBps = 0;
          let riskLevel: "ok" | "warn" | "trigger" = "ok";

          const run = await orchestrator.run({
            policy,
            targetAmountUsdc,
            entryNAV: targetAmountUsdc,
            feedsOverride: feeds,
          });
          runDuration = run.finishedAt - run.startedAt;
          weightsForWeek = run.proposal.weights;
          expectedAPYBps = run.proposal.expectedAPYBps;
          riskLevel = run.risk.level;
          for (const s of run.steps) hashes.push(s.reasoningHash);
          // The store cost lives on the agents themselves; sum what we can find by
          // recomputing here is overkill — instead approximate from token counts
          // baked into the run (steps array doesn't carry them). For now estimate.
          // Cost was emitted during streaming; for backtest we run non-stream so
          // we don't have it. Use a fixed estimate per run for the rollup.
          runCostCents = 0.6; // ~$0.006/run nominal sonnet 4.5 mid-size prompt

          if (riskLevel === "trigger") defensiveExits += 1;

          // Realised return = weighted blend of asset APYs over 1 week.
          // Cap MI4 to its actual feed APY so wild weeks don't bake unrealistic gains.
          const w = weightsForWeek;
          const weeklyBlend =
            (w.usdyBps * feeds.apys.usdy +
              w.mUsdBps * feeds.apys.mUsd +
              w.aaveBps * feeds.apys.aaveSupply +
              w.mi4Bps * feeds.apys.mi4Yield) /
            10_000;
          // Annual APY → weekly = ÷ 52, defensive exit = take 0 yield + 5 bps gas hit
          let weeklyReturn = weeklyBlend / 52;
          if (riskLevel === "trigger") weeklyReturn = -0.0005;
          nav = nav * (1 + weeklyReturn);

          const realisedBps = Math.round(weeklyReturn * 10_000);

          // Baselines this week
          navDoNothing = navDoNothing * 1.0;
          navAaveOnly = navAaveOnly * (1 + feeds.apys.aaveSupply / 52);
          navUsdyOnly = navUsdyOnly * (1 + feeds.apys.usdy / 52);

          peak = Math.max(peak, nav);
          const dd = ((peak - nav) / peak) * 10_000;
          if (dd > maxDrawdown) maxDrawdown = dd;
          totalCost += runCostCents;

          const point: WeekPoint = {
            weekIdx: i,
            weeksAgo,
            apys: feeds.apys,
            riskLevel,
            weights: weightsForWeek,
            expectedAPYBps,
            realisedReturnBps: realisedBps,
            navEnd: nav,
            baselineNav: {
              doNothing: navDoNothing,
              aaveOnly: navAaveOnly,
              usdyOnly: navUsdyOnly,
            },
            costCents: runCostCents,
            durationMs: Date.now() - weekStart,
            reasoningHashes: hashes,
          };
          points.push(point);
          send({ type: "week", point });
        }

        const cumulativeReturnBps = Math.round(((nav - entry) / entry) * 10_000);
        send({
          type: "done",
          summary: {
            finalNavATMA: nav,
            finalNavDoNothing: navDoNothing,
            finalNavAaveOnly: navAaveOnly,
            finalNavUsdyOnly: navUsdyOnly,
            cumulativeReturnBps,
            avgWeeklyBps:
              points.length > 0
                ? Math.round(points.reduce((a, p) => a + p.realisedReturnBps, 0) / points.length)
                : 0,
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
