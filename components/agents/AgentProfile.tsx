"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Zap,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { AgentIdentity } from "@/lib/agents/identity";

type Decision = {
  runId: string;
  at: number;
  durationMs: number;
  reasoningHash: `0x${string}`;
  label: string;
  summary: string;
};

type Stats = {
  totalDecisions: number;
  avgDurationMs: number;
  fastestMs: number;
  slowestMs: number;
  firstDecisionAt: number | null;
  latestDecisionAt: number | null;
};

type StatsResponse = {
  data: { identity: AgentIdentity; stats: Stats; decisions: Decision[] };
  error: string | null;
};

const SUBTITLES: Record<AgentIdentity["slug"], string> = {
  allocator: "Treasury allocation under policy",
  risk: "Continuous risk evaluation + veto authority",
  reporter: "P&L attestation against three baselines",
};

export function AgentProfile({
  identity,
  skillContent,
}: {
  identity: AgentIdentity;
  skillContent: string;
}) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [copied, setCopied] = useState(false);
  const [skillOpen, setSkillOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/agent-stats/${identity.slug}`);
        const j = (await res.json()) as StatsResponse;
        if (!alive) return;
        setStats(j.data.stats);
        setDecisions(j.data.decisions);
      } catch {}
    };
    fetchStats();
    const id = window.setInterval(fetchStats, 8_000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [identity.slug]);

  function copyAddr() {
    navigator.clipboard.writeText(identity.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-6">
        <AgentAvatar identity={identity} />
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-2">
            // erc-8004 identity #{identity.identityId}
          </p>
          <h1 className="display-2 mb-2 !text-[44px] md:!text-[56px] leading-[1.05]">
            {identity.name}
            <span className="text-[var(--color-text-muted)] !font-normal"> #{identity.displayNumber}</span>
          </h1>
          <p className="text-[16px] text-[var(--color-text-secondary)] mb-5 max-w-[640px]">
            {SUBTITLES[identity.slug]} — reads <span className="font-mono">{identity.skillFile}</span> at every invocation.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={copyAddr}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-[var(--color-bg-soft)] border border-[var(--color-border)] hover:bg-[var(--color-bg-mid)] transition-colors font-mono text-[11px]"
            >
              <span
                className="block w-1.5 h-1.5 rounded-full"
                style={{ background: identity.accentColor }}
              />
              <span className="text-[var(--color-text-secondary)]">{identity.address.slice(0, 10)}…{identity.address.slice(-8)}</span>
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
            <Link
              href="/vault"
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-[var(--color-text)] text-white hover:bg-[var(--color-text-secondary)] transition-colors font-mono text-[11px]"
            >
              <Zap className="w-3 h-3" />
              Invoke
            </Link>
            <Link
              href="/skills"
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-white border border-[var(--color-border-strong)] hover:bg-[var(--color-bg-soft)] transition-colors font-mono text-[11px]"
            >
              <FileText className="w-3 h-3" />
              Edit skill
            </Link>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="reputation events" value={stats?.totalDecisions ?? 0} />
        <Stat label="avg duration" value={stats?.avgDurationMs ? `${stats.avgDurationMs}ms` : "—"} />
        <Stat label="fastest" value={stats?.fastestMs ? `${stats.fastestMs}ms` : "—"} />
        <Stat
          label="skill"
          value={`${skillContent.split("\n").length}L · ${skillContent.length}c`}
        />
      </div>

      {/* ERC-8004 identity card */}
      <Card>
        <CardHeader>
          <Badge variant="default">// erc-8004 reputation registry</Badge>
          <CardTitle>Identity capsule</CardTitle>
          <CardDescription>
            Pseudo on-chain identity derived from the agent name. In production this becomes
            the IdentityRegistry-issued address bound to the deployer key.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <KV label="identity_id" value={String(identity.identityId)} />
            <KV label="display_number" value={`#${identity.displayNumber}`} />
            <KV label="canonical_name" value={identity.name} mono />
            <KV label="skill_file" value={identity.skillFile} mono />
            <KV label="default_action" value={identity.verb} mono />
            <KV label="address" value={identity.address} mono />
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mt-5 mb-2">
            capabilities
          </p>
          <ul className="space-y-1.5">
            {identity.capabilities.map((c) => (
              <li key={c} className="flex items-start gap-2 text-[13px] text-[var(--color-text-secondary)]">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-primary)] mt-1 shrink-0" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Decision feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="default">
              <Activity className="w-3 h-3" />
              decisions
            </Badge>
            <Link href="/reports" className="text-[11px] font-mono text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
              full attestation feed →
            </Link>
          </div>
          <CardTitle>
            {decisions.length === 0 ? "No decisions yet" : `${decisions.length} signed event${decisions.length === 1 ? "" : "s"}`}
          </CardTitle>
          <CardDescription>
            Sourced from this deployment&apos;s in-memory run store. Trigger an orchestration on the{" "}
            <Link href="/vault" className="underline">vault page</Link> to populate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {decisions.length === 0 ? (
            <p className="text-[13px] text-[var(--color-text-muted)]">
              The feed appears once you run an orchestration.
            </p>
          ) : (
            <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
              <div className="grid grid-cols-[50px_1fr_1.4fr_2fr_0.6fr] bg-[var(--color-bg-soft)] px-5 py-3 text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] font-mono">
                <span>#</span>
                <span>event</span>
                <span>hash</span>
                <span>summary</span>
                <span className="text-right">ms</span>
              </div>
              {decisions.slice(0, 20).map((d, i) => (
                <div
                  key={`${d.runId}-${i}`}
                  className={cn(
                    "grid grid-cols-[50px_1fr_1.4fr_2fr_0.6fr] px-5 py-3 items-center text-[12px] hover:bg-[var(--color-bg-soft)] transition-colors",
                    i < decisions.length - 1 && "border-b border-[var(--color-border)]",
                  )}
                >
                  <span className="font-mono text-[var(--color-text-faint)] tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Badge variant={d.label === "DEFENSIVE_EXIT" ? "danger" : d.label === "WARN" ? "warning" : d.label === "ALLOCATE" ? "accent" : "default"}>
                    {d.label}
                  </Badge>
                  <span className="font-mono text-[var(--color-primary)] truncate text-[11px]">
                    {d.reasoningHash.slice(0, 12)}…{d.reasoningHash.slice(-6)}
                  </span>
                  <span className="text-[var(--color-text-secondary)] truncate">{d.summary}</span>
                  <span className="font-mono text-[10px] text-[var(--color-text-muted)] tabular-nums text-right">{d.durationMs}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skill source */}
      <Card>
        <CardContent className="!pt-4 !pb-4">
          <button
            onClick={() => setSkillOpen((v) => !v)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-[var(--color-text-muted)]" />
              <div>
                <p className="text-[14px] font-medium text-[var(--color-text)]">
                  Skill markdown source
                </p>
                <p className="text-[12px] text-[var(--color-text-secondary)]">
                  <span className="font-mono">skills/{identity.skillFile}</span> — read at every invocation.
                </p>
              </div>
            </div>
            <Badge variant={skillOpen ? "accent" : "outline"}>
              {skillOpen ? "hide" : "show"}
            </Badge>
          </button>

          {skillOpen && (
            <div className="mt-4 rounded-lg bg-[var(--color-bg-soft)] border border-[var(--color-border)] max-h-[420px] overflow-y-auto">
              <pre className="px-4 py-4 font-mono text-[11px] leading-[1.6] text-[var(--color-text)] whitespace-pre-wrap break-all">
                {skillContent}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-4 text-[12px] text-[var(--color-text-muted)]">
        <span>
          Pseudo address is deterministic SHA-256(name)[0:40]. Swap for an IdentityRegistry-issued
          address in a Mantle wire-up.
        </span>
        <a
          href={`https://github.com/abdullahdevrangga11/amana/blob/master/lib/agents/${identity.name}.ts`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 hover:text-[var(--color-text)]"
        >
          source <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

function AgentAvatar({ identity }: { identity: AgentIdentity }) {
  return (
    <div
      className="relative shrink-0 w-24 h-24 md:w-28 md:h-28 rounded-2xl border border-[var(--color-border)] flex items-center justify-center bg-white"
      style={{ boxShadow: `inset 0 0 0 4px ${identity.accentColor}22` }}
    >
      <div
        className="w-10 h-10 rounded-md"
        style={{ background: identity.accentColor }}
      />
      <span
        className="absolute -bottom-2 -right-2 inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-[11px] font-mono font-medium"
        style={{ background: identity.accentColor }}
      >
        #{identity.displayNumber}
      </span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg p-4 border border-[var(--color-border)] bg-[var(--color-bg-card-soft)]">
      <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-text-muted)] mb-1.5">
        {label}
      </p>
      <p className="text-[20px] font-medium tabular-nums">{value}</p>
    </div>
  );
}

function KV({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg p-3 bg-[var(--color-bg-soft)] border border-[var(--color-border)]">
      <p className="font-mono text-[9px] uppercase tracking-[0.06em] text-[var(--color-text-muted)] mb-1">
        {label}
      </p>
      <p className={cn("text-[12px] break-all", mono && "font-mono")}>{value}</p>
    </div>
  );
}
