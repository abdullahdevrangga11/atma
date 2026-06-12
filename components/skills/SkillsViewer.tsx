"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Copy,
  Check,
  GitCommit,
  Play,
  Pencil,
  RotateCcw,
  Loader2,
  Sparkles,
  SplitSquareHorizontal,
  Eye,
  ShieldCheck,
  AlertTriangle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { diffLines, type DiffLine } from "@/lib/utils/diffLines";

type Skill = {
  id: string;
  filename: string;
  agent: "AllocatorAgent" | "RiskAgent" | "ReporterAgent";
  content: string;
};

type SkillsViewerProps = {
  skills: Skill[];
};

type RunResult = {
  weights?: { usdyBps: number; mUsdBps: number; aaveBps: number; mi4Bps: number };
  expectedAPYBps?: number;
  reasoning?: string;
  riskScore?: number;
  reasoningHash?: string;
  level?: string;
  signal?: string;
  action?: string;
  actualAPYBps?: number;
  outperformanceBps?: {
    vsDoNothing: number;
    vsUsdcAaveOnly: number;
    vsUsdyOnly: number;
  };
};

// Fixed input used for the playground demo — keeps the comparison apples-to-apples.
// Only the skill markdown changes; the input is identical for baseline + experiment.
const DEMO_INPUTS = {
  AllocatorAgent: {
    action: "propose",
    input: {
      targetAmountUsdc: "10000000000",
      userPolicy: {
        maxUsdyBps: 5000,
        maxMUsdBps: 5000,
        maxAaveBps: 5000,
        maxMi4Bps: 1500,
        minLiquidBps: 4000,
        riskTolerance: "balanced",
      },
      liveAPYs: {
        usdy: 0.0442,
        mUsd: 0.046,
        aaveSupply: 0.052,
        mi4Yield: 0.08,
      },
      liveRiskSignals: {
        usdyPeg: "ok",
        mUsdPeg: "ok",
        aaveOracle: "ok",
        mi4NAV: "ok",
      },
    },
  },
  RiskAgent: {
    action: "checkRisk",
    input: {
      usdyPrice: 1.001,
      mUsdRebaseRate: 1.0008,
      aaveMantleOracle: 1.0,
      chainlinkUsdcUsd: 1.0,
      currentNAV: "10046300000",
      entryNAV: "10000000000",
      liquidityScore: 0.72,
      protocolHealth: {
        aavePauseStatus: "ok",
        usdyRedemptionStatus: "ok",
        mantleNetworkStatus: "ok",
      },
    },
  },
  ReporterAgent: {
    action: "report",
    input: {
      periodLabel: "week-of-demo",
      entryNAV: "10000000000",
      currentNAV: "10046300000",
      events: [],
      baselines: { doNothingAPY: 0, usdcAaveOnlyAPY: 0.0416, usdyOnlyAPY: 0.0442 },
    },
  },
} as const;

export function SkillsViewer({ skills }: SkillsViewerProps) {
  const [activeId, setActiveId] = useState<string>(skills[0]?.id ?? "");
  const [copied, setCopied] = useState(false);

  const active = useMemo(() => skills.find((s) => s.id === activeId) ?? skills[0], [skills, activeId]);

  // Per-skill local edited buffers
  const [edited, setEdited] = useState<Record<string, string>>(
    () => Object.fromEntries(skills.map((s) => [s.id, s.content])),
  );
  const [editMode, setEditMode] = useState(false);
  const [diffMode, setDiffMode] = useState(false);
  const [lintIssues, setLintIssues] = useState<LintIssue[] | null>(null);
  const [linting, setLinting] = useState(false);

  type LintIssue = { level: "error" | "warn" | "info"; rule: string; message: string; line: number; snippet?: string };

  async function runLint() {
    if (!active) return;
    setLinting(true);
    try {
      const agentSlug = active.agent === "AllocatorAgent" ? "allocator" : active.agent === "RiskAgent" ? "risk" : "reporter";
      const res = await fetch("/api/skills/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent: agentSlug, body: edited[active.id] ?? active.content }),
      });
      const j = (await res.json()) as { data: { issues: LintIssue[] } | null };
      setLintIssues(j.data?.issues ?? []);
    } finally {
      setLinting(false);
    }
  }

  // Run state
  const [baselineRun, setBaselineRun] = useState<RunResult | null>(null);
  const [experimentRun, setExperimentRun] = useState<RunResult | null>(null);
  const [running, setRunning] = useState<"none" | "baseline" | "experiment" | "both">("none");
  const [error, setError] = useState<string | null>(null);

  const lineCount = active ? edited[active.id]?.split("\n").length ?? 0 : 0;
  const charCount = active ? edited[active.id]?.length ?? 0 : 0;
  const isDirty = active ? edited[active.id] !== active.content : false;

  function handleCopy() {
    if (!active) return;
    navigator.clipboard.writeText(edited[active.id] ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  function resetEdits() {
    if (!active) return;
    setEdited((prev) => ({ ...prev, [active.id]: active.content }));
  }

  async function runOne(skillContent: string): Promise<RunResult> {
    if (!active) throw new Error("No active skill");
    const cfg = DEMO_INPUTS[active.agent];
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: cfg.action,
        input: cfg.input,
        overrideSkill: skillContent,
      }),
    });
    const j = (await res.json()) as { data: RunResult | null; error: string | null };
    if (!res.ok || !j.data) throw new Error(j.error ?? "Request failed");
    return j.data;
  }

  async function runComparison() {
    if (!active) return;
    setError(null);
    setBaselineRun(null);
    setExperimentRun(null);
    setRunning("both");
    try {
      const [baseline, experiment] = await Promise.all([
        runOne(active.content),
        runOne(edited[active.id] ?? active.content),
      ]);
      setBaselineRun(baseline);
      setExperimentRun(experiment);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setRunning("none");
    }
  }

  // When switching tabs, exit edit mode and clear previous run results
  useEffect(() => {
    setEditMode(false);
    setBaselineRun(null);
    setExperimentRun(null);
    setError(null);
  }, [activeId]);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {skills.map((s) => {
          const isActive = s.id === activeId;
          const wasEdited = edited[s.id] !== s.content;
          return (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className={cn(
                "group inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-mono transition-all duration-200",
                isActive
                  ? "bg-[var(--color-text)] text-white"
                  : "bg-[var(--color-bg-soft)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-mid)] hover:text-[var(--color-text)]",
              )}
            >
              <span
                className={cn(
                  "block w-1.5 h-1.5 rounded-full",
                  wasEdited ? "bg-[var(--color-accent)]" : isActive ? "bg-white/60" : "bg-[var(--color-text-faint)]",
                )}
              />
              <span className="font-medium">{s.agent}</span>
              <span className={cn("opacity-60", isActive ? "text-white/60" : "text-[var(--color-text-muted)]")}>
                {s.filename}
              </span>
              {wasEdited && <span className="text-[10px] opacity-70">·edited</span>}
            </button>
          );
        })}
      </div>

      {active && (
        <Card className="overflow-hidden">
          {/* Header bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-soft)]">
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-[var(--color-text-muted)]" />
              <span className="font-mono text-[12px] text-[var(--color-text)]">skills/{active.filename}</span>
              <Badge variant="default">{active.agent}</Badge>
              {isDirty && <Badge variant="warning">edited</Badge>}
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-text-muted)] tabular-nums">
                {lineCount} lines · {charCount} chars
              </span>
              {isDirty && (
                <Button
                  variant={diffMode ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setDiffMode((v) => !v)}
                >
                  <SplitSquareHorizontal className="w-3 h-3" />
                  Diff
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={runLint} disabled={linting}>
                <ShieldCheck className="w-3 h-3" />
                {linting ? "Linting…" : "Lint"}
              </Button>
              {!editMode ? (
                <Button variant="ghost" size="sm" onClick={() => { setEditMode(true); setDiffMode(false); }}>
                  <Pencil className="w-3 h-3" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={resetEdits} disabled={!isDirty}>
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditMode(false)}>
                    Done
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          {/* Body */}
          <CardContent className="p-0">
            {editMode ? (
              <EditView
                content={edited[active.id] ?? active.content}
                onChange={(v) => setEdited((prev) => ({ ...prev, [active.id]: v }))}
              />
            ) : diffMode && isDirty ? (
              <DiffView baseline={active.content} edited={edited[active.id] ?? active.content} />
            ) : (
              <ReadOnlyView content={edited[active.id] ?? active.content} />
            )}
          </CardContent>

          {/* Run bar */}
          <div className="flex items-center justify-between gap-4 px-5 py-4 border-t border-[var(--color-border)] bg-[var(--color-bg-soft)]">
            <div>
              <p className="text-[12px] text-[var(--color-text-secondary)] mb-1">
                Run baseline (committed) vs your edits side-by-side. Same input, different policy.
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
                input: same {active.agent} demo payload
              </p>
            </div>
            <Button onClick={runComparison} size="lg" disabled={running !== "none"}>
              {running !== "none" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play />}
              {isDirty ? "Run comparison" : "Run baseline"}
            </Button>
          </div>
        </Card>
      )}

      {/* Results */}
      {error && (
        <div className="rounded-lg p-3 bg-red-50 border border-red-200 text-[13px] text-red-700">
          <strong className="block mb-1">Error</strong>
          {error}
        </div>
      )}

      {(baselineRun || experimentRun || running !== "none") && active && (
        <div className="grid md:grid-cols-2 gap-4">
          <RunPanel
            label="baseline (skills/*.md)"
            run={baselineRun}
            running={running === "both"}
            agent={active.agent}
          />
          <RunPanel
            label={isDirty ? "your edits" : "identical to baseline"}
            run={experimentRun}
            running={running === "both"}
            agent={active.agent}
            highlight={isDirty}
          />
        </div>
      )}

      {/* Lint results panel — only renders after the user runs Lint */}
      {lintIssues !== null && <LintPanel issues={lintIssues} onClose={() => setLintIssues(null)} />}

      {/* System prompt inspector — the exact bytes we send to Claude */}
      {active && (
        <PromptInspector
          agent={active.agent}
          editedSkill={isDirty ? edited[active.id] : undefined}
        />
      )}

      {/* Explainer strip */}
      <div className="grid md:grid-cols-3 gap-4">
        <InfoTile
          k="1"
          title="Policy update = file commit"
          body="Edit a skill markdown file, push to main. The next agent invocation reads the new policy."
        />
        <InfoTile
          k="2"
          title="No redeploy. No contract upgrade."
          body="Agents load skills at runtime from disk. Vault contract stays immutable; policy stays liquid."
        />
        <InfoTile
          k="3"
          title="Try it now ↑"
          body="Edit the markdown above, hit Run, and watch Claude produce a different answer to the same question."
        />
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
//  Sub-components
// ───────────────────────────────────────────────────────────

function DiffView({ baseline, edited }: { baseline: string; edited: string }) {
  const lines = diffLines(baseline, edited);
  return (
    <div className="font-mono text-[12.5px] leading-[1.7]">
      <div className="bg-[var(--color-bg-soft)] px-5 py-2 border-b border-[var(--color-border)] flex items-center gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
          unified diff · committed → your edits
        </span>
        <Badge variant="success">
          +{lines.filter((l) => l.kind === "add").length}
        </Badge>
        <Badge variant="danger">
          −{lines.filter((l) => l.kind === "del").length}
        </Badge>
      </div>
      <div className="grid grid-cols-[36px_36px_1fr] py-3">
        {lines.map((l, i) => {
          const bg =
            l.kind === "add"
              ? "bg-emerald-50"
              : l.kind === "del"
                ? "bg-red-50"
                : "";
          const sign = l.kind === "add" ? "+" : l.kind === "del" ? "−" : " ";
          const signColor =
            l.kind === "add" ? "text-emerald-700" : l.kind === "del" ? "text-red-700" : "text-[var(--color-text-faint)]";
          const leftNum = l.kind === "del" || l.kind === "same" ? String(l.kind === "same" ? l.left : l.left) : "";
          const rightNum = l.kind === "add" || l.kind === "same" ? String(l.kind === "same" ? l.right : l.right) : "";
          return (
            <DiffRow
              key={i}
              bg={bg}
              sign={sign}
              signColor={signColor}
              leftNum={leftNum}
              rightNum={rightNum}
              text={l.text}
            />
          );
        })}
      </div>
    </div>
  );
}

function DiffRow({
  bg, sign, signColor, leftNum, rightNum, text,
}: {
  bg: string;
  sign: string;
  signColor: string;
  leftNum: string;
  rightNum: string;
  text: string;
}) {
  return (
    <>
      <div className={cn("px-2 text-right text-[var(--color-text-faint)] tabular-nums", bg)}>{leftNum}</div>
      <div className={cn("px-2 text-right text-[var(--color-text-faint)] tabular-nums", bg)}>{rightNum}</div>
      <div className={cn("px-3 whitespace-pre-wrap break-all", bg)}>
        <span className={cn("inline-block w-3 mr-1", signColor)}>{sign}</span>
        <span className="text-[var(--color-text)]">{text || " "}</span>
      </div>
    </>
  );
}

function ReadOnlyView({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="grid grid-cols-[48px_1fr] font-mono text-[12.5px] leading-[1.7]">
      <div className="bg-[var(--color-bg-soft)] border-r border-[var(--color-border)] py-5 select-none text-right pr-3 text-[var(--color-text-faint)] tabular-nums">
        {lines.map((_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <pre className="py-5 px-5 overflow-x-auto whitespace-pre-wrap text-[var(--color-text)]">
        {renderHighlighted(content)}
      </pre>
    </div>
  );
}

function EditView({ content, onChange }: { content: string; onChange: (v: string) => void }) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  // Auto-grow on mount
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, [content]);
  return (
    <textarea
      ref={taRef}
      value={content}
      onChange={(e) => onChange(e.target.value)}
      className="w-full min-h-[320px] p-5 font-mono text-[12.5px] leading-[1.7] text-[var(--color-text)] bg-white focus:outline-none focus:bg-[var(--color-bg-soft)] resize-y"
      spellCheck={false}
    />
  );
}

function RunPanel({
  label,
  run,
  running,
  agent,
  highlight,
}: {
  label: string;
  run: RunResult | null;
  running: boolean;
  agent: Skill["agent"];
  highlight?: boolean;
}) {
  return (
    <Card className={cn(highlight && "border-[var(--color-primary)]")}>
      <CardContent className="!pt-4">
        <div className="flex items-center justify-between mb-3">
          <Badge variant={highlight ? "accent" : "default"}>{label}</Badge>
          {running && (
            <span className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
              <Loader2 className="w-3 h-3 animate-spin" /> running…
            </span>
          )}
          {!running && run && (
            <Badge variant="success">
              <Sparkles className="w-3 h-3" />
              ready
            </Badge>
          )}
        </div>
        {!run && !running && (
          <p className="text-[12px] text-[var(--color-text-muted)]">No run yet.</p>
        )}
        {run && agent === "AllocatorAgent" && run.weights && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <RowKV label="USDY" value={`${(run.weights.usdyBps / 100).toFixed(2)}%`} />
              <RowKV label="mUSD" value={`${(run.weights.mUsdBps / 100).toFixed(2)}%`} />
              <RowKV label="Aave" value={`${(run.weights.aaveBps / 100).toFixed(2)}%`} />
              <RowKV label="MI4" value={`${(run.weights.mi4Bps / 100).toFixed(2)}%`} />
            </div>
            <RowKV label="expected APY" value={`+${run.expectedAPYBps ?? 0} bps`} primary />
            <RowKV label="risk score" value={`${run.riskScore ?? 0} / 10`} />
            {run.reasoning && <Reasoning text={run.reasoning} />}
            {run.reasoningHash && <HashRow hash={run.reasoningHash} />}
          </div>
        )}
        {run && agent === "RiskAgent" && (
          <div className="space-y-3">
            <RowKV label="level" value={run.level ?? "—"} />
            <RowKV label="signal" value={run.signal ?? "—"} />
            <RowKV label="action" value={run.action ?? "—"} />
            {run.reasoning && <Reasoning text={run.reasoning} />}
          </div>
        )}
        {run && agent === "ReporterAgent" && run.outperformanceBps && (
          <div className="space-y-3">
            <RowKV label="actual APY" value={`${((run.actualAPYBps ?? 0) / 100).toFixed(2)}%`} primary />
            <RowKV label="vs do-nothing" value={`+${run.outperformanceBps.vsDoNothing} bps`} />
            <RowKV label="vs Aave" value={`+${run.outperformanceBps.vsUsdcAaveOnly} bps`} />
            <RowKV label="vs USDY" value={`+${run.outperformanceBps.vsUsdyOnly} bps`} />
            {run.reasoning && <Reasoning text={run.reasoning} />}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RowKV({ label, value, primary }: { label: string; value: string; primary?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-text-muted)]">{label}</span>
      <span className={cn("font-medium tabular-nums", primary && "text-[var(--color-primary)]")}>{value}</span>
    </div>
  );
}

function Reasoning({ text }: { text: string }) {
  return (
    <div className="rounded-lg p-3 bg-[var(--color-bg-invert)] border border-[var(--color-bg-invert-soft)]">
      <p className="text-[12px] leading-relaxed text-[var(--color-text-on-invert)]">{text}</p>
    </div>
  );
}

function HashRow({ hash }: { hash: string }) {
  return (
    <div className="pt-2 border-t border-[var(--color-border)]">
      <p className="font-mono text-[9px] uppercase tracking-[0.06em] text-[var(--color-text-muted)] mb-1">SHA-256 reasoning hash</p>
      <p className="font-mono text-[10px] text-[var(--color-text-secondary)] break-all">{hash}</p>
    </div>
  );
}

function PromptInspector({
  agent,
  editedSkill,
}: {
  agent: Skill["agent"];
  editedSkill?: string;
}) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<{
    agents: Array<{
      name: string;
      skillFile: string;
      systemContext: string;
      skillContent: string;
      fullPrompt: string;
    }>;
    model: string;
  } | null>(null);

  useEffect(() => {
    if (!open || data) return;
    fetch("/api/prompts")
      .then((r) => r.json())
      .then((j) => setData(j.data))
      .catch(() => {});
  }, [open, data]);

  const found = data?.agents.find((a) => a.name === agent);
  const composed = found
    ? editedSkill
      ? [
          found.systemContext,
          "",
          "## Skill Reference (read carefully — this is your decision logic)",
          "",
          editedSkill,
          "",
          "## Output rules",
          "- Respond with STRICT JSON only. No prose, no markdown, no code fences.",
          "- The JSON must match the schema described in the system context.",
        ].join("\n")
      : found.fullPrompt
    : "";

  return (
    <Card>
      <CardContent className="!pt-4 !pb-4">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-3 text-left"
        >
          <div className="flex items-center gap-3">
            <Eye className="w-4 h-4 text-[var(--color-text-muted)]" />
            <div>
              <p className="text-[14px] font-medium text-[var(--color-text)]">
                Inspect system prompt sent to Claude
              </p>
              <p className="text-[12px] text-[var(--color-text-secondary)]">
                The exact bytes the model sees for {agent}.{" "}
                {editedSkill ? "Reflects your edits." : "Committed skill markdown."}
              </p>
            </div>
          </div>
          <Badge variant={open ? "accent" : "outline"}>
            {open ? "hide" : "show"}
          </Badge>
        </button>

        {open && (
          <div className="mt-4 space-y-3">
            {found && (
              <>
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[var(--color-text-muted)]">
                    model: <span className="text-[var(--color-text)]">{data?.model}</span> ·
                    skill: <span className="text-[var(--color-text)]">{found.skillFile}</span>
                  </span>
                  <span className="text-[var(--color-text-muted)]">
                    {composed.split("\n").length} lines · {composed.length} chars
                  </span>
                </div>
                <div className="rounded-lg bg-[var(--color-bg-invert)] border border-[var(--color-bg-invert-soft)] p-4 max-h-[420px] overflow-y-auto">
                  <pre className="font-mono text-[11px] leading-[1.6] text-[var(--color-text-on-invert-soft)] whitespace-pre-wrap break-all">
                    {composed}
                  </pre>
                </div>
              </>
            )}
            {!found && (
              <p className="text-[12px] text-[var(--color-text-muted)]">Loading…</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InfoTile({ k, title, body }: { k: string; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card-soft)] p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-2">// {k}</p>
      <p className="text-[14px] font-medium text-[var(--color-text)] mb-1.5">{title}</p>
      <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)]">{body}</p>
    </div>
  );
}

function renderHighlighted(content: string) {
  const lines = content.split("\n");
  return lines.map((line, i) => {
    let className = "";
    if (/^#{1,6}\s/.test(line)) className = "text-[var(--color-primary)] font-semibold";
    else if (/^\s*[-*]\s/.test(line)) className = "text-[var(--color-text)]";
    else if (/^\s*>\s/.test(line)) className = "text-[var(--color-text-muted)] italic";
    else if (/^```/.test(line)) className = "text-[var(--color-text-faint)]";
    else if (/^---$/.test(line)) className = "text-[var(--color-text-faint)]";
    return (
      <div key={i} className={className}>
        {line || " "}
      </div>
    );
  });
}

function LintPanel({
  issues,
  onClose,
}: {
  issues: Array<{ level: "error" | "warn" | "info"; rule: string; message: string; line: number; snippet?: string }>;
  onClose: () => void;
}) {
  const errors = issues.filter((i) => i.level === "error").length;
  const warns = issues.filter((i) => i.level === "warn").length;
  const infos = issues.filter((i) => i.level === "info").length;
  return (
    <Card>
      <CardContent className="!pt-4 !pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--color-text-muted)]" />
            <p className="text-[14px] font-medium">Linter results</p>
            <span className="flex items-center gap-2 ml-2">
              {errors > 0 && <Badge variant="danger">{errors} error{errors === 1 ? "" : "s"}</Badge>}
              {warns > 0 && <Badge variant="warning">{warns} warn{warns === 1 ? "" : "s"}</Badge>}
              {infos > 0 && <Badge variant="default">{infos} info</Badge>}
              {issues.length === 0 && <Badge variant="success">all clean</Badge>}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Hide
          </Button>
        </div>
        {issues.length === 0 ? (
          <p className="text-[12px] text-[var(--color-text-muted)]">
            No issues detected. Lint rules are conservative — Claude may still surprise you.
          </p>
        ) : (
          <ul className="space-y-2">
            {issues.map((i, idx) => (
              <li
                key={idx}
                className={cn(
                  "rounded-md px-3 py-2.5 text-[12px] leading-snug border",
                  i.level === "error"
                    ? "bg-red-50 border-red-200 text-red-900"
                    : i.level === "warn"
                      ? "bg-amber-50 border-amber-200 text-amber-900"
                      : "bg-[var(--color-bg-soft)] border-[var(--color-border)] text-[var(--color-text-secondary)]",
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  {i.level === "error" ? (
                    <AlertTriangle className="w-3 h-3" />
                  ) : i.level === "warn" ? (
                    <AlertTriangle className="w-3 h-3" />
                  ) : (
                    <Info className="w-3 h-3" />
                  )}
                  <span className="font-mono text-[10px] uppercase tracking-[0.06em] opacity-80">
                    {i.rule}
                    {i.line > 0 && ` · line ${i.line}`}
                  </span>
                </div>
                <p>{i.message}</p>
                {i.snippet && (
                  <p className="mt-1.5 font-mono text-[10.5px] opacity-70 truncate">
                    › {i.snippet}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// Lint-quiet exports
export type { Skill, RunResult };
export { GitCommit };
