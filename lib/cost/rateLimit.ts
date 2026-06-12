/**
 * In-memory per-IP rate limiter for Claude-consuming endpoints.
 *
 * Goal: keep total Anthropic spend under $5 for the hackathon period by
 * preventing accidental spam-clicking. Limits are intentionally generous
 * for legitimate judge use, harsh for bot-style abuse.
 *
 * Limits (per IP):
 *   - 1 orchestration per 20 seconds
 *   - 5 orchestrations per hour
 *   - 1 backtest per 5 minutes (backtests are expensive)
 *   - 1 ab-test per 5 minutes
 *
 * Falls back to "unknown" bucket when no IP can be derived (still rate
 * limited, just shared across mystery callers).
 */

type Bucket = {
  recent: number[]; // ms timestamps of recent hits, newest last
};

declare global {
  // eslint-disable-next-line no-var
  var __amanaRateLimit: Map<string, Bucket> | undefined;
}

function store(): Map<string, Bucket> {
  if (!globalThis.__amanaRateLimit) globalThis.__amanaRateLimit = new Map();
  return globalThis.__amanaRateLimit;
}

export type RateLimitConfig = {
  /** Minimum gap between hits (ms) */
  minGapMs: number;
  /** Max hits in the trailing window (use windowMs together) */
  maxInWindow: number;
  windowMs: number;
};

export const LIMITS = {
  orchestrate: { minGapMs: 20_000, maxInWindow: 5, windowMs: 3_600_000 },
  backtest:    { minGapMs: 300_000, maxInWindow: 2, windowMs: 3_600_000 },
  abtest:      { minGapMs: 300_000, maxInWindow: 2, windowMs: 3_600_000 },
  agent:       { minGapMs: 5_000,  maxInWindow: 12, windowMs: 3_600_000 },
} as const;

export type LimitName = keyof typeof LIMITS;

export type RateCheckResult =
  | { allowed: true }
  | { allowed: false; reason: "cooldown" | "hourly_cap"; retryAfterSec: number };

/**
 * Check + record a hit on `name:ip`. Returns the decision; the caller is
 * responsible for short-circuiting with a 429 when denied.
 */
export function rateCheck(name: LimitName, ip: string): RateCheckResult {
  const cfg = LIMITS[name];
  const key = `${name}:${ip}`;
  const now = Date.now();
  const map = store();
  const bucket = map.get(key) ?? { recent: [] };

  // Drop entries outside the window
  bucket.recent = bucket.recent.filter((t) => now - t < cfg.windowMs);

  // Min-gap check
  const last = bucket.recent[bucket.recent.length - 1];
  if (last !== undefined && now - last < cfg.minGapMs) {
    return {
      allowed: false,
      reason: "cooldown",
      retryAfterSec: Math.ceil((cfg.minGapMs - (now - last)) / 1000),
    };
  }

  // Hourly cap check
  if (bucket.recent.length >= cfg.maxInWindow) {
    const oldest = bucket.recent[0];
    return {
      allowed: false,
      reason: "hourly_cap",
      retryAfterSec: Math.ceil((cfg.windowMs - (now - oldest)) / 1000),
    };
  }

  // Allow + record
  bucket.recent.push(now);
  map.set(key, bucket);
  return { allowed: true };
}

/** Extract a stable-ish IP from a Next.js request. */
export function ipFrom(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
