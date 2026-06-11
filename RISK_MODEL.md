# ATMA — Risk Model

## Overview

ATMA's Risk Agent monitors the vault's allocation continuously and triggers defensive exits when thresholds are breached. This document defines the signals, thresholds, and defensive actions.

## Risk Signal Levels

| Level | Action | Definition |
|---|---|---|
| `ok` | none | All signals within tolerance |
| `warn` | alert user | One signal approaching threshold; no auto-action |
| `trigger` | defensive exit | One or more signals breached; auto-convert to USDC |

## Monitored Signals

### 1. Peg Drift

#### USDY peg
- **Source**: Ondo oracle on Mantle (`USDY_PRICE_FEED`)
- **Baseline**: 1.0 USD
- **Warn threshold**: deviation > 0.5%
- **Trigger threshold**: deviation > 2.0%
- **Rationale**: USDY backed by short-term US Treasuries; meaningful deviation = oracle stale or backing concern

#### mUSD peg
- **Source**: rebasing rate vs USDY
- **Baseline**: 1.0 USDY equivalent
- **Warn threshold**: deviation > 0.3%
- **Trigger threshold**: deviation > 1.5%
- **Rationale**: mUSD is a wrapper; meaningful deviation = bridge or rebase malfunction

### 2. Drawdown

- **Metric**: `(currentNAV - entryNAV) / entryNAV`
- **Computed**: at each snapshot
- **Warn threshold**: drawdown > 1.5%
- **Trigger threshold**: drawdown > 5.0%
- **Rationale**: ATMA targets capital preservation; > 5% in a 7-day window indicates protocol failure, not market

### 3. Oracle Deviation

#### Aave Mantle oracle vs Chainlink
- **Source**: Aave V3 Mantle pool oracle vs Chainlink USDC/USD
- **Warn threshold**: deviation > 0.5% sustained 5 min
- **Trigger threshold**: deviation > 2.0% sustained 2 min
- **Rationale**: March 10, 2026 wstETH glitch caused $27M unfair liquidations; ATMA defends against this exact failure mode

### 4. Liquidity Shock

- **Source**: vault's withdraw simulator
- **Metric**: max single-block withdrawable without slippage > 2%
- **Warn threshold**: withdrawable / total < 30%
- **Trigger threshold**: withdrawable / total < 10%
- **Rationale**: if vault can't unwind smoothly, defensive exit becomes harder; preempt

### 5. Bridge / Protocol Health

- **Source**: external oracle (Hypernative or Mantle ecosystem watcher)
- **Signals**: Aave V3 Mantle paused, USDY redemption paused, Ondo bridge incident
- **Trigger**: any of the above
- **Rationale**: April 18, 2026 Kelp DAO bridge exploit froze rsETH for 30 days; ATMA refuses to be a victim

## Defensive Exit Procedure

When Risk Agent emits `trigger`:

1. Orchestrator calls `AtmaVault.triggerDefensiveExit(riskSignalHash)`
2. Vault transitions: `Allocated → RiskTriggered`
3. Vault unwinds positions in order:
   - First: redeem MI4 → USDC (lowest priority)
   - Second: withdraw Aave V3 supply → USDC
   - Third: unwrap mUSD → USDY → USDC
   - Last: USDY → USDC (highest priority hold)
4. Each unwind is bounded by current liquidity; if slippage > 5%, agent pauses + alerts user
5. Vault transitions: `RiskTriggered → DefensiveExit (terminal)`
6. ERC-8004 ReputationRegistry emits `DefensiveExit(agentId, totalRecovered, reasoningHash)`
7. User notified via frontend + Telegram (if configured) + email (if configured)

## False Positive Tolerance

The agent uses **sustained signal** windows to avoid false positives:
- Peg drift must persist > 60 seconds to count
- Oracle deviation must persist > 2 minutes to trigger
- Drawdown is computed at 1-minute granularity, smoothed over 5 minutes

## Manual Override

The vault owner can always:
- `pause()` ATMA operator (no more rebalances)
- `emergencyExit()` (immediate USDC conversion, bypasses risk agent)
- `revokeOperator()` (revoke ATMA's allocation authority permanently)

## Stress-Test Scenarios

| Scenario | Expected ATMA action |
|---|---|
| USDY depegs to 0.97 USD | Trigger defensive exit (deviation > 2%) |
| Mantle Aave V3 oracle glitches like March 10, 2026 | Trigger defensive exit before unfair liquidation |
| Kelp DAO-style bridge exploit freezes mUSD redemption | Trigger defensive exit + alert user |
| Slow drawdown 0.5%/day for 10 days | Warn at day 3, trigger at day 10 |
| Sudden 3% NAV drop from one position | Trigger defensive exit immediately |

## Limitations (honest disclosure)

- ATMA cannot defend against **smart contract exploits** of underlying protocols (USDY, Aave, MI4) faster than the exploit itself
- ATMA cannot defend against **flash loan attacks** on Mantle DEXs (Merchant Moe, Agni)
- ATMA's risk model **uses oracle data**; if oracles are themselves compromised, ATMA's reasoning is compromised
- ATMA's defensive exit **takes time** — if Mantle network is congested, recovery may be partial
- For maximum safety, users should keep portion of treasury **outside ATMA** as cold reserve

## Audit Trail

Every risk decision (including `ok` heartbeats every 5 minutes) is logged:
- On-chain: ERC-8004 ReputationRegistry events
- Off-chain: orchestrator log + frontend Reports page
- Export: CSV via Reporter Agent

This gives the user a verifiable post-mortem if defensive exit occurs.
