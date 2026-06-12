import { describe, it, expect } from "vitest";
import { hashReasoning } from "../BaseAgent";

// Tiny shim for testing the protected extractJSON helper without instantiating Anthropic.
import { BaseAgent } from "../BaseAgent";

class TestAgent extends BaseAgent {
  constructor() {
    super("does-not-exist.skill.md", "TestAgent");
  }
  public testExtract(text: string) {
    // Exercise the protected method via a subclass — `extractJSON` is `protected`,
    // which TypeScript permits us to access from within this subclass directly.
    return this.extractJSON(text);
  }
}

describe("BaseAgent.extractJSON", () => {
  const agent = new TestAgent();

  it("parses a clean JSON response", () => {
    const out = agent.testExtract('{"a":1,"b":"two"}');
    expect(out).toEqual({ a: 1, b: "two" });
  });

  it("strips ```json code fences", () => {
    const wrapped = "```json\n{\"weights\":{\"usdyBps\":5000}}\n```";
    const out = agent.testExtract(wrapped);
    expect(out).toEqual({ weights: { usdyBps: 5000 } });
  });

  it("strips bare ``` code fences", () => {
    const wrapped = "```\n{\"x\":42}\n```";
    expect(agent.testExtract(wrapped)).toEqual({ x: 42 });
  });

  it("recovers when the model emits a leading sentence before JSON", () => {
    const noisy =
      'Sure, here is the proposal: {"weights":{"usdyBps":3408,"mUsdBps":3000,"aaveBps":3592,"mi4Bps":0}}';
    const out = agent.testExtract(noisy) as {
      weights: { usdyBps: number; mUsdBps: number; aaveBps: number; mi4Bps: number };
    };
    expect(out.weights.usdyBps + out.weights.mUsdBps + out.weights.aaveBps + out.weights.mi4Bps).toBe(
      10_000,
    );
  });

  it("throws when no JSON object is present", () => {
    expect(() => agent.testExtract("hello, no json here")).toThrow(/No JSON object/);
  });
});

describe("hashReasoning", () => {
  it("is deterministic for the same input", async () => {
    const a = await hashReasoning({ x: 1, y: "two" });
    const b = await hashReasoning({ x: 1, y: "two" });
    expect(a).toBe(b);
  });

  it("differs for different inputs", async () => {
    const a = await hashReasoning({ x: 1 });
    const b = await hashReasoning({ x: 2 });
    expect(a).not.toBe(b);
  });

  it("returns a 0x-prefixed 64-char hex string", async () => {
    const h = await hashReasoning({ note: "amana" });
    expect(h.startsWith("0x")).toBe(true);
    expect(h.length).toBe(2 + 64);
    expect(/^0x[0-9a-f]{64}$/.test(h)).toBe(true);
  });
});
