/**
 * Skill markdown linter — static analysis of policy text.
 *
 * Designed for the three ATMA agent skills. Surfaces ambiguities that
 * would otherwise blow up at Claude inference time (vague language,
 * missing bounds, internal contradictions, forbidden terms from sibling
 * style guides).
 *
 * Deliberately conservative: false positives are cheap to dismiss; false
 * negatives mean the policy ships ambiguous and the agent guesses.
 */

export type LintLevel = "error" | "warn" | "info";

export type LintIssue = {
  level: LintLevel;
  /** Stable rule id for filtering / suppression */
  rule: string;
  /** Plain-English message shown to the author */
  message: string;
  /** Line number (1-indexed) where the issue was detected; 0 = whole doc */
  line: number;
  /** Optional snippet to render alongside */
  snippet?: string;
};

type Agent = "allocator" | "risk" | "reporter";

const VAGUE_WORDS = [
  "notably",
  "fundamentally",
  "robust",
  "leverage",
  "synergy",
  "seamless",
  "comprehensive",
  "appropriately",
  "as needed",
  "if applicable",
];

/** Words the Treasury Boardroom Reporter variant forbids. */
const BOARDROOM_FORBIDDEN = ["notably", "fundamentally", "robust"];

/** Common allocator-specific output keys expected to be referenced. */
const ALLOCATOR_OUTPUT_KEYS = ["weights", "expectedAPYBps", "reasoning", "riskScore"];
const RISK_OUTPUT_KEYS = ["level", "signal", "value", "threshold", "action", "reasoning"];
const REPORTER_OUTPUT_KEYS = [
  "periodLabel",
  "actualAPYBps",
  "outperformanceBps",
  "reasoning",
];

/**
 * Run the linter. Returns issues sorted by severity (errors first) then
 * by line number.
 */
export function lintSkill(body: string, agent: Agent): LintIssue[] {
  const issues: LintIssue[] = [];
  const lines = body.split("\n");

  // R-001: title heading present
  if (!/^#\s+\S/.test(lines[0] ?? "")) {
    issues.push({
      level: "warn",
      rule: "R-001",
      message: "Skill is missing an H1 title line (`# Your title`) at the top.",
      line: 1,
    });
  }

  // R-002: vague language
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    for (const w of VAGUE_WORDS) {
      if (lower.includes(w)) {
        issues.push({
          level: "info",
          rule: "R-002",
          message: `Vague phrase "${w}" — Claude will guess intent. Prefer a hard bound or threshold.`,
          line: i + 1,
          snippet: lines[i].trim(),
        });
      }
    }
  }

  // R-003: forbidden-term cross-check (Reporter only)
  if (agent === "reporter") {
    for (let i = 0; i < lines.length; i++) {
      for (const f of BOARDROOM_FORBIDDEN) {
        if (lines[i].toLowerCase().includes(f)) {
          issues.push({
            level: "warn",
            rule: "R-003",
            message: `Forbidden by Treasury Boardroom style: "${f}".`,
            line: i + 1,
            snippet: lines[i].trim(),
          });
        }
      }
    }
  }

  // R-004: em-dash usage (project style)
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("—")) {
      // Allowed inside code fences; we don't track fence state here, just
      // flag and let the author judge.
      issues.push({
        level: "info",
        rule: "R-004",
        message:
          "Em-dash detected. ATMA writing style prefers commas, parens, or sentence breaks.",
        line: i + 1,
        snippet: lines[i].trim(),
      });
    }
  }

  // R-005: bps bounds required for allocator + risk skills
  if (agent === "allocator" || agent === "risk") {
    const mentionsBps = body.toLowerCase().includes("bps");
    const hasNumericBound = /\b\d{1,5}\s*bps\b/.test(body);
    if (mentionsBps && !hasNumericBound) {
      issues.push({
        level: "error",
        rule: "R-005",
        message:
          "Skill mentions bps but never provides a numeric bound. Add at least one specific threshold (e.g. \"5000 bps\").",
        line: 0,
      });
    }
  }

  // R-006: output schema fields referenced
  const expected =
    agent === "allocator"
      ? ALLOCATOR_OUTPUT_KEYS
      : agent === "risk"
        ? RISK_OUTPUT_KEYS
        : REPORTER_OUTPUT_KEYS;
  const missing = expected.filter((k) => !body.includes(k));
  if (missing.length > 0 && missing.length < expected.length) {
    issues.push({
      level: "warn",
      rule: "R-006",
      message: `Output schema partially referenced. Missing field${
        missing.length === 1 ? "" : "s"
      }: ${missing.join(", ")}.`,
      line: 0,
    });
  } else if (missing.length === expected.length) {
    issues.push({
      level: "info",
      rule: "R-006",
      message:
        "No output schema fields referenced. Consider listing them so Claude knows the JSON shape.",
      line: 0,
    });
  }

  // R-007: contradictory caps (allocator) — sum of explicit max caps > 10000 bps
  if (agent === "allocator") {
    const capRegex = /\bmax\w*Bps\s*[:=]?\s*(\d{1,5})/gi;
    let m: RegExpExecArray | null;
    let sum = 0;
    let found = 0;
    while ((m = capRegex.exec(body)) !== null) {
      sum += Number(m[1]);
      found += 1;
    }
    if (found >= 3 && sum > 30_000) {
      // Multiple caps that, even individually capped at 10000, total ≫ 10000.
      // Flag as "soft" contradiction — caps add up to over 300% which is OK
      // (they're MAX, not actual), so info-level.
      issues.push({
        level: "info",
        rule: "R-007",
        message: `Sum of explicit max caps is ${sum} bps. That's fine (they're upper bounds), but make sure your minLiquid floor + risk-tolerance gating keeps the actual sum at 10000.`,
        line: 0,
      });
    }
  }

  // R-008: thresholds for Risk should be explicit
  if (agent === "risk") {
    const hasWarnAt = /warn\s*(at|>|<|of|:)?\s*\d/i.test(body);
    const hasTriggerAt = /trigger\s*(at|>|<|of|:)?\s*\d/i.test(body);
    if (!hasWarnAt) {
      issues.push({
        level: "error",
        rule: "R-008a",
        message:
          'RiskAgent skill should specify warn thresholds (e.g. "warn at 0.5%"). None found.',
        line: 0,
      });
    }
    if (!hasTriggerAt) {
      issues.push({
        level: "error",
        rule: "R-008b",
        message:
          'RiskAgent skill should specify trigger thresholds (e.g. "trigger at 2%"). None found.',
        line: 0,
      });
    }
  }

  // R-009: short skills probably under-specified
  if (body.length < 280) {
    issues.push({
      level: "warn",
      rule: "R-009",
      message: `Skill is ${body.length} chars. Reasonable skills are 600+. Add a Constraints section or Decision priority list.`,
      line: 0,
    });
  }

  // R-010: TODO / FIXME present
  for (let i = 0; i < lines.length; i++) {
    if (/\b(TODO|FIXME|XXX)\b/.test(lines[i])) {
      issues.push({
        level: "warn",
        rule: "R-010",
        message: "Skill contains a TODO/FIXME marker — finish before publishing.",
        line: i + 1,
        snippet: lines[i].trim(),
      });
    }
  }

  return sortIssues(issues);
}

function sortIssues(arr: LintIssue[]): LintIssue[] {
  const weight = (l: LintLevel) => (l === "error" ? 0 : l === "warn" ? 1 : 2);
  return [...arr].sort((a, b) => {
    const dw = weight(a.level) - weight(b.level);
    return dw !== 0 ? dw : a.line - b.line;
  });
}

export function summarise(issues: LintIssue[]) {
  return {
    errors: issues.filter((i) => i.level === "error").length,
    warns: issues.filter((i) => i.level === "warn").length,
    infos: issues.filter((i) => i.level === "info").length,
    total: issues.length,
  };
}
