import { describe, it, expect } from "vitest";
import { lintSkill, summarise } from "../linter";

describe("lintSkill", () => {
  it("R-001 fires when no H1 title is present", () => {
    const out = lintSkill("Just some body text\nwith no heading.", "allocator");
    expect(out.some((i) => i.rule === "R-001")).toBe(true);
  });

  it("R-002 catches vague language", () => {
    const out = lintSkill(
      "# OK\n\nNotably, this is robust and seamless.\n\n## Caps\n- USDY 5000 bps",
      "allocator",
    );
    expect(out.some((i) => i.rule === "R-002")).toBe(true);
  });

  it("R-005 errors when bps mentioned without a numeric bound", () => {
    const body = "# OK\n\nThis policy uses bps but no concrete bound.\n";
    const out = lintSkill(body, "allocator");
    const errs = out.filter((i) => i.level === "error");
    expect(errs.some((i) => i.rule === "R-005")).toBe(true);
  });

  it("R-005 does NOT fire when a numeric bound is present", () => {
    const body = "# OK\n\nUSDY cap: 5000 bps. mUSD: 4000 bps.\n";
    const out = lintSkill(body, "allocator");
    expect(out.some((i) => i.rule === "R-005")).toBe(false);
  });

  it("R-008 fires when Risk skill omits warn/trigger thresholds", () => {
    const out = lintSkill(
      "# Risk policy\n\nSomething soft about thresholds without numbers.",
      "risk",
    );
    expect(out.some((i) => i.rule === "R-008a")).toBe(true);
    expect(out.some((i) => i.rule === "R-008b")).toBe(true);
  });

  it("R-010 catches TODO markers", () => {
    const out = lintSkill("# OK\n\nUSDY cap: 5000 bps. // TODO refine cap", "allocator");
    expect(out.some((i) => i.rule === "R-010")).toBe(true);
  });

  it("sorts errors before warns before infos", () => {
    const out = lintSkill(
      "# Risk\n\nNo numbers here, vague and robust.",
      "risk",
    );
    if (out.length >= 2) {
      const w = (l: string) => (l === "error" ? 0 : l === "warn" ? 1 : 2);
      for (let i = 0; i < out.length - 1; i++) {
        expect(w(out[i].level)).toBeLessThanOrEqual(w(out[i + 1].level));
      }
    }
  });

  it("summarise tallies counts", () => {
    const out = lintSkill("# OK\n\nUSDY 5000 bps. Notably solid.", "allocator");
    const s = summarise(out);
    expect(s.total).toBe(out.length);
    expect(s.errors + s.warns + s.infos).toBe(s.total);
  });
});
