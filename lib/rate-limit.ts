/**
 * In-memory rate limiter for Next.js API routes.
 *
 * NOTE: This is a single-process limiter. On Vercel each Edge/Serverless
 * function instance has its own memory, so limits are per-instance rather
 * than globally enforced.  For stricter distributed limiting consider
 * Upstash Redis (@upstash/ratelimit).  For the current traffic pattern this
 * provides meaningful protection against basic brute-force / spam.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Keyed by "<prefix>:<identifier>" → entry
const store = new Map<string, RateLimitEntry>();

// Periodically evict expired entries to avoid unbounded memory growth
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) store.delete(key);
    }
  }, 60_000);
}

export interface RateLimitOptions {
  /** Unique prefix for this limiter (e.g. "register", "login") */
  prefix: string;
  /** Maximum number of requests in the window */
  limit: number;
  /** Window size in seconds */
  windowSec: number;
}

export interface RateLimitResult {
  success: boolean;
  /** Remaining allowed requests in this window */
  remaining: number;
  /** Epoch ms when the window resets */
  resetAt: number;
}

/**
 * Check / increment rate limit for a given identifier (IP, email, …).
 * Call once per request; increments atomically.
 */
export function rateLimit(
  identifier: string,
  opts: RateLimitOptions
): RateLimitResult {
  const key = `${opts.prefix}:${identifier}`;
  const now = Date.now();
  const windowMs = opts.windowSec * 1000;

  let entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    entry = { count: 1, resetAt: now + windowMs };
    store.set(key, entry);
    return { success: true, remaining: opts.limit - 1, resetAt: entry.resetAt };
  }

  entry.count += 1;

  if (entry.count > opts.limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  return {
    success: true,
    remaining: opts.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/** Extract best-effort client IP from a Next.js Request */
export function getClientIp(req: Request): string {
  const headers = req instanceof Request ? req.headers : (req as { headers: Headers }).headers;
  return (
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
