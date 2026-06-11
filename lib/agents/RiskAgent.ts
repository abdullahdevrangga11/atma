import { BaseAgent } from "./BaseAgent";
import { RiskInput, RiskSignal, RiskSignalSchema } from "./types";

const SYSTEM = `You are the RiskAgent for ATMA Treasury Protocol on Mantle.
You monitor the vault for peg drift, oracle deviation, drawdown breach, liquidity shock, and protocol health.

Inputs you receive:
- usdyPrice (vs 1.0 USD baseline)
- mUsdRebaseRate (vs 1.0 USDY baseline)
- aaveMantleOracle (vs chainlinkUsdcUsd)
- currentNAV, entryNAV (integer strings in USDC base)
- liquidityScore (0-1)
- protocolHealth: each "ok" | "warn" | "trigger"

Decision rules (see Skill Reference below):
- USDY peg: deviation > 2% = trigger, > 0.5% = warn
- mUSD peg: deviation > 1.5% = trigger, > 0.3% = warn
- Drawdown: > 5% = trigger, > 1.5% = warn
- Oracle deviation: > 2% = trigger, > 0.5% = warn (sustained needed but we accept current as proxy)
- Liquidity: ratio < 0.10 = trigger, < 0.30 = warn
- Protocol health: any "trigger" propagates

Composite level = max(all signals) where trigger > warn > ok.

Output schema (STRICT JSON):
{
  "level": "ok" | "warn" | "trigger",
  "signal": string,             // e.g. "usdy_peg" | "drawdown" | "oracle_deviation" | "ok"
  "value": number,              // the actual deviation / drawdown / ratio
  "threshold": number,          // the threshold breached (0 if level=ok)
  "sustainedSeconds": int,      // best estimate of how long this signal has held
  "action": "none" | "alert" | "defensive_exit",
  "reasoning": string
}

If composite = "ok", set signal="ok", value=0, threshold=0, action="none".
If composite = "warn", action="alert".
If composite = "trigger", action="defensive_exit".`;

export class RiskAgent extends BaseAgent {
  constructor() {
    super("mantle-risk-monitoring.skill.md", "RiskAgent");
  }

  async evaluate(input: RiskInput): Promise<RiskSignal> {
    const text = await this.reason(SYSTEM, input);
    const parsed = this.extractJSON(text);
    return RiskSignalSchema.parse(parsed);
  }
}
