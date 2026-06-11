import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";

const MODEL = "claude-sonnet-4-5-20250929";

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

  constructor(skillFileName: string, agentName: string) {
    this.agentName = agentName;
    const skillPath = join(process.cwd(), "skills", skillFileName);
    try {
      this.skillContent = readFileSync(skillPath, "utf-8");
    } catch (err) {
      console.warn(`[${agentName}] Skill file not found at ${skillPath}; using empty skill.`);
      this.skillContent = "";
    }
  }

  /**
   * Run a one-shot reasoning call with the Skill markdown injected into the system prompt.
   * Forces JSON-only output, then extracts and validates.
   */
  protected async reason(systemContext: string, userInput: unknown): Promise<string> {
    const client = getClient();
    const system = [
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

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system,
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
    return text;
  }

  protected extractJSON(text: string): unknown {
    // Strip code fences if model emitted them
    let cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
    // Find the first { and matching close
    const start = cleaned.indexOf("{");
    if (start < 0) throw new Error(`No JSON object in ${this.agentName} response`);
    cleaned = cleaned.slice(start);
    return JSON.parse(cleaned);
  }

  public name(): string {
    return this.agentName;
  }
}

/**
 * Compute a keccak-style content hash of an arbitrary reasoning payload.
 * Used as `reasoningHash` argument for on-chain attestations.
 * (Off-chain SHA-256 here — orchestrator can swap to keccak when wiring viem.)
 */
export async function hashReasoning(payload: unknown): Promise<`0x${string}`> {
  const text = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", encoder.encode(text));
  const arr = Array.from(new Uint8Array(buf));
  return ("0x" + arr.map((b) => b.toString(16).padStart(2, "0")).join("")) as `0x${string}`;
}
