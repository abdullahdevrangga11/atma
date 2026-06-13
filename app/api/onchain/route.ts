import { NextResponse } from "next/server";
import { readContract } from "viem/actions";
import {
  getPublicClient,
  AMANA_ADDRESSES,
  AMANA_VAULT_ABI,
  VAULT_STATE_LABELS,
  MANTLE_SEPOLIA_EXPLORER,
} from "@/lib/mantle/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Cache the last successful on-chain read so repeated loads (judges refreshing,
// multiple tabs) hit the rate-limited public RPC at most once per minute.
type OkPayload = { data: unknown; error: null };
let _cache: { at: number; payload: OkPayload } | null = null;
const CACHE_TTL_MS = 60_000;

/**
 * GET /api/onchain
 *
 * Read-only proof that AmanaVault is live on Mantle Sepolia (chain id 5003).
 * Calls public view functions over RPC. No wallet, no signing, no gas.
 * Never throws a 500 — RPC failures return { data: null, error }.
 */
export async function GET() {
  const vault = AMANA_ADDRESSES.vault;

  // Serve a fresh-enough cached read before touching RPC.
  if (_cache && Date.now() - _cache.at < CACHE_TTL_MS) {
    return NextResponse.json({ ..._cache.payload, cached: true });
  }

  try {
    const client = getPublicClient();
    const read = <T,>(functionName: string) =>
      readContract(client, {
        address: vault,
        abi: AMANA_VAULT_ABI,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        functionName: functionName as any,
      }) as Promise<T>;

    const [
      stateRaw,
      nav,
      entryNAV,
      paused,
      owner,
      operator,
      allocatorAgentId,
      riskAgentId,
      reporterAgentId,
      lastRebalanceAt,
      current,
      usdc,
      usdy,
      mUsd,
      aavePool,
      mi4,
    ] = await Promise.all([
      read<number>("state"),
      read<bigint>("nav"),
      read<bigint>("entryNAV"),
      read<boolean>("paused"),
      read<`0x${string}`>("owner"),
      read<`0x${string}`>("operator"),
      read<bigint>("allocatorAgentId"),
      read<bigint>("riskAgentId"),
      read<bigint>("reporterAgentId"),
      read<bigint>("lastRebalanceAt"),
      read<readonly [number, number, number, number]>("current"),
      read<`0x${string}`>("usdc"),
      read<`0x${string}`>("usdy"),
      read<`0x${string}`>("mUsd"),
      read<`0x${string}`>("aavePool"),
      read<`0x${string}`>("mi4"),
    ]);

    const stateIndex = Number(stateRaw);
    const stateLabel = VAULT_STATE_LABELS[stateIndex] ?? `Unknown(${stateIndex})`;

    const payload: OkPayload = {
      data: {
        chainId: 5003,
        chainName: "Mantle Sepolia",
        explorer: MANTLE_SEPOLIA_EXPLORER,
        vaultAddress: vault,
        state: { index: stateIndex, label: stateLabel },
        paused,
        // USDC has 6 decimals; expose both raw and formatted for the UI.
        nav: nav.toString(),
        navUsdc: Number(nav) / 1e6,
        entryNAV: entryNAV.toString(),
        entryNavUsdc: Number(entryNAV) / 1e6,
        lastRebalanceAt: Number(lastRebalanceAt),
        owner,
        operator,
        agentIds: {
          allocator: allocatorAgentId.toString(),
          risk: riskAgentId.toString(),
          reporter: reporterAgentId.toString(),
        },
        allocation: {
          usdyBps: current[0],
          mUsdBps: current[1],
          aaveBps: current[2],
          mi4Bps: current[3],
        },
        assets: { usdc, usdy, mUsd, aavePool, mi4 },
      },
      error: null,
    };

    _cache = { at: Date.now(), payload };
    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to read on-chain state";
    // If we have any prior successful read, serve it stale rather than fail.
    if (_cache) {
      return NextResponse.json({ ..._cache.payload, cached: true, stale: true });
    }
    return NextResponse.json({
      data: null,
      error: message,
      // Static facts so the UI can still prove deployment even if RPC is down.
      fallback: {
        chainId: 5003,
        chainName: "Mantle Sepolia",
        explorer: MANTLE_SEPOLIA_EXPLORER,
        vaultAddress: vault,
      },
    });
  }
}
