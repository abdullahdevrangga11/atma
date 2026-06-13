import { createPublicClient, http, fallback, defineChain, type PublicClient } from "viem";

// Multiple Mantle Sepolia RPC endpoints. The official one is heavily
// rate-limited from shared serverless IPs (e.g. Vercel), so we fall through a
// list and viem retries the next URL on failure. MANTLE_SEPOLIA_RPC (if set)
// is tried first.
const MANTLE_SEPOLIA_RPCS = [
  process.env.MANTLE_SEPOLIA_RPC,
  "https://mantle-sepolia.drpc.org",
  "https://endpoints.omniatech.io/v1/mantle/sepolia/public",
  "https://mantle-sepolia.gateway.tenderly.co",
  "https://rpc.sepolia.mantle.xyz",
].filter(Boolean) as string[];

export const mantleSepolia = defineChain({
  id: 5003,
  name: "Mantle Sepolia",
  nativeCurrency: { name: "Mantle", symbol: "MNT", decimals: 18 },
  rpcUrls: {
    default: { http: MANTLE_SEPOLIA_RPCS },
  },
  blockExplorers: {
    default: { name: "Mantle Sepolia Explorer", url: "https://sepolia.mantlescan.xyz" },
  },
  testnet: true,
});

export const mantleMainnet = defineChain({
  id: 5000,
  name: "Mantle",
  nativeCurrency: { name: "Mantle", symbol: "MNT", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.mantle.xyz"] } },
  blockExplorers: {
    default: { name: "Mantle Explorer", url: "https://mantlescan.xyz" },
  },
});

let _publicClient: PublicClient | null = null;
export function getPublicClient(): PublicClient {
  if (_publicClient) return _publicClient;
  _publicClient = createPublicClient({
    chain: mantleSepolia,
    // Fallback transport: tries each RPC in order, retries the next on failure
    // (rate limit, timeout). rank=false keeps the declared priority order.
    transport: fallback(
      MANTLE_SEPOLIA_RPCS.map((url) => http(url, { timeout: 8000, retryCount: 1 })),
      { rank: false },
    ),
  });
  return _publicClient;
}

// ───────────────────────────────────────────────────────────────────────────
//  Deployed addresses (Mantle Sepolia, chain id 5003).
//  Read from NEXT_PUBLIC_* env, with a hardcoded fallback to the live
//  deployment so read-only proofs work even when env is missing.
// ───────────────────────────────────────────────────────────────────────────

export const MANTLE_SEPOLIA_EXPLORER = "https://sepolia.mantlescan.xyz";

export const AMANA_ADDRESSES = {
  vault: (process.env.NEXT_PUBLIC_AMANA_VAULT ??
    "0xAC104718167145E4f315EA78c49285870bA66615") as `0x${string}`,
  usdc: (process.env.NEXT_PUBLIC_USDC ??
    "0x2f616227b6628b910dc29dE88079246117b411b1") as `0x${string}`,
  usdy: (process.env.NEXT_PUBLIC_USDY ??
    "0x50a7dD6F389B26Ac6Fe7ff800a6cBb646e1CEb08") as `0x${string}`,
  mUsd: (process.env.NEXT_PUBLIC_MUSD ??
    "0x7c35F56Fe7610E38D3e0A021425f2860aB586234") as `0x${string}`,
  aavePool: (process.env.NEXT_PUBLIC_AAVE_POOL ??
    "0xAE62959704f07EC09c661105176794D0C0F0F346") as `0x${string}`,
  mi4: (process.env.NEXT_PUBLIC_MI4 ??
    "0xa653e5113c6a6eD1f222D9a4713b8b0654F72917") as `0x${string}`,
} as const;

/**
 * Minimal read-only ABI for the AmanaVault, taken from the deployed contract's
 * public view functions (contracts/out/AmanaVault.sol/AmanaVault.json).
 * Only the view functions used by the on-chain proof are included.
 */
export const AMANA_VAULT_ABI = [
  { type: "function", name: "state", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "nav", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "entryNAV", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "paused", stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },
  { type: "function", name: "owner", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "operator", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "allocatorAgentId", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "riskAgentId", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "reporterAgentId", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "lastRebalanceAt", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "usdc", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "usdy", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "mUsd", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "aavePool", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "mi4", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  {
    type: "function",
    name: "current",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { type: "uint16", name: "usdyBps" },
      { type: "uint16", name: "mUsdBps" },
      { type: "uint16", name: "aaveBps" },
      { type: "uint16", name: "mi4Bps" },
    ],
  },
] as const;

/** Human labels for the VaultState enum (see AmanaVault.sol). Index = enum value. */
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
