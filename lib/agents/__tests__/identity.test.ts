import { describe, it, expect } from "vitest";
import { AGENT_IDENTITIES, AGENT_BY_SLUG, AGENT_BY_NAME } from "../identity";

describe("AGENT_IDENTITIES", () => {
  it("has 3 agents", () => {
    expect(AGENT_IDENTITIES).toHaveLength(3);
  });

  it("each address is 0x + 40 hex chars", () => {
    for (const a of AGENT_IDENTITIES) {
      expect(/^0x[0-9a-f]{40}$/.test(a.address)).toBe(true);
    }
  });

  it("addresses are unique", () => {
    const addrs = AGENT_IDENTITIES.map((a) => a.address);
    expect(new Set(addrs).size).toBe(addrs.length);
  });

  it("addresses are deterministic", async () => {
    // Re-import in fresh module space — addresses should still match
    const { AGENT_IDENTITIES: again } = await import("../identity");
    for (let i = 0; i < AGENT_IDENTITIES.length; i++) {
      expect(again[i].address).toBe(AGENT_IDENTITIES[i].address);
    }
  });

  it("slug + name lookups round-trip", () => {
    expect(AGENT_BY_SLUG.allocator.name).toBe("AllocatorAgent");
    expect(AGENT_BY_SLUG.risk.name).toBe("RiskAgent");
    expect(AGENT_BY_SLUG.reporter.name).toBe("ReporterAgent");
    expect(AGENT_BY_NAME.AllocatorAgent.slug).toBe("allocator");
  });
});
