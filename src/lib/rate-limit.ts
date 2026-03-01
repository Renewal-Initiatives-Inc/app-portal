import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { headers } from 'next/headers';

// Fail-open: if KV is not provisioned, rate limiting is disabled.
// Once you add Vercel KV (sets KV_REST_API_URL + KV_REST_API_TOKEN), it activates.
const redis =
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    ? new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
      })
    : null;

// API routes — 30 requests per minute (generous for icon uploads, etc.)
const apiLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, '1 m') })
  : null;

// Server actions — 60 requests per minute per user
const actionLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, '1 m') })
  : null;

// Cron — 5 requests per minute (it runs once daily, this just blocks replays)
const cronLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '1 m') })
  : null;

async function getIdentifier(): Promise<string> {
  const hdrs = await headers();
  return hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

type RateLimitResult = { allowed: true } | { allowed: false; retryAfter: number };

async function check(
  limiter: Ratelimit | null,
  identifier: string
): Promise<RateLimitResult> {
  if (!limiter) return { allowed: true }; // fail-open

  try {
    const result = await limiter.limit(identifier);
    if (result.success) return { allowed: true };
    return { allowed: false, retryAfter: Math.ceil((result.reset - Date.now()) / 1000) };
  } catch {
    // KV is down — fail open, don't block legitimate users
    return { allowed: true };
  }
}

/** Rate-check for API route handlers. Uses client IP as identifier. */
export async function checkApiRateLimit(): Promise<RateLimitResult> {
  const id = await getIdentifier();
  return check(apiLimiter, `api:${id}`);
}

/** Rate-check for the cron endpoint. Uses client IP as identifier. */
export async function checkCronRateLimit(): Promise<RateLimitResult> {
  const id = await getIdentifier();
  return check(cronLimiter, `cron:${id}`);
}

/** Rate-check for server actions. Uses user ID (or IP fallback) as identifier. */
export async function checkActionRateLimit(userId?: string): Promise<RateLimitResult> {
  const id = userId || (await getIdentifier());
  return check(actionLimiter, `action:${id}`);
}
