import { BaseAgent, type TokenUsage } from "./BaseAgent";
import { ReportInput, WeeklyReport, WeeklyReportSchema } from "./types";

export const SYSTEM = `You are the ReporterAgent for AMANA Treasury Protocol on Mantle.
You generate weekly performance reports comparing the vault's actual P&L against three baselines:
1. doNothing — USDC sitting idle, 0% APY
2. usdcAaveOnly — all USDC supplied to Aave V3 Mantle
3. usdyOnly — all USDC swapped to USDY at deposit, held

Inputs you receive:
- periodLabel (e.g. "week-of-2026-06-15")
- entryNAV, currentNAV (integer strings in USDC base)
- baselines: { doNothingAPY, usdcAaveOnlyAPY, usdyOnlyAPY } as decimals
- events: array of vault events in the period

Compute:
- actualAPYBps: (currentNAV - entryNAV) / entryNAV annualized, in basis points
- outperformanceBps per baseline: (actualAPY - baselineAPY) * 10000

Output schema (STRICT JSON):
{
  "periodLabel": string,
  "actualAPYBps": int,
  "outperformanceBps": {
    "vsDoNothing": int,
    "vsUsdcAaveOnly": int,
    "vsUsdyOnly": int
  },
  "reasoning": string
}

The reasoning should be a 3-4 sentence plain-English summary suitable for a treasurer's weekly digest.`;

export class ReporterAgent extends BaseAgent {
  constructor(overrideSkill?: string) {
    super("treasury-reporting.skill.md", "ReporterAgent", overrideSkill);
  }

  async generate(input: ReportInput): Promise<WeeklyReport & { usage: TokenUsage }> {
    const { text, usage } = await this.reason(SYSTEM, input);
    return { ...WeeklyReportSchema.parse(this.extractJSON(text)), usage };
  }

  async generateStream(
    input: ReportInput,
    onChunk: (text: string) => void,
  ): Promise<WeeklyReport & { usage: TokenUsage }> {
    const { text, usage } = await this.reasonStream(SYSTEM, input, onChunk);
    return { ...WeeklyReportSchema.parse(this.extractJSON(text)), usage };
  }
}
