# AMANA — Technical Evidence for Judges

Treasury orchestration protocol for Mantle. Solidity ERC-4626-style vault,
three TypeScript AI agents (Allocator, Risk, Reporter), Next.js frontend.

This document maps verified technical facts to the hackathon's Technical
dimension (30% weight, the heaviest), and gives an exact runbook to put the
contract live on Mantle Sepolia so the "runs end-to-end ON THE MANTLE NETWORK"
bar is met.

> Honesty note: every number below was verified by actually building and
> running the suites on 2026-06-13, not estimated. Commands are reproducible.

---

## 1. Technical evidence (verified facts → rubric)

### Complete, tested business-logic loop

The vault implements the full loop the rubric asks for, and every transition is
covered by a passing test:

`deposit -> propose (allocate) -> executeAllocation -> rebalance / monitor ->
triggerDefensiveExit (risk) -> recordReport -> withdraw`

- **Deposit**: `deposit(amount)` (owner-only, transitions `Idle -> Analyzing`).
- **Allocate**: `propose(weights, reasoningHash)` then
  `executeAllocation()` routes USDC across USDY / mUSD / Aave V3 / MI4 by basis
  points (`Proposing -> Executing -> Attesting -> Allocated`).
- **Rebalance / monitor**: `rebalance(newWeights, reasoningHash)` with a 24h
  cadence guard; `nav()` view re-prices all positions in USDC.
- **Risk**: `triggerDefensiveExit(riskSignalHash)` unwinds everything to USDC
  (`Allocated -> RiskTriggered -> DefensiveExit`).
- **Report**: `recordReport(reportHash)` emits the ERC-8004-style attestation.
- **Withdraw**: `withdraw()` unwinds and pays the owner (`-> Completed`).
- **Safety valve**: `emergencyExit()` (owner) force-unwinds from any state.

An 11-state on-chain state machine (`VaultState` enum) gates every transition
and emits `StateChanged(from, to)`, so the demo UI can render live progress.

There are **no missing pieces** in the loop. The single gap is operational, not
code: the contract is **not yet deployed to Mantle Sepolia** (see Section 2).

### Test coverage (verified, not estimated)

| Suite | Command | Result |
|---|---|---|
| Foundry (Solidity) | `cd contracts && forge build && forge test` | **45 passed, 0 failed, 0 skipped** |
| Frontend / agents (Vitest) | `node_modules/.bin/vitest run` | **55 passed across 8 files** |

**Total: 100 passing tests, 0 failures.** Foundry suite runs in ~16ms; the
build compiles clean under solc 0.8.24 (only non-blocking lint advisories on
`block.timestamp` cadence and a mock typecast).

The Foundry suite exercises the whole loop, not just happy paths: access
control (owner vs operator vs stranger), invalid-weights reverts, wrong-state
reverts, the 24h rebalance guard, NAV growth after simulated yield, defensive
exit recovery, pause/unpause, and a full `Idle -> Completed` cycle trace
(`test_fullCycle_idle_to_completed`).

### Code size (verified)

- `contracts/src/AmanaVault.sol`: **385 lines**.
- `contracts/test/AmanaVault.t.sol`: **498 lines** (more test than contract).
- All Solidity under `contracts/src/`: **626 lines** (vault + 5 mock assets +
  interfaces).

### Security patterns used (verified in source)

`AmanaVault is Ownable, Pausable, ReentrancyGuard` (OpenZeppelin), with:

- **ReentrancyGuard**: `nonReentrant` on every value-moving function
  (`deposit`, `withdraw`, `executeAllocation`, `rebalance`,
  `triggerDefensiveExit`, `emergencyExit`).
- **Ownable**: owner-gated deposit/withdraw/admin; `Ownable(_initialOwner)`
  constructor (OZ v5 style).
- **Pausable**: `whenNotPaused` on all user/agent entrypoints; owner
  `pause()`/`unpause()`. `emergencyExit()` deliberately stays callable while
  paused.
- **SafeERC20**: `safeTransfer` / `safeTransferFrom` / `forceApprove`
  throughout (no raw ERC20 calls).
- **Custom-error reverts** (gas-cheap) plus an `inState` modifier so invalid
  transitions fail loudly.
- **Role separation**: owner (custody) vs `operator` (the off-chain agent
  orchestrator) are distinct addresses; agents can propose/rebalance/exit but
  cannot move funds out to an arbitrary party.

### Standards usage (verified)

- **ERC-4626-style vault semantics**: single-asset (USDC) deposit/allocate/NAV/
  withdraw accounting; `nav()` prices every position back to USDC via
  `pricePerShare()`.
- **ERC-8004-style attestations**: every agent decision emits
  `ReputationEvent(agentId, eventType, reasoningHash, timestamp)` indexed by
  agent ID, with `eventType` in `{ALLOCATE, REBALANCE, RISK, EXIT, REPORT}`.
  Agent identities are stored on-chain (`allocatorAgentId`, `riskAgentId`,
  `reporterAgentId`) and exposed via `agentIds()`. This makes each AI decision
  independently queryable / auditable on-chain, which is the differentiator for
  an agent-native protocol.

### Mapping to the Technical rubric

- "Core functionality must run end-to-end ON THE MANTLE NETWORK" → the loop is
  complete and tested; Section 2 makes it live on chain 5003. **This is the one
  action that converts a strong codebase into a passing Technical score.**
- "production-ready with a clear and complete business logic loop" → 11-state
  machine, 45 contract tests, reentrancy/pause/ownable hardening, SafeERC20,
  emergency exit. More test lines than contract lines.
- AI-agent depth → three agents emit on-chain ERC-8004 attestations with
  reasoning hashes, so the "agent did this and here's why" claim is verifiable
  on chain, not just in the UI.

---

## 2. DEPLOY RUNBOOK — Mantle Sepolia (chain id 5003)

> Status as of audit: **NOT yet deployed** (no `contracts/broadcast/` artifacts,
> `NEXT_PUBLIC_AMANA_VAULT_ADDRESS` empty). Do NOT run the broadcast until the
> deployer wallet holds Sepolia MNT. This is the single biggest Technical risk;
> closing it takes ~10 minutes once the wallet is funded.

### Network facts (verified)

- RPC: `https://rpc.sepolia.mantle.xyz` (returns chain id **5003**, confirmed
  via `cast chain-id`).
- Explorer: `https://sepolia.mantlescan.xyz`
- Faucet: `https://faucet.sepolia.mantle.xyz`
- Gas token: MNT (~0.1 MNT is plenty for this deploy).

### Step 0 — one-time prereqs

```bash
# Foundry (if not installed)
curl -L https://foundry.paradigm.xyz | bash && foundryup
export PATH="$HOME/.foundry/bin:$PATH"

# Ensure git submodules (OpenZeppelin + forge-std) are present
cd /Users/devranggahazzamahiswara/Documents/code/atma
git submodule update --init --recursive
```

### Step 1 — fund the deployer wallet (FAUCET)

1. Get the deployer address from your `PRIVATE_KEY`:
   ```bash
   export PATH="$HOME/.foundry/bin:$PATH"
   cast wallet address --private-key 0xYOUR_PRIVATE_KEY
   ```
2. Open `https://faucet.sepolia.mantle.xyz`, paste that address, request MNT.
3. Confirm the balance is non-zero before broadcasting:
   ```bash
   cast balance 0xYOUR_DEPLOYER_ADDRESS --rpc-url https://rpc.sepolia.mantle.xyz
   ```
   (Must be > 0. If it is 0, the broadcast WILL fail.)

### Step 2 — set deploy env vars

The deploy script (`contracts/script/Deploy.s.sol`) reads `PRIVATE_KEY` via
`vm.envUint("PRIVATE_KEY")`. For `--verify`, foundry.toml reads
`MANTLESCAN_API_KEY`.

```bash
cd /Users/devranggahazzamahiswara/Documents/code/atma/contracts
export PATH="$HOME/.foundry/bin:$PATH"
export PRIVATE_KEY=0xYOUR_DEPLOYER_KEY          # holds the faucet MNT
export MANTLESCAN_API_KEY=YOUR_MANTLESCAN_KEY   # only needed for --verify
```

### Step 3 — build, then broadcast

```bash
# Always build first
forge build

# Dry run (no broadcast) — confirms the script simulates cleanly
forge script script/Deploy.s.sol --rpc-url mantle_sepolia

# Real deploy
forge script script/Deploy.s.sol --rpc-url mantle_sepolia --broadcast --verify
```

What this deploys (single tx batch): MockUSDC, MockUSDY, MockMUSD,
MockAavePool, MockMI4, seeds each mock pool with 100k USDC liquidity, mints 10k
demo USDC to the deployer, deploys `AmanaVault` (deployer = owner + operator),
and calls `setAgentIds(1001, 2002, 3003)`.

If `--verify` flakes (Mantlescan can be slow), deploy without it and verify
later:
```bash
forge verify-contract <VAULT_ADDRESS> src/AmanaVault.sol:AmanaVault \
  --chain 5003 --verifier-url https://api-sepolia.mantlescan.xyz/api \
  --etherscan-api-key $MANTLESCAN_API_KEY
```

### Step 4 — verify the tx on the explorer

The script prints every address. Capture them. Then:

- Open `https://sepolia.mantlescan.xyz/address/<AmanaVault address>` and confirm
  the contract creation tx is `Success`.
- Confirm `AgentIdsUpdated(1001, 2002, 3003)` shows under the contract's events.
- Sanity-check on-chain state without a UI:
  ```bash
  cast call <VAULT_ADDRESS> "state()(uint8)" --rpc-url https://rpc.sepolia.mantle.xyz   # expect 0 (Idle)
  cast call <VAULT_ADDRESS> "agentIds()(uint256[3])" --rpc-url https://rpc.sepolia.mantle.xyz  # expect [1001,2002,3003]
  ```

### Step 5 — wire deployed addresses into Vercel

The script prints a ready-to-paste block. Add each to Vercel (Project →
Settings → Environment Variables, Production scope), or via CLI:

```bash
cd /Users/devranggahazzamahiswara/Documents/code/atma
for kv in \
  NEXT_PUBLIC_AMANA_VAULT_ADDRESS=0x... \
  NEXT_PUBLIC_MOCK_USDC_ADDRESS=0x... \
  NEXT_PUBLIC_MOCK_USDY_ADDRESS=0x... \
  NEXT_PUBLIC_MOCK_MUSD_ADDRESS=0x... \
  NEXT_PUBLIC_MOCK_AAVE_ADDRESS=0x... \
  NEXT_PUBLIC_MOCK_MI4_ADDRESS=0x... \
  NEXT_PUBLIC_ALLOCATOR_AGENT_ID=1001 \
  NEXT_PUBLIC_RISK_AGENT_ID=2002 \
  NEXT_PUBLIC_REPORTER_AGENT_ID=3003 ; do
  echo "${kv#*=}" | vercel env add "${kv%%=*}" production
done
vercel --prod   # redeploy so the new env is baked in
```

Also keep them in local `.env.local` for parity (the forge script appends them
there too).

### Step 6 — drive one real on-chain transaction (proves the loop on Mantle)

After deploy, the deployer is both owner and operator, so you can run the whole
loop from the CLI against Mantle Sepolia:

```bash
export V=<VAULT_ADDRESS> ; export U=<USDC_ADDRESS>
RPC=https://rpc.sepolia.mantle.xyz

# deposit 1000 USDC (6 decimals)
cast send $U "approve(address,uint256)" $V 1000000000 --rpc-url $RPC --private-key $PRIVATE_KEY
cast send $V "deposit(uint256)" 1000000000 --rpc-url $RPC --private-key $PRIVATE_KEY

# propose + execute an allocation
cast send $V "propose((uint16,uint16,uint16,uint16),bytes32)" "(3408,3000,3592,0)" 0x$(echo -n demo | xxd -p | head -c64) --rpc-url $RPC --private-key $PRIVATE_KEY
cast send $V "executeAllocation()" --rpc-url $RPC --private-key $PRIVATE_KEY

# record a report, then withdraw
cast send $V "recordReport(bytes32)" 0x0000000000000000000000000000000000000000000000000000000000000001 --rpc-url $RPC --private-key $PRIVATE_KEY
cast send $V "withdraw()" --rpc-url $RPC --private-key $PRIVATE_KEY
```

Each `cast send` returns a tx hash you can open on Mantlescan. That is your
on-chain proof.

---

## 3. "Proves end-to-end on Mantle" demo checklist

Tick these live during the demo / record them in the submission:

- [ ] `AmanaVault` contract address opens on `sepolia.mantlescan.xyz` with a
      `Success` creation tx (chain id 5003).
- [ ] Contract source is **verified** on Mantlescan (green check), or a
      `forge verify-contract` command was run.
- [ ] `agentIds()` returns `[1001, 2002, 3003]` on chain (ERC-8004 identities
      live).
- [ ] A real **deposit** tx hash exists on Mantlescan (USDC moved into the
      vault on Mantle).
- [ ] A real **executeAllocation** tx hash exists, emitting `AllocationExecuted`
      + `ReputationEvent("ALLOCATE", ...)`.
- [ ] A real **ReputationEvent** (ALLOCATE / REBALANCE / RISK / REPORT) is
      visible under the contract's Events tab — the ERC-8004 attestation on
      chain.
- [ ] A real **withdraw** (or `triggerDefensiveExit`) tx hash exists, closing
      the loop back to USDC.
- [ ] The deployed addresses are set in **Vercel production env** and the live
      site (`amana-iota.vercel.app`) reads them.
- [ ] `forge test` shows **45/45 passing**; `vitest run` shows **55/55
      passing** (re-run on camera if time allows).

---

## 4. Gaps that would cap the Technical score (and the fix)

| Gap | Impact | Fix | Effort |
|---|---|---|---|
| **Contract not deployed to Mantle Sepolia** | The rubric's hard requirement ("must run end-to-end ON THE MANTLE NETWORK") is unmet; this alone can cap Technical regardless of code quality. | Fund deployer via faucet, run Section 2 Steps 1-3. | ~10 min once funded |
| No verified source on Mantlescan | Judges cannot read the contract on chain; weakens "production-ready". | `--verify` flag or Step 3 `forge verify-contract`. | ~5 min |
| No real on-chain tx trail | "End-to-end on Mantle" needs actual tx hashes, not just a deployed bytecode. | Run Section 2 Step 6 (deposit → allocate → report → withdraw via cast). | ~10 min |
| Vercel env not wired to deployed addresses | Live site can't show real chain data during demo. | Section 2 Step 5. | ~5 min |

None of these require new code. The contract logic and tests are complete; the
remaining work is operational deployment, comfortably inside a ~2-day window
(in practice under an hour once the wallet is funded).

Non-blocking (do NOT spend the 2 days here): the `block.timestamp` cadence
lint and the mock typecast lint are advisory only and standard for this design.
Multi-user vault is explicitly deferred to V2 per the contract's own NatSpec and
is not required by the rubric.
