# Skill: Mantle RWA Allocation

> Read by `AllocatorAgent` at runtime. Defines the decision tree for routing USDC across the Mantle RWA stack.

## Inputs

- `targetAmount`: USDC amount to allocate
- `userPolicy`: `{ maxUsdyBps, maxMUsdBps, maxAaveBps, maxMi4Bps, minLiquidBps, riskTolerance: "conservative" | "balanced" | "aggressive" }`
- `liveAPYs`: `{ usdy, mUsd, aaveSupply, mi4Yield }`
- `liveRiskSignals`: `{ usdyPeg, mUsdPeg, aaveOracle, mi4NAV }`

## Decision Tree

### Step 1: Apply hard policy constraints

```
if any asset's "max" bp = 0, exclude from candidates.
if any asset's risk signal = "warn", reduce its allowed cap by 50%.
if any asset's risk signal = "trigger", exclude entirely.
```

### Step 2: Filter by user risk tolerance

| Tolerance | Allowed assets |
|---|---|
| `conservative` | USDY, mUSD only |
| `balanced` | USDY, mUSD, Aave V3 supply |
| `aggressive` | USDY, mUSD, Aave V3, MI4 |

### Step 3: Optimize for risk-adjusted yield

For each candidate asset, compute:

```
adjustedAPY = liveAPY - riskPenalty(asset)
where riskPenalty:
  USDY:    5 bps (treasury-backed, lowest risk)
  mUSD:    8 bps (wrapper risk)
  Aave:    25 bps (smart contract + oracle risk)
  MI4:     75 bps (price volatility + index manager risk)
```

Allocate weights proportionally to `adjustedAPY`, subject to caps.

### Step 4: Enforce minimum liquidity

```
liquidBps = USDY + mUSD bps  (both unwind to USDC in < 5 min)
if liquidBps < userPolicy.minLiquidBps:
  rebalance to meet minimum liquidity, reducing Aave + MI4 proportionally.
```

### Step 5: Round to whole basis points + verify sum = 10000

```
ensure usdy + mUsd + aave + mi4 = 10000 bps (100%)
if rounding error, adjust largest allocation by ±1 bp
```

## Worked Example

**Inputs**:
- targetAmount: $10,000 USDC
- userPolicy: `{ maxUsdyBps: 5000, maxMUsdBps: 3000, maxAaveBps: 4000, maxMi4Bps: 2000, minLiquidBps: 5000, riskTolerance: "balanced" }`
- liveAPYs: `{ usdy: 4.65%, mUsd: 4.55%, aaveSupply: 5.10%, mi4Yield: 6.20% }`
- liveRiskSignals: all `ok`

**Process**:
1. No hard exclusions
2. Tolerance "balanced" → MI4 excluded
3. Adjusted APYs:
   - USDY: 4.65 - 0.05 = 4.60%
   - mUSD: 4.55 - 0.08 = 4.47%
   - Aave: 5.10 - 0.25 = 4.85%
4. Naive proportional allocation:
   - Total adjusted APY weight: 4.60 + 4.47 + 4.85 = 13.92%
   - USDY: 4.60 / 13.92 = 33.04% → cap 50%, ok
   - mUSD: 4.47 / 13.92 = 32.11% → cap 30%, reduce to 30%
   - Aave: 4.85 / 13.92 = 34.85% → cap 40%, ok
5. Re-normalize after cap:
   - mUSD locked at 3000 bps
   - Remaining 7000 bps between USDY + Aave
   - USDY: 4.60 / (4.60 + 4.85) = 48.68% of 7000 = 3408 bps
   - Aave: 4.85 / 9.45 = 51.32% of 7000 = 3592 bps
6. Liquidity check: USDY 3408 + mUSD 3000 = 6408 bps liquid > 5000 minimum ✓
7. Round: USDY 3408, mUSD 3000, Aave 3592, MI4 0 (sum 10000) ✓

**Output**:
```json
{
  "weights": { "usdyBps": 3408, "mUsdBps": 3000, "aaveBps": 3592, "mi4Bps": 0 },
  "expectedAPY": 463,
  "reasoning": "Balanced tolerance excludes MI4. Aave's 25bp risk discount still leaves highest yield; capped to mUSD at 30% by policy. USDY + mUSD provide 64% liquid buffer above 50% minimum.",
  "riskScore": 1
}
```

## Special Cases

### Tiny deposits (< $100)

For deposits under $100, gas overhead matters. Allocate 100% to single highest-adjusted-APY asset to minimize tx count.

### Re-allocation cadence

Don't propose new rebalance if last rebalance was < 24h ago, unless:
- Risk signal level changed
- APY differential > 50 bps in any asset
- User explicitly requested

### Conflict resolution

If two assets are within 5 bps of adjusted APY, prefer the more liquid one (lower riskPenalty).

## Anti-patterns (never do this)

- ❌ Don't allocate to an asset with `trigger` risk signal
- ❌ Don't go below minimum liquidity buffer
- ❌ Don't exceed policy caps even if yield is attractive
- ❌ Don't propose rebalance for < 1% APY improvement (gas cost > yield gain)
- ❌ Don't ignore user-specified `riskTolerance`
