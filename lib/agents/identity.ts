/**
 * Agent identity registry — pseudo on-chain identities used across the UI
 * and the future ERC-8004 IdentityRegistry wire-up.
 *
 * Each agent gets a deterministic address derived from its canonical name so
 * the same identity surfaces everywhere (decision feed, profile page,
 * attestation trail) without persistence. The hash is a SHA-256 of the
 * agent name truncated to 20 bytes — close enough to an Ethereum address
 * shape for demo purposes. A production wire would replace with the actual
 * deployer-bound address from the IdentityRegistry.
 */

import { createHash } from "crypto";

export type AgentName = "AllocatorAgent" | "RiskAgent" | "ReporterAgent";

export type AgentIdentity = {
  name: AgentName;
  slug: "allocator" | "risk" | "reporter";
  /** Deterministic pseudo-address `0x…` 40 hex chars */
  address: `0x${string}`;
  /** ERC-8004 IdentityRegistry-style numeric ID. */
  identityId: number;
  /** UI display number (the one used in attestation labels e.g. "Allocator#1") */
  displayNumber: number;
  /** Color associated with this agent across the UI */
  accentColor: string;
  /** Short capability list — what this agent does in one breath each. */
  capabilities: string[];
  /** Skill file this agent reads at runtime */
  skillFile: string;
  /** Default action verb in the UI */
  verb: string;
};

export const AGENT_IDENTITIES: AgentIdentity[] = [
  {
    name: "AllocatorAgent",
    slug: "allocator",
    address: addrOf("AllocatorAgent"),
    identityId: 1001,
    displayNumber: 1,
    accentColor: "#a78bfa",
    capabilities: [
      "Reads policy from a Markdown skill at runtime",
      "Computes risk-adjusted APY across USDY, mUSD, Aave V3, MI4",
      "Outputs basis-point weights that sum to exactly 10000",
      "Re-drafts on RiskAgent veto with the veto baked into its prompt",
    ],
    skillFile: "mantle-rwa-allocation.skill.md",
    verb: "propose",
  },
  {
    name: "RiskAgent",
    slug: "risk",
    address: addrOf("RiskAgent"),
    identityId: 2002,
    displayNumber: 2,
    accentColor: "#fbbf24",
    capabilities: [
      "Continuously evaluates USDY peg, mUSD rebase, Aave oracle, MI4 NAV",
      "Composite level = max(all signals) where trigger > warn > ok",
      "Vetoes Allocator proposals when level is trigger",
      "Authority to call defensive_exit on the on-chain vault",
    ],
    skillFile: "mantle-risk-monitoring.skill.md",
    verb: "evaluate",
  },
  {
    name: "ReporterAgent",
    slug: "reporter",
    address: addrOf("ReporterAgent"),
    identityId: 3003,
    displayNumber: 3,
    accentColor: "#84cc16",
    capabilities: [
      "Computes actual APY from NAV deltas, annualised",
      "Compares versus do-nothing, USDC+Aave, USDY-only baselines",
      "Signs the weekly digest with its identity",
      "Emits ATTEST_REP events on the on-chain reputation registry",
    ],
    skillFile: "treasury-reporting.skill.md",
    verb: "report",
  },
];

export const AGENT_BY_SLUG: Record<string, AgentIdentity> = Object.fromEntries(
  AGENT_IDENTITIES.map((a) => [a.slug, a]),
);

export const AGENT_BY_NAME: Record<AgentName, AgentIdentity> = Object.fromEntries(
  AGENT_IDENTITIES.map((a) => [a.name, a]),
) as Record<AgentName, AgentIdentity>;

function addrOf(name: string): `0x${string}` {
  const h = createHash("sha256").update(`amana-identity:${name}`).digest("hex");
  return `0x${h.slice(0, 40)}` as `0x${string}`;
}
