import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";

const MODEL = "claude-sonnet-4-5-20250929";

// Anthropic Sonnet 4.5 pricing (USD per 1M tokens, source: anthropic.com)
// Used to compute the per-run cost meter surfaced to the UI.
export const PRICE_PER_M_INPUT_USD = 3;
export const PRICE_PER_M_OUTPUT_USD = 15;

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  /** Estimated cost in USD cents for this single call. */
  costCents: number;
};

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (_client) return _client;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  _client = new Anthropic({ apiKey: key });
  return _client;
}

export abstract class BaseAgent {
  protected skillContent: string;
  protected readonly agentName: string;

  constructor(skillFileName: string, agentName: string, overrideSkill?: string) {
    this.agentName = agentName;
    if (overrideSkill !== undefined) {
      // Used by the skill playground to swap policy without touching disk.
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

  /**
   * Non-streaming reasoning call. Used by /api/agent (legacy) and by tests.
   * Returns the raw text the model produced.
   */
  protected async reason(systemContext: string, userInput: unknown): Promise<{
    text: string;
    usage: TokenUsage;
  }> {
    const client = getClient();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: this.buildSystem(systemContext),
      messages: [
        {
          role: "user",
          content: typeof userInput === "string" ? userInput : JSON.stringify(userInput, null, 2),
        },
      ],
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("\n")
      .trim();

    return {
      text,
      usage: computeUsage(response.usage.input_tokens, response.usage.output_tokens),
    };
  }

  /**
   * Streaming reasoning call. Calls `onChunk(textDelta)` as each text delta
   * arrives. Returns the final assembled text + token usage on completion.
   *
   * Used by the orchestrator's streaming path so the UI can render Claude's
   * reasoning typewriter-style instead of waiting for the whole JSON.
   */
  protected async reasonStream(
    systemContext: string,
    userInput: unknown,
    onChunk: (text: string) => void,
  ): Promise<{ text: string; usage: TokenUsage }> {
    const client = getClient();
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 1024,
      system: this.buildSystem(systemContext),
      messages: [
        {
          role: "user",
          content: typeof userInput === "string" ? userInput : JSON.stringify(userInput, null, 2),
        },
      ],
    });

    stream.on("text", (delta: string) => onChunk(delta));

    const final = await stream.finalMessage();
    const text = final.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("\n")
      .trim();

    return {
      text,
      usage: computeUsage(final.usage.input_tokens, final.usage.output_tokens),
    };
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

function computeUsage(inputTokens: number, outputTokens: number): TokenUsage {
  const costUsd =
    (inputTokens * PRICE_PER_M_INPUT_USD + outputTokens * PRICE_PER_M_OUTPUT_USD) /
    1_000_000;
  return {
    inputTokens,
    outputTokens,
    costCents: Math.round(costUsd * 10_000) / 100, // cents with 2 decimals
  };
}

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
