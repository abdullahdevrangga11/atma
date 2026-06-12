"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Cpu,
  ShieldCheck,
  FileBarChart,
  Beaker,
  Activity,
  GitFork,
  ShoppingBag,
  Network,
  ListChecks,
  Settings2,
  PlayCircle,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Cmd+K command palette. Lists every page + recent runs (pulled from
 * /api/runs) so judges can keyboard-jump anywhere in two strokes.
 *
 * Open: ⌘K / Ctrl+K
 * Close: Esc or backdrop click
 * Navigate: ↑ ↓
 * Select: Enter
 */

type Cmd = {
  id: string;
  label: string;
  hint?: string;
  href: string;
  icon: React.ReactNode;
  group: "navigate" | "runs" | "actions";
};

const STATIC_COMMANDS: Cmd[] = [
  { id: "vault",       label: "Vault",            hint: "Live orchestration",            href: "/vault",       icon: <Cpu className="w-4 h-4" />,           group: "navigate" },
  { id: "backtest",    label: "Backtest",         hint: "Replay N weeks",                href: "/backtest",    icon: <PlayCircle className="w-4 h-4" />,    group: "navigate" },
  { id: "abtest",      label: "A/B Test",         hint: "Skill A vs B",                  href: "/ab-test",     icon: <Beaker className="w-4 h-4" />,        group: "navigate" },
  { id: "compare",     label: "Compare",          hint: "3 policies in parallel",        href: "/compare",     icon: <ListChecks className="w-4 h-4" />,    group: "navigate" },
  { id: "anomaly",     label: "Anomaly",          hint: "Stress-test Risk",              href: "/anomaly",     icon: <ShieldCheck className="w-4 h-4" />,   group: "navigate" },
  { id: "skills",      label: "Skills",           hint: "Edit policy",                   href: "/skills",      icon: <Settings2 className="w-4 h-4" />,     group: "navigate" },
  { id: "marketplace", label: "Marketplace",      hint: "Fork community skills",         href: "/marketplace", icon: <ShoppingBag className="w-4 h-4" />,   group: "navigate" },
  { id: "reports",     label: "Reports",          hint: "Attestation history",           href: "/reports",     icon: <FileBarChart className="w-4 h-4" />,  group: "navigate" },
  { id: "network",     label: "Network",          hint: "Cumulative stats",              href: "/network",     icon: <Network className="w-4 h-4" />,       group: "navigate" },
  { id: "alloc",       label: "AllocatorAgent",   hint: "Identity profile",              href: "/agents/allocator", icon: <Activity className="w-4 h-4" />, group: "navigate" },
  { id: "risk",        label: "RiskAgent",        hint: "Veto authority",                href: "/agents/risk",      icon: <Activity className="w-4 h-4" />, group: "navigate" },
  { id: "reporter",    label: "ReporterAgent",    hint: "Signs digests",                 href: "/agents/reporter",  icon: <Activity className="w-4 h-4" />, group: "navigate" },
];

type Run = { id: string; report: { actualAPYBps: number }; risk: { level: string }; debate?: unknown[] };

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<Run[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Listen for ⌘K / Ctrl+K globally
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Focus the input when the palette opens; reset query
  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 0);
      // Fetch recent runs lazily on open
      fetch("/api/runs?limit=5")
        .then((r) => r.json())
        .then((j) => setRecent(j.data?.runs ?? []))
        .catch(() => {});
    }
  }, [open]);

  const commands = useMemo<Cmd[]>(() => {
    const runCmds: Cmd[] = recent.map((r) => ({
      id: r.id,
      label: `Run ${r.id.slice(4, 14)}…`,
      hint:
        r.risk.level === "trigger"
          ? "Defensive exit"
          : r.debate
            ? `+${r.report.actualAPYBps} bps · survived veto`
            : `+${r.report.actualAPYBps} bps`,
      href: `/runs/${r.id}`,
      icon: <Sparkles className="w-4 h-4" />,
      group: "runs" as const,
    }));
    const all = [...STATIC_COMMANDS, ...runCmds];
    if (!q.trim()) return all;
    const needle = q.toLowerCase();
    return all.filter(
      (c) =>
        c.label.toLowerCase().includes(needle) ||
        (c.hint ?? "").toLowerCase().includes(needle),
    );
  }, [q, recent]);

  // Keep the active index in bounds when results change
  useEffect(() => {
    setActive((i) => Math.min(Math.max(0, i), Math.max(0, commands.length - 1)));
  }, [commands.length]);

  const select = useCallback(
    (cmd: Cmd) => {
      setOpen(false);
      router.push(cmd.href);
    },
    [router],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[14vh] p-4"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[640px] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
          <Sparkles className="w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Jump to a page or run…"
            className="flex-1 h-9 bg-transparent text-[14px] outline-none placeholder:text-[var(--color-text-muted)]"
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(commands.length - 1, i + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(0, i - 1));
              } else if (e.key === "Enter" && commands[active]) {
                e.preventDefault();
                select(commands[active]);
              }
            }}
          />
          <button
            onClick={() => setOpen(false)}
            className="w-7 h-7 rounded-full hover:bg-[var(--color-bg-soft)] flex items-center justify-center"
            aria-label="Close palette"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {commands.length === 0 ? (
            <div className="px-4 py-8 text-center text-[12px] text-[var(--color-text-muted)]">
              No matches.
            </div>
          ) : (
            commands.map((c, i) => (
              <button
                key={c.id}
                onMouseEnter={() => setActive(i)}
                onClick={() => select(c)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-[13px] transition-colors",
                  i === active
                    ? "bg-[var(--color-primary-tint)] text-[var(--color-primary)]"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-soft)]",
                )}
              >
                <span className={cn(i === active ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]")}>
                  {c.icon}
                </span>
                <span className="font-medium text-[var(--color-text)] flex-1">{c.label}</span>
                {c.hint && (
                  <span className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.06em]">
                    {c.hint}
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer hints */}
        <div className="px-4 py-2.5 border-t border-[var(--color-border)] bg-[var(--color-bg-soft)] flex items-center gap-4 font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.06em]">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
          <span className="ml-auto">⌘K toggle</span>
        </div>
      </div>
    </div>
  );
}
