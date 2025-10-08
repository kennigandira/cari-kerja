import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (per worker instance)
// Note: For distributed rate limiting across multiple workers, use Durable Objects or KV
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limiting middleware for Cloudflare Workers
 * Implements per-user and per-IP rate limiting
 */
export function rateLimitMiddleware(config: RateLimitConfig) {
  return async (c: Context, next: Next) => {
    const now = Date.now();

    // Get identifier (prefer user ID, fallback to IP)
    let identifier: string;
    const user = c.get('user');

    if (user && user.id) {
      identifier = `user:${user.id}`;
    } else {
      // For unauthenticated requests, use IP address
      const clientIP = c.req.header('CF-Connecting-IP') ||
                       c.req.header('X-Forwarded-For')?.split(',')[0] ||
                       'unknown';
      identifier = `ip:${clientIP}`;
    }

    // Check rate limit
    const entry = rateLimitStore.get(identifier);

    if (!entry || now > entry.resetTime) {
      // No entry or window expired, create new entry
      rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + config.windowMs,
      });

      // Add rate limit headers
      c.header('X-RateLimit-Limit', config.maxRequests.toString());
      c.header('X-RateLimit-Remaining', (config.maxRequests - 1).toString());
      c.header('X-RateLimit-Reset', new Date(now + config.windowMs).toISOString());

      await next();
      return;
    }

    if (entry.count >= config.maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

      c.header('X-RateLimit-Limit', config.maxRequests.toString());
      c.header('X-RateLimit-Remaining', '0');
      c.header('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());
      c.header('Retry-After', retryAfter.toString());

      throw new HTTPException(429, {
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`
      });
    }

    // Increment count
    entry.count++;
    rateLimitStore.set(identifier, entry);

    // Add rate limit headers
    c.header('X-RateLimit-Limit', config.maxRequests.toString());
    c.header('X-RateLimit-Remaining', (config.maxRequests - entry.count).toString());
    c.header('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());

    await next();
  };
}

/**
 * Cleanup old entries from rate limit store
 * Call this periodically to prevent memory leaks
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Pre-configured rate limiters for different use cases
 */
export const rateLimiters = {
  // Strict rate limit for expensive operations (10 requests per minute)
  strict: rateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  }),

  // Standard rate limit for API endpoints (30 requests per minute)
  standard: rateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
  }),

  // Lenient rate limit for frequent operations (100 requests per minute)
  lenient: rateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  }),
};
