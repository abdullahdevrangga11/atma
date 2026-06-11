"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Copy, Check, GitCommit } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Skill = {
  id: string;
  filename: string;
  agent: string;
  content: string;
};

type SkillsViewerProps = {
  skills: Skill[];
};

export function SkillsViewer({ skills }: SkillsViewerProps) {
  const [activeId, setActiveId] = useState<string>(skills[0]?.id ?? "");
  const [copied, setCopied] = useState(false);

  const active = useMemo(
    () => skills.find((s) => s.id === activeId) ?? skills[0],
    [skills, activeId],
  );

  const lineCount = active ? active.content.split("\n").length : 0;
  const wordCount = active ? active.content.trim().split(/\s+/).length : 0;

  function handleCopy() {
    if (!active) return;
    navigator.clipboard.writeText(active.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {skills.map((s) => {
          const isActive = s.id === activeId;
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
                  isActive ? "bg-[var(--color-accent)]" : "bg-[var(--color-text-faint)]",
                )}
              />
              <span className="font-medium">{s.agent}</span>
              <span
                className={cn(
                  "opacity-60",
                  isActive ? "text-white/60" : "text-[var(--color-text-muted)]",
                )}
              >
                {s.filename}
              </span>
            </button>
          );
        })}
      </div>

      {active && (
        <Card className="overflow-hidden">
          {/* Header bar: filename + meta + copy */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-soft)]">
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-[var(--color-text-muted)]" />
              <span className="font-mono text-[12px] text-[var(--color-text)]">
                skills/{active.filename}
              </span>
              <Badge variant="default">{active.agent}</Badge>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-text-muted)] tabular-nums">
                {lineCount} lines · {wordCount} words
              </span>
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Content */}
          <CardContent className="p-0">
            <div className="grid grid-cols-[48px_1fr] font-mono text-[12.5px] leading-[1.7]">
              {/* Line numbers */}
              <div className="bg-[var(--color-bg-soft)] border-r border-[var(--color-border)] py-5 select-none text-right pr-3 text-[var(--color-text-faint)] tabular-nums">
                {active.content.split("\n").map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              {/* Markdown source */}
              <pre className="py-5 px-5 overflow-x-auto whitespace-pre-wrap text-[var(--color-text)]">
                {renderHighlighted(active.content)}
              </pre>
            </div>
          </CardContent>

          {/* Footer: file metadata */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-bg-soft)]">
            <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
              // policy as data · no redeploy needed
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
              <GitCommit className="w-3 h-3" />
              read at runtime by {active.agent}
            </span>
          </div>
        </Card>
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
          title="Auditable by anyone"
          body="Every skill is plain markdown in the repo. Reviewable in a normal PR. No hidden prompts."
        />
      </div>
    </div>
  );
}

function InfoTile({ k, title, body }: { k: string; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card-soft)] p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-2">
        // {k}
      </p>
      <p className="text-[14px] font-medium text-[var(--color-text)] mb-1.5">{title}</p>
      <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)]">{body}</p>
    </div>
  );
}

/**
 * Lightweight markdown highlight: tints headings, code, links, and list markers
 * without pulling in a full syntax highlighter. Keeps the source readable as text.
 */
function renderHighlighted(content: string) {
  const lines = content.split("\n");
  return lines.map((line, i) => {
    let className = "";
    if (/^#{1,6}\s/.test(line)) {
      className = "text-[var(--color-primary)] font-semibold";
    } else if (/^\s*[-*]\s/.test(line)) {
      className = "text-[var(--color-text)]";
    } else if (/^\s*>\s/.test(line)) {
      className = "text-[var(--color-text-muted)] italic";
    } else if (/^```/.test(line)) {
      className = "text-[var(--color-text-faint)]";
    } else if (/^---$/.test(line)) {
      className = "text-[var(--color-text-faint)]";
    }
    return (
      <div key={i} className={className}>
        {line || " "}
      </div>
    );
  });
}
