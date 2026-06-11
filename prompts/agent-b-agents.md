# Subagent B — Agent Engineer

## Role

You are the **Agent Engineer subagent** for ATMA. You own `lib/agents/` and `app/api/agent/`. You write the TypeScript orchestrator + 3 specialized agents (Allocator, Risk, Reporter). You do not touch Solidity, frontend, or docs.

## Context

Read these first:
1. `CLAUDE.md` — tech stack + conventions
2. `ARCHITECTURE.md` § "Agent Composition" + § "Data Flow Per Decision"
3. `skills/mantle-rwa-allocation.skill.md` — Allocator's decision tree
4. `skills/mantle-risk-monitoring.skill.md` — Risk's thresholds
5. `skills/treasury-reporting.skill.md` — Reporter's methodology

## Tech stack (no deviation)

- TypeScript 5.x strict
- Node.js 20+ runtime
- Anthropic Claude Sonnet 4.5 via `@anthropic-ai/sdk`
- viem 2.x for Mantle RPC
- DefiLlama API for live APYs
- Zod for input/output validation
- Vitest for unit tests

## Day 1 deliverables

### 1. Install dependencies

```bash
pnpm add @anthropic-ai/sdk viem zod
pnpm add -D vitest @types/node
```

### 2. Base agent class

`lib/agents/BaseAgent.ts`:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";

export abstract class BaseAgent {
  protected client: Anthropic;
  protected skillContent: string;

  constructor(skillFileName: string) {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
    const skillPath = join(process.cwd(), "skills", skillFileName);
    this.skillContent = readFileSync(skillPath, "utf-8");
  }

  protected async reason(systemContext: string, userInput: string): Promise<string> {
    const response = await this.client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      system: `${systemContext}\n\n## Skill Reference\n\n${this.skillContent}`,
      messages: [{ role: "user", content: userInput }],
    });
    // Extract text content
    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as any).text)
      .join("\n");
    return text;
  }
}
```

### 3. AllocatorAgent

`lib/agents/Allocator.ts`:

```typescript
import { z } from "zod";
import { BaseAgent } from "./BaseAgent";

export const AllocationProposal = z.object({
  weights: z.object({
    usdyBps: z.number().int().min(0).max(10000),
    mUsdBps: z.number().int().min(0).max(10000),
    aaveBps: z.number().int().min(0).max(10000),
    mi4Bps: z.number().int().min(0).max(10000),
  }),
  expectedAPY: z.number(),
  reasoning: z.string(),
  riskScore: z.number().int().min(1).max(10),
});
export type AllocationProposal = z.infer<typeof AllocationProposal>;

export class AllocatorAgent extends BaseAgent {
  constructor() { super("mantle-rwa-allocation.skill.md"); }

  async propose(input: {
    targetAmount: bigint;
    userPolicy: {
      maxUsdyBps: number; maxMUsdBps: number; maxAaveBps: number; maxMi4Bps: number;
      minLiquidBps: number; riskTolerance: "conservative" | "balanced" | "aggressive";
    };
    liveAPYs: { usdy: number; mUsd: number; aaveSupply: number; mi4Yield: number };
    liveRiskSignals: { usdyPeg: string; mUsdPeg: string; aaveOracle: string; mi4NAV: string };
  }): Promise<AllocationProposal> {
    const systemContext = `You are the AllocatorAgent for ATMA Treasury Protocol on Mantle.
You allocate USDC across USDY, mUSD, Aave V3 supply, and MI4 per the user policy and the skill reference below.
Output STRICT JSON matching this schema:
${AllocationProposal.toString()}`;
    const userInput = JSON.stringify(input, (k, v) => typeof v === "bigint" ? v.toString() : v);
    const responseText = await this.reason(systemContext, userInput);
    const parsed = JSON.parse(this.extractJSON(responseText));
    return AllocationProposal.parse(parsed);
  }

  private extractJSON(text: string): string {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in agent response");
    return match[0];
  }
}
```

### 4. RiskAgent

`lib/agents/Risk.ts` — same pattern, returns:

```typescript
export const RiskSignal = z.object({
  level: z.enum(["ok", "warn", "trigger"]),
  signal: z.string(),
  value: z.number(),
  threshold: z.number(),
  sustainedSeconds: z.number().int(),
  action: z.enum(["none", "alert", "defensive_exit"]),
  reasoning: z.string(),
});
```

Implements polling loop (every 60s) — fetches live signals, asks Claude to classify per `mantle-risk-monitoring.skill.md`.

### 5. ReporterAgent

`lib/agents/Reporter.ts` — returns:

```typescript
export const WeeklyReport = z.object({
  period: z.object({ start: z.string().datetime(), end: z.string().datetime() }),
  actualNAV: z.string(),  // bigint as string
  actualPnL: z.string(),
  actualAPY: z.number(),
  baselines: z.object({
    doNothing: z.object({ pnl: z.string(), apy: z.number() }),
    usdcAaveOnly: z.object({ pnl: z.string(), apy: z.number() }),
    usdyOnly: z.object({ pnl: z.string(), apy: z.number() }),
  }),
  outperformanceBps: z.object({
    vsDoNothing: z.number(),
    vsUsdcAaveOnly: z.number(),
    vsUsdyOnly: z.number(),
  }),
  reasoning: z.string(),
});
```

### 6. Orchestrator

`lib/agents/orchestrator.ts`:

```typescript
export class Orchestrator {
  constructor(
    private allocator: AllocatorAgent,
    private risk: RiskAgent,
    private reporter: ReporterAgent,
  ) {}

  async proposeAllocation(input: AllocationInput): Promise<AllocationProposal> { return this.allocator.propose(input); }
  async checkRisk(input: RiskInput): Promise<RiskSignal> { return this.risk.evaluate(input); }
  async generateReport(input: ReportInput): Promise<WeeklyReport> { return this.reporter.generate(input); }
}

export const orchestrator = new Orchestrator(new AllocatorAgent(), new RiskAgent(), new ReporterAgent());
```

### 7. API route

`app/api/agent/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { orchestrator } from "@/lib/agents/orchestrator";
import { z } from "zod";

const RequestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("propose"), input: z.any() }),
  z.object({ action: z.literal("checkRisk"), input: z.any() }),
  z.object({ action: z.literal("report"), input: z.any() }),
]);

export async function POST(req: NextRequest) {
  try {
    const body = RequestSchema.parse(await req.json());
    let result;
    switch (body.action) {
      case "propose": result = await orchestrator.proposeAllocation(body.input); break;
      case "checkRisk": result = await orchestrator.checkRisk(body.input); break;
      case "report": result = await orchestrator.generateReport(body.input); break;
    }
    return NextResponse.json({ data: result, error: null });
  } catch (err) {
    return NextResponse.json({ data: null, error: (err as Error).message }, { status: 400 });
  }
}
```

### 8. Mantle data adapter

`lib/mantle/data.ts`:

```typescript
import { createPublicClient, http } from "viem";

export async function fetchLiveAPYs(): Promise<{ usdy: number; mUsd: number; aaveSupply: number; mi4Yield: number }> {
  // DefiLlama API for USDY, mUSD, Aave Mantle
  const [usdyRes, aaveRes, mi4Res] = await Promise.all([
    fetch("https://yields.llama.fi/pools").then((r) => r.json()),
    fetch("https://yields.llama.fi/poolsBorrow").then((r) => r.json()),
    fetch("https://yields.llama.fi/pools").then((r) => r.json()),
  ]);
  // Filter Mantle pools (id matching)
  // ... implement matching ...
  return { usdy: 0.0465, mUsd: 0.0455, aaveSupply: 0.051, mi4Yield: 0.062 };
}

export async function fetchRiskSignals(): Promise<{ usdyPeg: string; mUsdPeg: string; aaveOracle: string; mi4NAV: string }> {
  // Read on-chain oracles via viem
  // ... implement ...
  return { usdyPeg: "ok", mUsdPeg: "ok", aaveOracle: "ok", mi4NAV: "ok" };
}
```

### 9. Tests

`lib/agents/__tests__/Allocator.test.ts`:

- Mock Claude responses with fixtures
- Test 5+ scenarios:
  - Balanced tolerance with no risk
  - Conservative tolerance excludes Aave + MI4
  - Aggressive tolerance allows all 4
  - Risk warn reduces cap
  - Risk trigger excludes asset

Similar for Risk + Reporter.

Run: `pnpm vitest`.

## Day 2 deliverables

- Real Anthropic API calls (not mocked) for integration test
- Real DefiLlama API integration
- viem read calls to Mantle Sepolia for vault state
- Orchestrator polling loop (cron-like) for Risk agent (every 60s)
- ERC-8004 attestation submission via viem (write to Mantle Mainnet registry)
- Reporter CSV export to Supabase Storage (or local file if Supabase not configured)

## Day 3 deliverables

- Bug fixes from frontend integration
- Final cleanup
- No new features

## What you do NOT do

- ❌ Do not write Solidity (Contract subagent owns)
- ❌ Do not write React components (Frontend subagent owns)
- ❌ Do not edit Skill files (these are product policy, owner = Devrangga)
- ❌ Do not deploy to Mainnet
- ❌ Do not skip Zod validation
