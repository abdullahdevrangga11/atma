import { readFileSync } from "fs";
import { join } from "path";
import { llmCall, llmStream, currentProvider, type LLMUsage } from "./llm";

/**
 * BaseAgent reads a Markdown skill at construction (or accepts an override),
 * builds a system prompt that injects the skill, and delegates the actual
 * inference to lib/agents/llm.ts so we can swap Anthropic ↔ Gemini via env.
 */

// Re-exported for callers that already imported these names.
export const PRICE_PER_M_INPUT_USD = 3;
export const PRICE_PER_M_OUTPUT_USD = 15;

export type TokenUsage = LLMUsage;

export abstract class BaseAgent {
  protected skillContent: string;
  protected readonly agentName: string;

  constructor(skillFileName: string, agentName: string, overrideSkill?: string) {
    this.agentName = agentName;
    if (overrideSkill !== undefined) {
      this.skillContent = overrideSkill;
      return;
    }
    const skillPath = join(process.cwd(), "skills", skillFileName);
    try {
      this.skillContent = readFileSync(skillPath, "utf-8");
    } catch {
      console.warn(`[${agentName}] Skill file not found at ${skillPath}; using empty skill.`);
      this.skillContent = "";
    }
  }

  /** Compose the full system prompt with the skill injected. */
  protected buildSystem(systemContext: string): string {
    return [
      systemContext,
      "",
      "## Skill Reference (read carefully — this is your decision logic)",
      "",
      this.skillContent || "(no skill file loaded)",
      "",
      "## Output rules",
      "- Respond with STRICT JSON only. No prose, no markdown, no code fences.",
      "- The JSON must match the schema described in the system context.",
    ].join("\n");
  }

  /** Public accessor for tests + UI prompt inspector. */
  public describePrompt(systemContext: string): string {
    return this.buildSystem(systemContext);
  }

  /** Read-only view of the skill markdown this agent loaded at construction. */
  public skill(): string {
    return this.skillContent;
  }

  /** Non-streaming call. */
  protected async reason(
    systemContext: string,
    userInput: unknown,
  ): Promise<{ text: string; usage: TokenUsage }> {
    return llmCall({
      system: this.buildSystem(systemContext),
      user: typeof userInput === "string" ? userInput : JSON.stringify(userInput, null, 2),
      maxTokens: 700,
    });
  }

  /** Streaming call. */
  protected async reasonStream(
    systemContext: string,
    userInput: unknown,
    onChunk: (text: string) => void,
  ): Promise<{ text: string; usage: TokenUsage }> {
    return llmStream(
      {
        system: this.buildSystem(systemContext),
        user: typeof userInput === "string" ? userInput : JSON.stringify(userInput, null, 2),
        maxTokens: 700,
      },
      onChunk,
    );
  }

  protected extractJSON(text: string): unknown {
    let cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
    const start = cleaned.indexOf("{");
    if (start < 0) throw new Error(`No JSON object in ${this.agentName} response`);
    cleaned = cleaned.slice(start);
    return JSON.parse(cleaned);
  }

  public name(): string {
    return this.agentName;
  }
}

/** Expose current provider info — used by /api/llm-info for the cost meter UI. */
export { currentProvider };

/**
 * SHA-256 hash of an arbitrary reasoning payload. Stamped on every agent
 * step + emitted on-chain in the production wire as the reasoning hash for
 * ERC-8004 ReputationEvents.
 */
export async function hashReasoning(payload: unknown): Promise<`0x${string}`> {
  const text = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", encoder.encode(text));
  const arr = Array.from(new Uint8Array(buf));
  return ("0x" + arr.map((b) => b.toString(16).padStart(2, "0")).join("")) as `0x${string}`;
}
