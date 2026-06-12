# Skill: Mantle Risk Monitoring

> Read by `RiskAgent` at runtime. Defines depeg signals, drawdown thresholds, oracle deviation, and defensive triggers.

## Monitored Inputs

Polled every 60 seconds:

- `usdyPrice` — Ondo oracle on Mantle, vs 1.0 USD baseline
- `mUsdRebaseRate` — mUSD per USDY, vs 1.0 baseline
- `aaveMantleOracle` — Aave V3 Mantle USDC oracle
- `chainlinkUsdcUsd` — Chainlink USDC/USD reference price
- `currentNAV` — vault's current net asset value
- `entryNAV` — vault's NAV at first deposit
- `liquidityScore` — vault's max single-block withdrawable / total

Polled every 5 minutes:

- `aavePauseStatus` — Aave V3 Mantle pool paused state
- `usdyRedemptionStatus` — Ondo redemption status
- `mantleNetworkStatus` — Mantle Sepolia / Mainnet health

## Signal Computation

### USDY peg signal

```
deviation = abs(usdyPrice - 1.0)
if deviation > 0.02: return "trigger"      // > 2%
if deviation > 0.005: return "warn"        // > 0.5%
return "ok"
```

### mUSD peg signal

```
deviation = abs(mUsdRebaseRate - 1.0)
if deviation > 0.015: return "trigger"
if deviation > 0.003: return "warn"
return "ok"
```

### Drawdown signal

```
drawdown = (entryNAV - currentNAV) / entryNAV
if drawdown > 0.05: return "trigger"      // > 5%
if drawdown > 0.015: return "warn"        // > 1.5%
return "ok"
```

### Oracle deviation signal

```
deviation = abs(aaveMantleOracle - chainlinkUsdcUsd) / chainlinkUsdcUsd
sustained = deviation has been > threshold for at least N seconds

if deviation > 0.02 AND sustained 120s: return "trigger"
if deviation > 0.005 AND sustained 300s: return "warn"
return "ok"
```

### Liquidity signal

```
ratio = liquidityScore (max withdrawable in one block / total)
if ratio < 0.10: return "trigger"
if ratio < 0.30: return "warn"
return "ok"
```

### Protocol health signal

```
if aavePauseStatus == paused: return "trigger"
if usdyRedemptionStatus == paused: return "trigger"
if mantleNetworkStatus == degraded: return "warn"
return "ok"
```

## Composite Risk Level

```
levels = [usdyPeg, mUsdPeg, drawdown, oracle, liquidity, protocol]
worst = max(levels)  // trigger > warn > ok
```

If `worst == "trigger"`: call `triggerDefensiveExit()` on AmanaVault.
If `worst == "warn"`: alert user via frontend toast + optional Telegram/email.
If `worst == "ok"`: emit heartbeat (every 5 min) to ERC-8004 ReputationRegistry.

## False Positive Guards

To avoid flickering signals causing constant defensive exits:

### Hysteresis

Once a signal triggers, it must stay `ok` for **15 minutes** before the vault re-enters allocation.

### Confirmation

For oracle / liquidity / protocol signals, require **2 consecutive polls** to agree before triggering.

### Manual override

User can force `ok` state for **1 hour** if they believe signal is false positive (e.g., during a known Aave maintenance). Logs override on-chain.

## Defensive Exit Order

When `trigger`, unwind in this order (highest priority hold last):

1. **MI4** → USDC (price-volatile, exit first)
2. **Aave V3 supply** → USDC (smart contract risk, exit second)
3. **mUSD** → USDY → USDC (one extra hop, exit third)
4. **USDY** → USDC (most stable, exit last)

If any unwind step's slippage > 5%, pause and alert user. The vault stays in `RiskTriggered` state until user manually resumes or forces `emergencyExit()`.

## Reasoning Output

Every `trigger` and `warn` event produces structured reasoning:

```json
{
  "level": "trigger",
  "signal": "oracle_deviation",
  "value": 0.025,
  "threshold": 0.02,
  "sustained_seconds": 145,
  "action": "defensive_exit",
  "reasoning": "Aave V3 Mantle oracle deviated 2.5% from Chainlink for 145s, exceeding 2% / 120s threshold. Replicates March 10, 2026 wstETH glitch pattern. Initiating defensive exit to USDC."
}
```

This reasoning is hashed (`bytes32`) and stored on-chain via ERC-8004 ReputationRegistry. The full JSON is stored off-chain (Supabase) for later audit.

## Anti-patterns

- ❌ Don't trigger on single-poll signals (require sustained / confirmed)
- ❌ Don't trigger if Mantle network is degraded but assets are fine — that's a UX problem, not vault risk
- ❌ Don't override user's manual `ok` overrides
- ❌ Don't trigger if drawdown is just market volatility on MI4 within tolerance
- ❌ Don't unwind during slippage > 5% — wait for liquidity to return

## Reference real-world events (from Q1-Q2 2026)

- **March 10, 2026**: Aave V3 Mantle wstETH oracle glitch → $27M unfair liquidations. AMANA would have triggered defensive exit at 2 min sustained deviation.
- **April 18, 2026**: Kelp DAO LayerZero bridge exploit → $292M drained from rsETH → $5.4B panic Aave flight. AMANA would have triggered on `protocol_health = trigger`.
- **October 10, 2025**: $19B liquidation cascade during Asian session. AMANA's hysteresis avoids false triggers during volatility but catches real protocol failures.
