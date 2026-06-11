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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RequestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("propose"), input: AllocatorInputSchema }),
  z.object({ action: z.literal("checkRisk"), input: RiskInputSchema }),
  z.object({ action: z.literal("report"), input: ReportInputSchema }),
]);

// Lazy-instantiate so cold start doesn't fail without a key
let allocator: AllocatorAgent | null = null;
let risk: RiskAgent | null = null;
let reporter: ReporterAgent | null = null;

function getAllocator(): AllocatorAgent {
  if (!allocator) allocator = new AllocatorAgent();
  return allocator;
}
function getRisk(): RiskAgent {
  if (!risk) risk = new RiskAgent();
  return risk;
}
function getReporter(): ReporterAgent {
  if (!reporter) reporter = new ReporterAgent();
  return reporter;
}

export async function POST(req: NextRequest) {
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

  const { action, input } = parseResult.data;

  try {
    switch (action) {
      case "propose": {
        const proposal = await getAllocator().propose(input);
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
        const signal = await getRisk().evaluate(input);
        const signalHash = await hashReasoning(signal);
        return NextResponse.json({
          data: { ...signal, signalHash },
          error: null,
        });
      }

      case "report": {
        const report = await getReporter().generate(input);
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
    note: "POST a JSON body { action, input } to invoke an agent.",
  });
}
