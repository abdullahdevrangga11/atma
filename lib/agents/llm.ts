/**
 * LLM provider abstraction. Lets us swap Claude ↔ Gemini via env var
 * without touching the agent classes. Same call/stream surface, same
 * usage accounting.
 *
 * Provider selection:
 *   - If LLM_PROVIDER=gemini → Gemini
 *   - If LLM_PROVIDER=anthropic → Claude
 *   - Otherwise: prefer Anthropic when ANTHROPIC_API_KEY is set,
 *     fall back to Gemini when only GEMINI_API_KEY (or GOOGLE_API_KEY)
 *     is present.
 */

import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

const ANTHROPIC_MODEL = "claude-sonnet-4-5-20250929";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// Pricing — USD per 1M tokens (correct as of Q2 2026; update if the
// vendor changes their rate cards).
const PRICING = {
  anthropic: { input: 3.0, output: 15.0, label: ANTHROPIC_MODEL },
  gemini:    { input: 0.30, output: 2.50, label: GEMINI_MODEL },
} as const;

export type LLMProvider = "anthropic" | "gemini";

export type LLMUsage = {
  inputTokens: number;
  outputTokens: number;
  /** USD cents to 4 decimal places (i.e. a $0.0034 call = 0.34) */
  costCents: number;
  provider: LLMProvider;
  model: string;
};

export type LLMResult = { text: string; usage: LLMUsage };

export type LLMCallOpts = {
  system: string;
  user: string;
  maxTokens?: number;
};

function detectProvider(): LLMProvider {
  const forced = (process.env.LLM_PROVIDER ?? "").toLowerCase();
  if (forced === "anthropic") return "anthropic";
  if (forced === "gemini") return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) return "gemini";
  // Fall back to anthropic so the existing error message ("ANTHROPIC_API_KEY
  // is not set") still fires.
  return "anthropic";
}

function computeUsage(
  provider: LLMProvider,
  input: number,
  output: number,
): LLMUsage {
  const rate = PRICING[provider];
  const costUsd = (input * rate.input + output * rate.output) / 1_000_000;
  return {
    inputTokens: input,
    outputTokens: output,
    // Round to 4-decimal cents — keeps the cost-meter precise enough.
    costCents: Math.round(costUsd * 10_000) / 100,
    provider,
    model: rate.label,
  };
}

// ───────────────────────────────────────────────────────────
//  Anthropic implementation
// ───────────────────────────────────────────────────────────

let _anthropic: Anthropic | null = null;
function anthropic(): Anthropic {
  if (_anthropic) return _anthropic;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  _anthropic = new Anthropic({ apiKey: key });
  return _anthropic;
}

async function callAnthropic(opts: LLMCallOpts): Promise<LLMResult> {
  const response = await anthropic().messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: opts.maxTokens ?? 700,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  });
  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("\n")
    .trim();
  return {
    text,
    usage: computeUsage("anthropic", response.usage.input_tokens, response.usage.output_tokens),
  };
}

async function streamAnthropic(
  opts: LLMCallOpts,
  onChunk: (delta: string) => void,
): Promise<LLMResult> {
  const stream = anthropic().messages.stream({
    model: ANTHROPIC_MODEL,
    max_tokens: opts.maxTokens ?? 700,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
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
    usage: computeUsage("anthropic", final.usage.input_tokens, final.usage.output_tokens),
  };
}

// ───────────────────────────────────────────────────────────
//  Gemini implementation
// ───────────────────────────────────────────────────────────

let _gemini: GoogleGenerativeAI | null = null;
function gemini(): GoogleGenerativeAI {
  if (_gemini) return _gemini;
  const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY (or GOOGLE_API_KEY) is not set");
  _gemini = new GoogleGenerativeAI(key);
  return _gemini;
}

async function callGemini(opts: LLMCallOpts): Promise<LLMResult> {
  const model = gemini().getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: opts.system,
    generationConfig: { maxOutputTokens: opts.maxTokens ?? 700, temperature: 0.4 },
  });
  const result = await model.generateContent(opts.user);
  const text = result.response.text().trim();
  const um = result.response.usageMetadata;
  return {
    text,
    usage: computeUsage("gemini", um?.promptTokenCount ?? 0, um?.candidatesTokenCount ?? 0),
  };
}

async function streamGemini(
  opts: LLMCallOpts,
  onChunk: (delta: string) => void,
): Promise<LLMResult> {
  const model = gemini().getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: opts.system,
    generationConfig: { maxOutputTokens: opts.maxTokens ?? 700, temperature: 0.4 },
  });
  const result = await model.generateContentStream(opts.user);
  let assembled = "";
  for await (const chunk of result.stream) {
    const t = chunk.text();
    if (t) {
      onChunk(t);
      assembled += t;
    }
  }
  const final = await result.response;
  const um = final.usageMetadata;
  return {
    text: (final.text() || assembled).trim(),
    usage: computeUsage("gemini", um?.promptTokenCount ?? 0, um?.candidatesTokenCount ?? 0),
  };
}

// ───────────────────────────────────────────────────────────
//  Public surface
// ───────────────────────────────────────────────────────────

export async function llmCall(opts: LLMCallOpts): Promise<LLMResult> {
  const provider = detectProvider();
  return provider === "gemini" ? callGemini(opts) : callAnthropic(opts);
}

export async function llmStream(
  opts: LLMCallOpts,
  onChunk: (delta: string) => void,
): Promise<LLMResult> {
  const provider = detectProvider();
  return provider === "gemini" ? streamGemini(opts, onChunk) : streamAnthropic(opts, onChunk);
}

export function currentProvider(): { provider: LLMProvider; model: string } {
  const p = detectProvider();
  return { provider: p, model: PRICING[p].label };
}
