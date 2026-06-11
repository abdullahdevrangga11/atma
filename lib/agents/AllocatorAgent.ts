import { BaseAgent } from "./BaseAgent";
import {
  AllocatorInput,
  AllocationProposal,
  AllocationProposalSchema,
} from "./types";

const SYSTEM = `You are the AllocatorAgent for ATMA Treasury Protocol on Mantle.
You allocate USDC across four Mantle RWA assets — USDY, mUSD, Aave V3 supply, MI4 — under the user's policy.

Inputs you receive:
- targetAmountUsdc: integer string in 6-decimal USDC base units
- userPolicy: max bps per asset, min liquidity bps, risk tolerance
- liveAPYs: current yield rates as decimals (e.g. 0.0465 = 4.65%)
- liveRiskSignals: "ok" | "warn" | "trigger" per asset

Decision tree (read the Skill Reference below carefully):
1. Apply hard policy constraints (exclude max=0 assets, exclude trigger-risk assets, reduce warn-risk cap by 50%).
2. Filter by riskTolerance: conservative=USDY+mUSD, balanced=USDY+mUSD+Aave, aggressive=USDY+mUSD+Aave+MI4.
3. Compute risk-adjusted APY per candidate.
4. Allocate proportionally to adjustedAPY, subject to caps.
5. Enforce minimum liquidity (USDY + mUSD bps >= minLiquidBps).
6. Ensure sum = 10000 bps.

Output schema (STRICT JSON, no extra fields):
{
  "weights": { "usdyBps": int, "mUsdBps": int, "aaveBps": int, "mi4Bps": int },
  "expectedAPYBps": int,
  "reasoning": string,
  "riskScore": int (1 = lowest, 10 = highest)
}

Constraints:
- All weights are integers in basis points (0-10000).
- Sum of all four bps MUST equal exactly 10000.
- Never propose weights that violate policy caps.
- The reasoning string must explain why this specific allocation was chosen.`;

export class AllocatorAgent extends BaseAgent {
  constructor() {
    super("mantle-rwa-allocation.skill.md", "AllocatorAgent");
  }

  async propose(input: AllocatorInput): Promise<AllocationProposal> {
    const text = await this.reason(SYSTEM, input);
    const parsed = this.extractJSON(text);
    const proposal = AllocationProposalSchema.parse(parsed);

    // Sanity guard — clamp + verify bps sum to exactly 10000
    const sum =
      proposal.weights.usdyBps +
      proposal.weights.mUsdBps +
      proposal.weights.aaveBps +
      proposal.weights.mi4Bps;

    if (sum !== 10_000) {
      // adjust largest by the delta
      const delta = 10_000 - sum;
      const entries: [keyof typeof proposal.weights, number][] = [
        ["usdyBps", proposal.weights.usdyBps],
        ["mUsdBps", proposal.weights.mUsdBps],
        ["aaveBps", proposal.weights.aaveBps],
        ["mi4Bps", proposal.weights.mi4Bps],
      ];
      entries.sort((a, b) => b[1] - a[1]);
      const [largestKey] = entries[0];
      proposal.weights[largestKey] += delta;
    }

    return proposal;
  }
}
