"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, CircleDot, ShieldCheck } from "lucide-react";

// ───────────────────────────────────────────────────────────
//  Static fallback facts (used if the RPC read fails). These
//  always prove the deployment even with zero on-chain data.
// ───────────────────────────────────────────────────────────

const VAULT_ADDRESS = "0xAC104718167145E4f315EA78c49285870bA66615";
const EXPLORER = "https://sepolia.mantlescan.xyz";
const VAULT_EXPLORER_URL = `${EXPLORER}/address/${VAULT_ADDRESS}`;

type OnChainData = {
  chainId: number;
  chainName: string;
  explorer: string;
  vaultAddress: string;
  state: { index: number; label: string };
  paused: boolean;
  navUsdc: number;
  entryNavUsdc: number;
  lastRebalanceAt: number;
  owner: string;
  operator: string;
  agentIds: { allocator: string; risk: string; reporter: string };
  allocation: { usdyBps: number; mUsdBps: number; aaveBps: number; mi4Bps: number };
  assets: { usdc: string; usdy: string; mUsd: string; aavePool: string; mi4: string };
};

type ApiResponse = { data: OnChainData | null; error: string | null };

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function usd(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function OnChainProof() {
  const [data, setData] = useState<OnChainData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/onchain")
      .then((r) => r.json() as Promise<ApiResponse>)
      .then((res) => {
        if (alive && res.data) setData(res.data);
      })
      .catch(() => {
        /* falls through to static fallback below */
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="default">
            <ShieldCheck className="w-3 h-3" />
            on-chain on mantle sepolia
          </Badge>
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
            chain id 5003 · read-only
          </span>
        </div>
        <CardTitle>Verifiable on-chain state</CardTitle>
        <CardDescription>
          Read live over RPC from the deployed{" "}
          <span className="font-mono">AmanaVault.sol</span> on Mantle Sepolia. No wallet,
          no signing, no gas. Every value below is fetched from the contract at{" "}
          <span className="font-mono">{short(VAULT_ADDRESS)}</span>.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 py-6 text-[13px] text-[var(--color-text-muted)]">
            <Loader2 className="w-4 h-4 animate-spin" />
            Reading live contract state from Mantle Sepolia…
          </div>
        ) : data ? (
          <div className="space-y-5">
            {/* Top row: live state + NAV */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat
                label="vault state"
                value={data.state.label}
                accent
                icon={<CircleDot className="w-3 h-3 text-[var(--color-success)]" />}
              />
              <Stat label="NAV (USDC)" value={`$${usd(data.navUsdc)}`} />
              <Stat label="entry NAV" value={`$${usd(data.entryNavUsdc)}`} />
              <Stat label="paused" value={data.paused ? "yes" : "no"} />
            </div>

            {/* Agent IDs */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-2">
                ERC-8004 agent IDs
              </p>
              <div className="grid grid-cols-3 gap-3">
                <Stat label="allocator" value={`#${data.agentIds.allocator}`} mono />
                <Stat label="risk" value={`#${data.agentIds.risk}`} mono />
                <Stat label="reporter" value={`#${data.agentIds.reporter}`} mono />
              </div>
            </div>

            {/* Asset addresses */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-2">
                wired asset contracts
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <AddrRow label="USDC" addr={data.assets.usdc} explorer={data.explorer} />
                <AddrRow label="USDY" addr={data.assets.usdy} explorer={data.explorer} />
                <AddrRow label="mUSD" addr={data.assets.mUsd} explorer={data.explorer} />
                <AddrRow label="Aave" addr={data.assets.aavePool} explorer={data.explorer} />
                <AddrRow label="MI4" addr={data.assets.mi4} explorer={data.explorer} />
                <AddrRow label="owner" addr={data.owner} explorer={data.explorer} />
              </div>
            </div>

            <MantlescanLink />
          </div>
        ) : (
          // Graceful static fallback — proves deployment even if RPC is down.
          <div className="space-y-4">
            <div className="rounded-lg p-4 border border-[var(--color-border)] bg-[var(--color-bg-card-soft)]">
              <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
                Contract deployed at{" "}
                <span className="font-mono text-[var(--color-text)]">{short(VAULT_ADDRESS)}</span>{" "}
                on Mantle Sepolia (chain id 5003). Live RPC read is momentarily
                unavailable, verify the deployment directly on Mantlescan.
              </p>
            </div>
            <MantlescanLink />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MantlescanLink() {
  return (
    <a
      href={VAULT_EXPLORER_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-invert)] text-[var(--color-text-on-invert)] font-mono text-[12px] uppercase tracking-[0.06em] hover:opacity-90 transition-opacity"
    >
      View AmanaVault on Mantlescan
      <ExternalLink className="w-3.5 h-3.5" />
    </a>
  );
}

function Stat({
  label,
  value,
  accent,
  mono,
  icon,
}: {
  label: string;
  value: string;
  accent?: boolean;
  mono?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg p-3 border border-[var(--color-border)] bg-[var(--color-bg-card-soft)]">
      <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-1 flex items-center gap-1.5">
        {icon}
        {label}
      </p>
      <p
        className={`text-[16px] leading-none ${mono ? "font-mono tabular-nums" : "font-medium"} ${
          accent ? "text-[var(--color-text)]" : "text-[var(--color-text)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function AddrRow({
  label,
  addr,
  explorer,
}: {
  label: string;
  addr: string;
  explorer: string;
}) {
  return (
    <a
      href={`${explorer}/address/${addr}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between gap-2 rounded-md px-2.5 py-2 border border-[var(--color-border)] bg-[var(--color-bg-soft)] hover:border-[var(--color-border-strong)] transition-colors group"
    >
      <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
        {label}
      </span>
      <span className="font-mono text-[11px] tabular-nums text-[var(--color-text-secondary)] group-hover:text-[var(--color-text)] flex items-center gap-1">
        {short(addr)}
        <ExternalLink className="w-3 h-3 opacity-60" />
      </span>
    </a>
  );
}
