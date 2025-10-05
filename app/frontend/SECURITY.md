# Security Implementation Guide

This document outlines the security features implemented in the Cari Kerja frontend application.

## Overview

This application follows security-first development practices with defense-in-depth approach, implementing multiple layers of security controls to protect against common web vulnerabilities.

## Security Architecture

### 1. Content Security Policy (CSP)

**Location:** `public/_headers`, `vite.config.ts`

**Implementation:**
- Strict CSP with nonce-based script loading
- `strict-dynamic` for script execution
- No `unsafe-inline` or `unsafe-eval` directives
- Trusted Types enforcement
- Script sources restricted to `self` only

**Protection Against:**
- Cross-Site Scripting (XSS)
- Code injection attacks
- Malicious script execution

**Configuration:**
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'strict-dynamic' 'nonce-{NONCE}';
  style-src 'self';
  require-trusted-types-for 'script';
```

### 2. Security Headers

**Location:** `public/_headers`, `vite.config.ts`

**Implemented Headers:**

| Header | Value | Protection |
|--------|-------|------------|
| X-Content-Type-Options | nosniff | MIME sniffing attacks |
| X-Frame-Options | DENY | Clickjacking |
| Referrer-Policy | strict-origin-when-cross-origin | Information leakage |
| Permissions-Policy | restrictive | Unwanted browser features |
| Cross-Origin-Embedder-Policy | require-corp | Cross-origin isolation |
| Cross-Origin-Opener-Policy | same-origin | Cross-window attacks |
| Cross-Origin-Resource-Policy | same-origin | Cross-origin reads |
| Strict-Transport-Security | max-age=31536000 | Protocol downgrade |
| X-Permitted-Cross-Domain-Policies | none | Flash/PDF cross-domain |
| X-Download-Options | noopen | IE download attacks |
| X-DNS-Prefetch-Control | off | DNS privacy |

**Note:** X-XSS-Protection header removed as it's deprecated and can introduce vulnerabilities.

### 3. Environment Variable Validation

**Location:** `src/config/env.ts`

**Features:**
- Runtime validation of all required environment variables
- URL format validation (HTTPS enforcement in production)
- Domain validation for Supabase endpoints
- Minimum key length validation
- Fail-fast on misconfiguration

**Example Usage:**
```typescript
import { env, supabase, app } from '@/config/env';

// Environment is pre-validated, safe to use
console.log(supabase.url); // Validated HTTPS URL
console.log(app.isProduction); // Boolean flag
```

**Protected Against:**
- Missing configuration errors
- Invalid URL formats
- Insecure protocols
- Short/weak keys

### 4. Input Validation

**Location:** `src/composables/useValidation.ts`

**Features:**
- Comprehensive validation rules
- Allowlist-based validation
- HTML sanitization
- XSS prevention
- Form validation composable

**Available Validators:**
- `required` - Non-empty validation
- `minLength` / `maxLength` - Length validation
- `email` - Email format validation
- `url` - URL format validation
- `pattern` - Regex pattern matching
- `oneOf` - Allowlist validation
- `uuid` - UUID format validation
- `numeric` / `integer` - Number validation
- `min` / `max` - Value range validation

**Example Usage:**
```typescript
import { useFormValidation, useInputValidation } from '@/composables/useValidation';

const { required, email, minLength } = useInputValidation();

const { values, errors, validate } = useFormValidation(
  { email: '', password: '' },
  {
    email: [required(), email()],
    password: [required(), minLength(8)],
  }
);
```

### 5. Sanitization Utilities

**Location:** `src/composables/useValidation.ts`, `src/utils/security.ts`

**Features:**
- HTML entity encoding
- HTML tag stripping
- URL sanitization
- Email sanitization

**Example Usage:**
```typescript
import { useSanitization } from '@/composables/useValidation';
import { escapeHtml, stripHtmlTags } from '@/utils/security';

const { sanitizeHtml, stripHtml, sanitizeUrl } = useSanitization();

// Encode HTML entities
const safe = sanitizeHtml('<script>alert("xss")</script>');
// Output: &lt;script&gt;alert("xss")&lt;/script&gt;

// Strip HTML tags
const text = stripHtml('<p>Hello <b>World</b></p>');
// Output: Hello World
```

### 6. Route Security

**Location:** `src/router/index.ts`

**Features:**
- Route parameter validation
- UUID and numeric ID validation
- Invalid parameter handling
- 404 catch-all route
- Navigation guards

**Protection Against:**
- Route parameter injection
- Invalid ID formats
- Unauthorized access (extensible)

**Example:**
```typescript
// Route guards validate job IDs
// Invalid: /job/../../admin
// Invalid: /job/<script>alert(1)</script>
// Valid: /job/550e8400-e29b-41d4-a716-446655440000
// Valid: /job/12345
```

### 7. Supabase Client Security

**Location:** `src/lib/supabase.ts`

**Features:**
- PKCE authentication flow
- Validated environment configuration
- Secure session storage
- Auto token refresh
- Rate-limited realtime events

**Configuration:**
```typescript
{
  auth: {
    flowType: 'pkce', // Most secure auth flow
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10, // Rate limiting
    },
  },
}
```

### 8. Security Utilities

**Location:** `src/utils/security.ts`

**DOM Security:**
- `safeSetText()` - Safe text content setting
- `escapeHtml()` - HTML entity encoding
- `stripHtmlTags()` - HTML tag removal

**URL Security:**
- `isSafeUrl()` - URL protocol validation
- `sanitizeUrl()` - URL sanitization
- `safeOpenUrl()` - Tabnabbing prevention

**Data Validation:**
- `isValidUuid()` - UUID validation
- `isValidEmail()` - Email validation
- `isAlphanumeric()` - Alphanumeric check
- `isSafeFilename()` - Path traversal prevention

**Storage Security:**
- `safeLocalStorage()` - Validated storage
- `safeGetLocalStorage()` - Safe retrieval
- Size limit checks
- JSON serialization errors

**Rate Limiting:**
- `checkRateLimit()` - Client-side rate limiting
- Configurable time windows
- Per-action limiting

**Example Usage:**
```typescript
import { safeOpenUrl, checkRateLimit, escapeHtml } from '@/utils/security';

// Safe URL opening
safeOpenUrl(userProvidedUrl); // Validates and opens safely

// Rate limiting
if (checkRateLimit('api-call', 10, 60000)) {
  // Allowed: max 10 calls per minute
  await makeApiCall();
} else {
  // Rate limit exceeded
  showError('Too many requests');
}

// HTML escaping
const safeContent = escapeHtml(userInput);
```

### 9. Build Security

**Location:** `vite.config.ts`

**Features:**
- Sourcemaps disabled in production
- Asset hashing (SRI support)
- Code splitting for vendor isolation
- Module preloading with polyfill
- Production-specific optimizations

**Configuration:**
```typescript
build: {
  sourcemap: process.env.NODE_ENV === 'development' && !process.env.VITE_PRODUCTION_BUILD,
  rollupOptions: {
    output: {
      chunkFileNames: 'assets/[name]-[hash].js',
      entryFileNames: 'assets/[name]-[hash].js',
      assetFileNames: 'assets/[name]-[hash].[ext]',
    },
  },
}
```

### 10. PWA Security

**Location:** `vite.config.ts`

**Features:**
- Secure service worker configuration
- Network-first caching for API calls
- Cleanup of outdated caches
- Safe update mechanisms
- Cache expiration policies

**Configuration:**
```typescript
workbox: {
  cleanupOutdatedCaches: true,
  skipWaiting: false, // Safer default
  clientsClaim: false, // Safer default
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.supabase\.co\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 3600, // 1 hour
        },
      },
    },
  ],
}
```

## Vulnerability Prevention

### Cross-Site Scripting (XSS)

**Prevention Measures:**
1. Strict CSP with nonce-based scripts
2. Trusted Types enforcement
3. HTML sanitization utilities
4. Safe DOM manipulation functions
5. Input validation and output encoding

**Code Examples:**
```typescript
// ❌ Unsafe - direct innerHTML
element.innerHTML = userInput;

// ✅ Safe - textContent
element.textContent = userInput;

// ✅ Safe - sanitized HTML
import { escapeHtml } from '@/utils/security';
element.innerHTML = escapeHtml(userInput);
```

### SQL Injection

**Prevention Measures:**
1. Supabase client uses parameterized queries
2. Input validation before database calls
3. Type validation for IDs and parameters

**Code Examples:**
```typescript
// ✅ Safe - parameterized query
const { data } = await supabase
  .from('jobs')
  .select('*')
  .eq('id', validatedId); // Parameterized

// ✅ Safe - validated input
import { isValidUuid } from '@/utils/security';
if (isValidUuid(jobId)) {
  const { data } = await supabase.from('jobs').select('*').eq('id', jobId);
}
```

### Cross-Site Request Forgery (CSRF)

**Prevention Measures:**
1. SameSite cookie attribute (Supabase)
2. PKCE authentication flow
3. Origin validation
4. CSRF token generation utility

**Code Examples:**
```typescript
import { generateCsrfToken } from '@/utils/security';

// Generate token for forms
const csrfToken = generateCsrfToken();
```

### Clickjacking

**Prevention Measures:**
1. X-Frame-Options: DENY
2. CSP frame-ancestors: 'none'
3. Cross-Origin-Embedder-Policy

### Open Redirect

**Prevention Measures:**
1. URL validation before redirect
2. Allowlist-based URL validation
3. Safe URL opening utility

**Code Examples:**
```typescript
import { safeOpenUrl, isSafeUrl } from '@/utils/security';

// ✅ Safe - validated redirect
if (isSafeUrl(redirectUrl)) {
  safeOpenUrl(redirectUrl);
}
```

### Information Leakage

**Prevention Measures:**
1. Sourcemaps disabled in production
2. Generic error messages in production
3. Sanitized error logging
4. Referrer-Policy header

**Code Examples:**
```typescript
import { sanitizeErrorMessage, safeLogError } from '@/utils/security';

try {
  await riskyOperation();
} catch (error) {
  // Log full error for debugging
  safeLogError(error, 'riskyOperation');

  // Show safe message to user
  showError(sanitizeErrorMessage(error));
}
```

## Security Testing

### Automated Testing

```bash
# Dependency vulnerability scanning
bun audit

# Build verification
bun run build

# Preview production build
bun run preview
```

### Manual Testing

1. **CSP Violations:**
   - Open browser DevTools
   - Check Console for CSP errors
   - Fix any violations

2. **Security Headers:**
   - Visit https://securityheaders.com
   - Test deployed site
   - Aim for A+ rating

3. **SSL/TLS:**
   - Visit https://www.ssllabs.com/ssltest/
   - Test HTTPS configuration
   - Verify strong ciphers

4. **HSTS Preload:**
   - Visit https://hstspreload.org/
   - Submit domain for preload list

### Security Checklist

Before deployment:
- [ ] All environment variables validated
- [ ] CSP configuration tested
- [ ] Input validation on all forms
- [ ] No secrets in code
- [ ] Dependencies up to date
- [ ] Production build tested
- [ ] Error messages sanitized
- [ ] Sourcemaps disabled

After deployment:
- [ ] Security headers verified
- [ ] SSL/TLS grade A or higher
- [ ] CSP violations checked
- [ ] Authentication flow tested
- [ ] Rate limiting functional
- [ ] Error handling working

## Security Incident Response

If a security vulnerability is discovered:

1. **Assess Impact:**
   - Determine scope and severity
   - Identify affected users/data
   - Document timeline

2. **Immediate Actions:**
   - Take affected systems offline if critical
   - Rotate compromised credentials
   - Patch vulnerability

3. **Communication:**
   - Notify affected users
   - Document incident
   - Report to authorities if required

4. **Prevention:**
   - Review security controls
   - Implement additional safeguards
   - Update security documentation

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CSP Reference](https://content-security-policy.com/)
- [Security Headers](https://securityheaders.com/)
- [Web Security Guidelines](https://infosec.mozilla.org/guidelines/web_security)
- [Supabase Security](https://supabase.com/docs/guides/auth/auth-deep-dive/auth-deep-dive-jwts)

## Maintenance

### Regular Tasks

**Weekly:**
- Review CSP violations
- Check for dependency updates
- Monitor error logs

**Monthly:**
- Run security audits
- Update dependencies
- Review access logs
- Test security controls

**Quarterly:**
- Security headers review
- Penetration testing
- Security training
- Update documentation

---

**Last Updated:** 2025-10-05
**Security Level:** High
**Compliance:** OWASP Top 10, Modern Web Security Best Practices
