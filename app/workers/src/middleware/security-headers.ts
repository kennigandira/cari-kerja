import type { Context, Next } from 'hono';

/**
 * Security Headers Middleware
 *
 * Adds comprehensive security headers to all responses
 * following OWASP best practices
 */
export async function securityHeadersMiddleware(c: Context, next: Next) {
  await next();

  // Content Security Policy for API responses
  c.header(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
  );

  // Prevent MIME type sniffing
  c.header('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  c.header('X-Frame-Options', 'DENY');

  // Referrer policy
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy - disable unnecessary browser features
  c.header(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );

  // Cross-Origin policies
  c.header('Cross-Origin-Embedder-Policy', 'require-corp');
  c.header('Cross-Origin-Opener-Policy', 'same-origin');
  c.header('Cross-Origin-Resource-Policy', 'same-origin');

  // HSTS (Strict Transport Security) - only in production
  const isProduction = c.env.ENVIRONMENT === 'production';
  if (isProduction) {
    c.header(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Remove server header (don't expose technology stack)
  c.header('Server', '');

  // Cache control for API responses (prevent caching of sensitive data)
  if (c.req.path.startsWith('/api/')) {
    c.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    c.header('Pragma', 'no-cache');
    c.header('Expires', '0');
  }
}
