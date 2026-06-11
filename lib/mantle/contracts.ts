/**
 * Minimal ABI fragments for AtmaVault — keeps API small for read calls and writes.
 * Full ABI lives in contracts/out/AtmaVault.sol/AtmaVault.json after `forge build`.
 */

export const atmaVaultAbi = [
  // Reads
  {
    type: "function",
    name: "state",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "nav",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "entryNAV",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "operator",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "currentAllocation",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "usdyBps", type: "uint16" },
          { name: "mUsdBps", type: "uint16" },
          { name: "aaveBps", type: "uint16" },
          { name: "mi4Bps", type: "uint16" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "allocatorAgentId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "riskAgentId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "reporterAgentId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  // Writes
  {
    type: "function",
    name: "deposit",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "propose",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "weights",
        type: "tuple",
        components: [
          { name: "usdyBps", type: "uint16" },
          { name: "mUsdBps", type: "uint16" },
          { name: "aaveBps", type: "uint16" },
          { name: "mi4Bps", type: "uint16" },
        ],
      },
      { name: "reasoningHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "executeAllocation",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  // Events
  {
    type: "event",
    name: "ReputationEvent",
    inputs: [
      { name: "agentId", type: "uint256", indexed: true },
      { name: "eventType", type: "string", indexed: true },
      { name: "reasoningHash", type: "bytes32", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "AllocationProposed",
    inputs: [
      { name: "agentId", type: "uint256", indexed: true },
      {
        name: "weights",
        type: "tuple",
        indexed: false,
        components: [
          { name: "usdyBps", type: "uint16" },
          { name: "mUsdBps", type: "uint16" },
          { name: "aaveBps", type: "uint16" },
          { name: "mi4Bps", type: "uint16" },
        ],
      },
      { name: "reasoningHash", type: "bytes32", indexed: false },
    ],
  },
] as const;

export const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

export const VAULT_STATE_LABELS = [
  "Idle",
  "Analyzing",
  "Proposing",
  "Executing",
  "Attesting",
  "Allocated",
  "Rebalancing",
  "RiskTriggered",
  "Withdrawing",
  "DefensiveExit",
  "Completed",
] as const;
