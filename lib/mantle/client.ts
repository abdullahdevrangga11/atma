import { createPublicClient, http, defineChain, type PublicClient } from "viem";

export const mantleSepolia = defineChain({
  id: 5003,
  name: "Mantle Sepolia",
  nativeCurrency: { name: "Mantle", symbol: "MNT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.sepolia.mantle.xyz"] },
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
    transport: http(process.env.MANTLE_SEPOLIA_RPC ?? "https://rpc.sepolia.mantle.xyz"),
  });
  return _publicClient;
}
