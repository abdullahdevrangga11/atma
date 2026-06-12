"use client";

import { useEffect, useMemo, useState } from "react";
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
  Star,
  GitFork,
  Sparkles,
  Plus,
  Upload,
  Activity,
  LayoutGrid,
  GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ForkLineage } from "./ForkLineage";

/**
 * Marketplace browser — list + filter + sort + publish.
 *
 * All persistence is server-side via /api/marketplace; this component just
 * caches in component state, polls every 8s, and POSTs back when the user
 * stars, forks, or publishes.
 */

type Agent = "allocator" | "risk" | "reporter";
type Sort = "stars" | "forks" | "new";

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
  allocator: { label: "Allocator", color: "#5b3df0", bg: "#ede9fe" },
  risk:      { label: "Risk",      color: "#ea580c", bg: "#ffedd5" },
  reporter:  { label: "Reporter",  color: "#65a30d", bg: "#ecfccb" },
};

export function MarketplaceBrowser() {
  const [agent, setAgent] = useState<Agent | "all">("all");
  const [sort, setSort] = useState<Sort>("stars");
  const [entries, setEntries] = useState<SkillEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishOpen, setPublishOpen] = useState(false);
  const [view, setView] = useState<"grid" | "lineage">("grid");

  const fetchEntries = useMemo(() => {
    return async () => {
      const params = new URLSearchParams({ sort });
      if (agent !== "all") params.set("agent", agent);
      const res = await fetch(`/api/marketplace?${params.toString()}`);
      const j = (await res.json()) as { data: { entries: SkillEntry[]; total: number } };
      setEntries(j.data.entries);
      setLoading(false);
    };
  }, [agent, sort]);

  useEffect(() => {
    let alive = true;
    fetchEntries();
    const id = window.setInterval(() => {
      if (alive) fetchEntries();
    }, 8_000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [fetchEntries]);

  async function star(id: string) {
    // Optimistic update
    setEntries((arr) =>
      arr.map((e) => (e.id === id ? { ...e, stars: e.stars + 1 } : e)),
    );
    try {
      await fetch(`/api/marketplace/${id}/star`, { method: "POST" });
    } catch {
      // Roll back
      setEntries((arr) =>
        arr.map((e) => (e.id === id ? { ...e, stars: Math.max(0, e.stars - 1) } : e)),
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* View switcher */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex rounded-full border border-[var(--color-border)] bg-white p-1">
          <button
            onClick={() => setView("grid")}
            className={cn(
              "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full font-mono text-[11px] uppercase tracking-[0.06em] transition-colors",
              view === "grid"
                ? "bg-[var(--color-text)] text-white"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]",
            )}
          >
            <LayoutGrid className="w-3 h-3" />
            Grid
          </button>
          <button
            onClick={() => setView("lineage")}
            className={cn(
              "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full font-mono text-[11px] uppercase tracking-[0.06em] transition-colors",
              view === "lineage"
                ? "bg-[var(--color-text)] text-white"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]",
            )}
          >
            <GitBranch className="w-3 h-3" />
            Lineage
          </button>
        </div>
        <Button size="sm" onClick={() => setPublishOpen(true)}>
          <Upload className="w-3 h-3" />
          Publish skill
        </Button>
      </div>

      {view === "lineage" ? (
        <ForkLineage />
      ) : (
      <>
      {/* Filter bar */}
      <Card>
        <CardContent className="!pt-4 !pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-1.5">
              {(["all", "allocator", "risk", "reporter"] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => setAgent(a)}
                  className={cn(
                    "px-3 py-1.5 rounded-full font-mono text-[11px] uppercase tracking-[0.06em] transition-colors",
                    agent === a
                      ? "bg-[var(--color-text)] text-white"
                      : "bg-[var(--color-bg-soft)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-mid)]",
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-2 text-[12px]">
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
                sort
              </span>
              {(["stars", "forks", "new"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-mono text-[11px] transition-colors",
                    sort === s
                      ? "bg-[var(--color-primary-tint)] text-[var(--color-primary)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Sparkles className="w-5 h-5 text-[var(--color-primary)] animate-pulse" />
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <CardHeader>
            <Badge variant="default">// nothing yet</Badge>
            <CardTitle>No skills published for this filter</CardTitle>
            <CardDescription>Be the first.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setPublishOpen(true)}>
              <Plus className="w-3 h-3" />
              Publish a skill
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map((e) => (
            <SkillCard key={e.id} entry={e} onStar={() => star(e.id)} />
          ))}
        </div>
      )}

      </>
      )}

      {publishOpen && (
        <PublishDialog
          onClose={() => setPublishOpen(false)}
          onPublished={() => {
            setPublishOpen(false);
            fetchEntries();
          }}
        />
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────
//  SkillCard
// ───────────────────────────────────────────────────────────

function SkillCard({
  entry, onStar,
}: {
  entry: SkillEntry;
  onStar: () => void;
}) {
  const meta = AGENT_META[entry.agent];
  return (
    <Link
      href={`/marketplace/${entry.id}`}
      className="group block rounded-2xl border border-[var(--color-border)] bg-white p-5 hover:border-[var(--color-primary-edge)] hover:shadow-[0_8px_24px_-12px_rgba(91,61,240,0.18)] transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-4">
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-[10px] uppercase tracking-[0.08em]"
          style={{ background: meta.bg, color: meta.color }}
        >
          {meta.label}
        </span>
        {entry.forkedFrom && (
          <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
            <GitFork className="w-2.5 h-2.5" />
            fork
          </span>
        )}
      </div>
      <h3 className="text-[16px] font-medium text-[var(--color-text)] mb-1.5 leading-snug group-hover:text-[var(--color-primary)] transition-colors">
        {entry.title}
      </h3>
      <p className="text-[12.5px] text-[var(--color-text-secondary)] leading-relaxed mb-4 line-clamp-2">
        {entry.tagline}
      </p>
      <div className="flex items-center gap-3 text-[11px] font-mono text-[var(--color-text-muted)]">
        <button
          onClick={(ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            onStar();
          }}
          className="inline-flex items-center gap-1 hover:text-[var(--color-primary)] transition-colors"
          aria-label="Star this skill"
        >
          <Star className="w-3 h-3" />
          {entry.stars}
        </button>
        <span className="inline-flex items-center gap-1">
          <GitFork className="w-3 h-3" />
          {entry.forks}
        </span>
        <span className="inline-flex items-center gap-1">
          <Activity className="w-3 h-3" />
          {entry.runCount}
        </span>
        <span className="ml-auto truncate max-w-[100px]">@{entry.author}</span>
      </div>
    </Link>
  );
}

// ───────────────────────────────────────────────────────────
//  PublishDialog
// ───────────────────────────────────────────────────────────

function PublishDialog({
  onClose, onPublished,
}: {
  onClose: () => void;
  onPublished: () => void;
}) {
  const [agent, setAgent] = useState<Agent>("allocator");
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [body, setBody] = useState(STARTER_BODY);
  const [author, setAuthor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent, title, tagline, body, author }),
      });
      const j = (await res.json()) as { data: SkillEntry | null; error: string | null };
      if (!res.ok || !j.data) throw new Error(j.error ?? "Failed");
      onPublished();
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
        className="bg-white rounded-2xl max-w-[640px] w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-1">
              // publish
            </p>
            <h2 className="text-[20px] font-medium">Push a skill to the marketplace</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-bg-soft)]"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-[12px] font-medium mb-2 block">Agent</span>
              <div className="grid grid-cols-3 gap-2">
                {(["allocator", "risk", "reporter"] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAgent(a)}
                    className={cn(
                      "h-9 rounded-lg font-mono text-[11px] uppercase tracking-[0.06em] transition-colors capitalize",
                      agent === a
                        ? "bg-[var(--color-text)] text-white"
                        : "bg-[var(--color-bg-soft)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-mid)]",
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </label>
            <label className="block">
              <span className="text-[12px] font-medium mb-2 block">Your handle</span>
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value.replace(/[^a-z0-9-_]/gi, "").toLowerCase())}
                placeholder="yourname"
                className="h-9 w-full px-3 rounded-lg border border-[var(--color-border-strong)] bg-white font-mono text-[13px]"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-[12px] font-medium mb-2 block">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Hedged Conservative"
              className="h-9 w-full px-3 rounded-lg border border-[var(--color-border-strong)] bg-white text-[14px]"
            />
          </label>
          <label className="block">
            <span className="text-[12px] font-medium mb-2 block">
              Tagline (one line — what this policy is for)
            </span>
            <input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Conservative caps + hedges against Aave oracle drift."
              className="h-9 w-full px-3 rounded-lg border border-[var(--color-border-strong)] bg-white text-[14px]"
              maxLength={140}
            />
          </label>
          <label className="block">
            <span className="text-[12px] font-medium mb-2 block">
              Skill markdown · {body.length} chars
            </span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              spellCheck={false}
              rows={14}
              className="w-full p-3 rounded-lg border border-[var(--color-border-strong)] bg-white font-mono text-[12px] leading-[1.6]"
            />
          </label>
          {error && (
            <div className="rounded-lg p-3 bg-red-50 border border-red-200 text-[13px] text-red-700">
              {error}
            </div>
          )}
        </div>
        <div className="p-6 border-t border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-soft)] rounded-b-2xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
            published skills are public · no auth · honour system
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={submit}
              disabled={
                submitting ||
                title.length < 3 ||
                tagline.length < 8 ||
                body.length < 40 ||
                author.length < 2
              }
            >
              {submitting ? "Publishing…" : "Publish"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const STARTER_BODY = `# Your skill title

One paragraph describing when to reach for this skill.

## Constraints
- Hard cap on asset X: NNNN bps
- Minimum liquid bps: NNNN

## Decision priority
1. ...
2. ...

## Output
Standard schema. Reasoning must mention ...
`;
