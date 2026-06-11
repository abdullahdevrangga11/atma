import { describe, it, expect } from "vitest";
import { diffLines, diffStats } from "../diffLines";

describe("diffLines", () => {
  it("returns all-same for identical input", () => {
    const out = diffLines("a\nb\nc", "a\nb\nc");
    expect(out.every((l) => l.kind === "same")).toBe(true);
    expect(out).toHaveLength(3);
  });

  it("detects a pure insertion", () => {
    const out = diffLines("a\nc", "a\nb\nc");
    const adds = out.filter((l) => l.kind === "add");
    expect(adds).toHaveLength(1);
    expect(adds[0]).toMatchObject({ kind: "add", text: "b" });
  });

  it("detects a pure deletion", () => {
    const out = diffLines("a\nb\nc", "a\nc");
    const dels = out.filter((l) => l.kind === "del");
    expect(dels).toHaveLength(1);
    expect(dels[0]).toMatchObject({ kind: "del", text: "b" });
  });

  it("detects a substitution as del + add", () => {
    const out = diffLines("a\nb\nc", "a\nB\nc");
    expect(diffStats(out)).toEqual({ added: 1, removed: 1 });
  });

  it("handles totally disjoint inputs", () => {
    const out = diffLines("a\nb", "x\ny");
    expect(diffStats(out)).toEqual({ added: 2, removed: 2 });
  });
});
