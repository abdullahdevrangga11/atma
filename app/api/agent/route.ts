import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AllocatorAgent } from "@/lib/agents/AllocatorAgent";
import { RiskAgent } from "@/lib/agents/RiskAgent";
import { ReporterAgent } from "@/lib/agents/ReporterAgent";
import {
  AllocatorInputSchema,
  RiskInputSchema,
  ReportInputSchema,
} from "@/lib/agents/types";
import { hashReasoning } from "@/lib/agents/BaseAgent";
import { rateCheck, ipFrom } from "@/lib/cost/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const RequestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("propose"),
    input: AllocatorInputSchema,
    overrideSkill: z.string().optional(),
  }),
  z.object({
    action: z.literal("checkRisk"),
    input: RiskInputSchema,
    overrideSkill: z.string().optional(),
  }),
  z.object({
    action: z.literal("report"),
    input: ReportInputSchema,
    overrideSkill: z.string().optional(),
  }),
]);

export async function POST(req: NextRequest) {
  const rl = rateCheck("agent", ipFrom(req.headers));
  if (!rl.allowed) {
    return NextResponse.json(
      { data: null, error: `Rate limit. Retry in ${rl.retryAfterSec}s.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { data: null, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parseResult = RequestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        data: null,
        error: "Schema validation failed",
        issues: parseResult.error.issues,
      },
      { status: 400 },
    );
  }

  const { action, input, overrideSkill } = parseResult.data;

  try {
    switch (action) {
      case "propose": {
        const agent = new AllocatorAgent(overrideSkill);
        const proposal = await agent.propose(input);
        const reasoningHash = await hashReasoning({
          weights: proposal.weights,
          reasoning: proposal.reasoning,
        });
        return NextResponse.json({
          data: { ...proposal, reasoningHash },
          error: null,
        });
      }
      case "checkRisk": {
        const agent = new RiskAgent(overrideSkill);
        const signal = await agent.evaluate(input);
        const signalHash = await hashReasoning(signal);
        return NextResponse.json({
          data: { ...signal, signalHash },
          error: null,
        });
      }
      case "report": {
        const agent = new ReporterAgent(overrideSkill);
        const report = await agent.generate(input);
        const reportHash = await hashReasoning(report);
        return NextResponse.json({
          data: { ...report, reportHash },
          error: null,
        });
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    actions: ["propose", "checkRisk", "report"],
    note: "POST a JSON body { action, input, overrideSkill? } to invoke an agent.",
  });
}
