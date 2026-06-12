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
  ArrowLeft,
  Star,
  GitFork,
  Copy,
  Check,
  Sparkles,
  Activity,
  Play,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Agent = "allocator" | "risk" | "reporter";

type SkillEntry = {
  id: string;
  agent: Agent;
  title: string;
  tagline: string;
  body: string;
  author: string;
  createdAt: number;
  forkedFrom?: string;
  stars: number;
  forks: number;
  runCount: number;
};

const AGENT_META: Record<Agent, { label: string; color: string; bg: string }> = {
  allocator: { label: "Allocator", color: "#613BF9", bg: "#ede9fe" },
  risk:      { label: "Risk",      color: "#ea580c", bg: "#ffedd5" },
  reporter:  { label: "Reporter",  color: "#65a30d", bg: "#ecfccb" },
};

export function SkillDetail({ skillId }: { skillId: string }) {
  const [entry, setEntry] = useState<SkillEntry | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [forkOpen, setForkOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/marketplace/${skillId}`)
      .then(async (res) => {
        const j = (await res.json()) as { data: SkillEntry | null; error: string | null };
        if (!alive) return;
        if (!res.ok || !j.data) setNotFound(true);
        else setEntry(j.data);
      })
      .catch(() => setNotFound(true));
    return () => {
      alive = false;
    };
  }, [skillId]);

  async function star() {
    if (!entry) return;
    setEntry({ ...entry, stars: entry.stars + 1 });
    await fetch(`/api/marketplace/${entry.id}/star`, { method: "POST" });
  }

  function copyBody() {
    if (!entry) return;
    navigator.clipboard.writeText(entry.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  if (notFound) {
    return (
      <Card>
        <CardHeader>
          <Badge variant="default">// 404</Badge>
          <CardTitle>Skill not found</CardTitle>
          <CardDescription>
            <span className="font-mono">{skillId}</span> isn&apos;t in the marketplace store on
            this deployment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/marketplace">
            <Button variant="default">
              <ArrowLeft className="w-3 h-3" />
              Browse marketplace
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!entry) {
    return (
      <div className="flex items-center justify-center py-24">
        <Sparkles className="w-5 h-5 text-[var(--color-primary)] animate-pulse" />
      </div>
    );
  }

  const meta = AGENT_META[entry.agent];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-3">
            // marketplace · {entry.id.slice(0, 10)}
          </p>
          <h1 className="display-2 !text-[34px] md:!text-[44px] leading-[1.05] mb-3">
            {entry.title}
          </h1>
          <p className="text-[15px] text-[var(--color-text-secondary)] max-w-[640px] mb-5 leading-relaxed">
            {entry.tagline}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[12px]">
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-[10px] uppercase tracking-[0.08em]"
              style={{ background: meta.bg, color: meta.color }}
            >
              {meta.label}
            </span>
            <Badge variant="outline">@{entry.author}</Badge>
            {entry.forkedFrom && (
              <Link href={`/marketplace/${entry.forkedFrom}`}>
                <Badge variant="default">
                  <GitFork className="w-3 h-3" />
                  forked
                </Badge>
              </Link>
            )}
            <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-text-muted)] inline-flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {relTime(entry.createdAt)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={star} variant="outline" size="sm">
            <Star className="w-3 h-3" />
            {entry.stars}
          </Button>
          <Button onClick={() => setForkOpen(true)} variant="outline" size="sm">
            <GitFork className="w-3 h-3" />
            Fork
          </Button>
          <Button onClick={copyBody} size="sm">
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied" : "Copy markdown"}
          </Button>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={<Star className="w-3.5 h-3.5" />} label="stars" value={entry.stars.toString()} />
        <Stat icon={<GitFork className="w-3.5 h-3.5" />} label="forks" value={entry.forks.toString()} />
        <Stat icon={<Activity className="w-3.5 h-3.5" />} label="runs with this skill" value={entry.runCount.toString()} />
        <Stat label="bytes" value={`${entry.body.length}`} />
      </div>

      {/* Body */}
      <Card>
        <CardHeader>
          <Badge variant="default">// skill markdown</Badge>
          <CardTitle>The policy itself</CardTitle>
          <CardDescription>
            What the agent reads at runtime. Edit a fork to change behaviour, no redeploy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="rounded-lg bg-[var(--color-bg-soft)] border border-[var(--color-border)] p-5 font-mono text-[12px] leading-[1.6] text-[var(--color-text)] overflow-x-auto whitespace-pre-wrap">
            {entry.body}
          </pre>
        </CardContent>
      </Card>

      {/* Action strip */}
      <Card>
        <CardContent className="!pt-4 !pb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium">Try this skill in the playground</p>
            <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5">
              Paste the markdown above into /skills, run a comparison vs the committed default.
            </p>
          </div>
          <Link href="/skills">
            <Button size="sm">
              <Play className="w-3 h-3" />
              Open playground
            </Button>
          </Link>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-[12px] text-[var(--color-text-muted)]">
        <Link href="/marketplace" className="inline-flex items-center gap-1 hover:text-[var(--color-text)]">
          <ArrowLeft className="w-3 h-3" />
          back to all skills
        </Link>
        <span>{new Date(entry.createdAt).toLocaleString()}</span>
      </div>

      {forkOpen && (
        <ForkDialog
          parent={entry}
          onClose={() => setForkOpen(false)}
          onForked={(newId) => {
            setForkOpen(false);
            // Bump parent fork count optimistically
            setEntry((e) => (e ? { ...e, forks: e.forks + 1 } : e));
            window.location.assign(`/marketplace/${newId}`);
          }}
        />
      )}
    </div>
  );
}

function Stat({
  icon, label, value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg p-4 border border-[var(--color-border)] bg-[var(--color-bg-card-soft)]">
      <div className="flex items-center gap-2 mb-1.5 text-[var(--color-text-muted)]">
        {icon}
        <span className="font-mono text-[10px] uppercase tracking-[0.06em]">{label}</span>
      </div>
      <p className="text-[22px] font-medium tabular-nums">{value}</p>
    </div>
  );
}

function ForkDialog({
  parent, onClose, onForked,
}: {
  parent: SkillEntry;
  onClose: () => void;
  onForked: (newId: string) => void;
}) {
  const [author, setAuthor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/marketplace/${parent.id}/fork`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author }),
      });
      const j = (await res.json()) as { data: SkillEntry | null; error: string | null };
      if (!res.ok || !j.data) throw new Error(j.error ?? "Failed");
      onForked(j.data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-[420px] w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[var(--color-border)]">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-1">
            // fork
          </p>
          <h2 className="text-[18px] font-medium leading-snug">
            Fork &quot;{parent.title}&quot;
          </h2>
          <p className="text-[12px] text-[var(--color-text-secondary)] mt-2">
            Creates a derivative entry attributed to you. You can edit it later.
          </p>
        </div>
        <div className="p-6 space-y-4">
          <label className="block">
            <span className="text-[12px] font-medium mb-2 block">Your handle</span>
            <input
              value={author}
              onChange={(e) =>
                setAuthor(e.target.value.replace(/[^a-z0-9-_]/gi, "").toLowerCase())
              }
              placeholder="yourname"
              className={cn(
                "h-9 w-full px-3 rounded-lg border bg-white font-mono text-[13px]",
                "border-[var(--color-border-strong)] focus:border-[var(--color-primary)] focus:outline-none",
              )}
            />
          </label>
          {error && (
            <div className="rounded-lg p-3 bg-red-50 border border-red-200 text-[13px] text-red-700">
              {error}
            </div>
          )}
        </div>
        <div className="p-6 border-t border-[var(--color-border)] flex justify-end gap-2 bg-[var(--color-bg-soft)] rounded-b-2xl">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={submitting || author.length < 2}>
            {submitting ? "Forking…" : "Fork it"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function relTime(at: number): string {
  const diff = Date.now() - at;
  const s = Math.round(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}
