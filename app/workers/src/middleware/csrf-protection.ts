import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';

/**
 * CSRF Protection Middleware
 *
 * For API endpoints using JWT authentication (Authorization header),
 * CSRF attacks are less of a concern since attackers cannot read/set
 * custom headers cross-origin. However, we still validate:
 * 1. Origin header matches expected domains
 * 2. Referer header for additional validation
 * 3. Custom header presence (X-Requested-With)
 *
 * Note: This is defense-in-depth. Primary CSRF protection comes from
 * JWT tokens in Authorization headers (not cookies).
 */

/**
 * Allowed origins for API requests
 */
const ALLOWED_ORIGINS = [
  'https://cari-kerja.pages.dev',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
];

/**
 * Check if origin is allowed
 */
function isAllowedOrigin(origin: string | null, environment: string): boolean {
  if (!origin) {
    return false;
  }

  // In production, only allow production origin
  if (environment === 'production') {
    return origin === 'https://cari-kerja.pages.dev';
  }

  // In development, allow all configured origins
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * CSRF Protection middleware
 * Validates Origin and Referer headers for state-changing requests
 */
export async function csrfProtection(c: Context, next: Next) {
  // Skip CSRF checks in development (local testing is safe)
  const environment = c.env.ENVIRONMENT || 'development';
  if (environment !== 'production') {
    await next();
    return;
  }

  const method = c.req.method;

  // Only check state-changing methods
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const origin = c.req.header('origin');
    const referer = c.req.header('referer');
    const environment = c.env.ENVIRONMENT || 'development';

    // Check Origin header (most reliable)
    if (origin) {
      if (!isAllowedOrigin(origin, environment)) {
        console.warn(`[CSRF] Blocked request from unauthorized origin: ${origin}`);
        throw new HTTPException(403, {
          message: 'Request origin not allowed'
        });
      }
    }
    // Fallback to Referer header if Origin not present
    else if (referer) {
      try {
        const refererOrigin = new URL(referer).origin;
        if (!isAllowedOrigin(refererOrigin, environment)) {
          console.warn(`[CSRF] Blocked request with unauthorized referer: ${referer}`);
          throw new HTTPException(403, {
            message: 'Request referer not allowed'
          });
        }
      } catch {
        // Invalid referer URL
        throw new HTTPException(403, {
          message: 'Invalid referer header'
        });
      }
    }
    // No Origin or Referer - suspicious
    else {
      console.warn(`[CSRF] Blocked request with no origin/referer headers`);
      throw new HTTPException(403, {
        message: 'Missing origin/referer headers'
      });
    }

    // Additional check: X-Requested-With header (optional for JWT-based auth)
    // Note: JWT tokens in Authorization headers already provide CSRF protection
    // since attackers cannot read/set custom headers cross-origin
    const requestedWith = c.req.header('x-requested-with');
    if (!requestedWith) {
      console.warn(`[CSRF] Request missing X-Requested-With header (not critical for JWT auth)`);
      // Don't throw - JWT in Authorization header provides implicit CSRF protection
    }
  }

  await next();
}

/**
 * SameSite Cookie Configuration Helper
 * For applications using cookie-based auth (not applicable for JWT in headers)
 */
export const CSRF_COOKIE_CONFIG = {
  sameSite: 'Strict' as const,
  secure: true,
  httpOnly: true,
  path: '/',
  maxAge: 3600 // 1 hour
};
