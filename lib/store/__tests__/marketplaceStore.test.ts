import { describe, it, expect, beforeEach } from "vitest";
import { marketplaceStore } from "../marketplaceStore";

beforeEach(() => {
  // Wipe globals so each test starts with a fresh + reseeded store
  (globalThis as Record<string, unknown>).__amanaMarketplace = undefined;
  (globalThis as Record<string, unknown>).__amanaMarketplaceSeeded = undefined;
});

describe("marketplaceStore", () => {
  it("seeds 5 default entries on first access", () => {
    expect(marketplaceStore.count()).toBe(5);
  });

  it("lists entries sorted by stars by default", () => {
    const list = marketplaceStore.list();
    for (let i = 0; i < list.length - 1; i++) {
      expect(list[i].stars).toBeGreaterThanOrEqual(list[i + 1].stars);
    }
  });

  it("filters by agent", () => {
    const onlyRisk = marketplaceStore.list({ agent: "risk" });
    expect(onlyRisk.every((e) => e.agent === "risk")).toBe(true);
    expect(onlyRisk.length).toBeGreaterThan(0);
  });

  it("sort=new orders newest first", () => {
    const list = marketplaceStore.list({ sort: "new" });
    for (let i = 0; i < list.length - 1; i++) {
      expect(list[i].createdAt).toBeGreaterThanOrEqual(list[i + 1].createdAt);
    }
  });

  it("publish appends a new entry", () => {
    const before = marketplaceStore.count();
    const entry = marketplaceStore.publish({
      agent: "allocator",
      title: "Test Skill",
      tagline: "Just a test entry",
      body: "# Test\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit.",
      author: "tester",
    });
    expect(marketplaceStore.count()).toBe(before + 1);
    expect(entry.id).toMatch(/^[0-9a-f]{12}$/);
    expect(entry.stars).toBe(0);
    expect(entry.forks).toBe(0);
    expect(marketplaceStore.get(entry.id)).toEqual(entry);
  });

  it("star bumps the entry by 1", () => {
    const list = marketplaceStore.list();
    const target = list[0];
    const startStars = target.stars;
    const after = marketplaceStore.star(target.id);
    expect(after?.stars).toBe(startStars + 1);
  });

  it("fork creates a derivative entry + bumps parent fork count", () => {
    const list = marketplaceStore.list();
    const parent = list[0];
    const startForks = parent.forks;
    const child = marketplaceStore.fork(parent.id, "newauthor");
    expect(child).toBeDefined();
    expect(child!.author).toBe("newauthor");
    expect(child!.forkedFrom).toBe(parent.id);
    expect(child!.title).toContain("newauthor");
    expect(marketplaceStore.get(parent.id)?.forks).toBe(startForks + 1);
  });

  it("fork on unknown id returns undefined", () => {
    expect(marketplaceStore.fork("notreal", "x")).toBeUndefined();
  });
});
