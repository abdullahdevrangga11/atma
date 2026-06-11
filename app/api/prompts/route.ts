import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { SYSTEM as ALLOCATOR_SYSTEM } from "@/lib/agents/AllocatorAgent";
import { SYSTEM as RISK_SYSTEM } from "@/lib/agents/RiskAgent";
import { SYSTEM as REPORTER_SYSTEM } from "@/lib/agents/ReporterAgent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OUTPUT_RULES = [
  "## Output rules",
  "- Respond with STRICT JSON only. No prose, no markdown, no code fences.",
  "- The JSON must match the schema described in the system context.",
].join("\n");

const MODEL = "claude-sonnet-4-5-20250929";

/**
 * GET /api/prompts
 *
 * Returns the EXACT system prompt sent to Claude for each agent, with the
 * skill markdown injected. Radical transparency — judges can inspect every
 * byte the model sees before it reasons.
 */
export async function GET() {
  const skill = (name: string) => {
    try {
      return readFileSync(join(process.cwd(), "skills", name), "utf-8");
    } catch {
      return "(skill file not found at runtime)";
    }
  };

  const compose = (systemContext: string, skillContent: string) =>
    [
      systemContext,
      "",
      "## Skill Reference (read carefully — this is your decision logic)",
      "",
      skillContent || "(no skill file loaded)",
      "",
      OUTPUT_RULES,
    ].join("\n");

  const allocatorSkill = skill("mantle-rwa-allocation.skill.md");
  const riskSkill = skill("mantle-risk-monitoring.skill.md");
  const reporterSkill = skill("treasury-reporting.skill.md");

  return NextResponse.json({
    data: {
      model: MODEL,
      agents: [
        {
          name: "AllocatorAgent",
          skillFile: "mantle-rwa-allocation.skill.md",
          systemContext: ALLOCATOR_SYSTEM,
          skillContent: allocatorSkill,
          fullPrompt: compose(ALLOCATOR_SYSTEM, allocatorSkill),
        },
        {
          name: "RiskAgent",
          skillFile: "mantle-risk-monitoring.skill.md",
          systemContext: RISK_SYSTEM,
          skillContent: riskSkill,
          fullPrompt: compose(RISK_SYSTEM, riskSkill),
        },
        {
          name: "ReporterAgent",
          skillFile: "treasury-reporting.skill.md",
          systemContext: REPORTER_SYSTEM,
          skillContent: reporterSkill,
          fullPrompt: compose(REPORTER_SYSTEM, reporterSkill),
        },
      ],
    },
    error: null,
  });
}
