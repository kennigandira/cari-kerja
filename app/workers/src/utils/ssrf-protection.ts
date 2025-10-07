/**
 * Enhanced SSRF Protection Module
 *
 * Provides comprehensive protection against Server-Side Request Forgery attacks
 * including DNS rebinding, redirect validation, and URL shortener expansion
 */

/**
 * Trusted job site domains (allowlist approach)
 * Only these domains are allowed for job parsing
 */
const TRUSTED_JOB_DOMAINS = [
  'linkedin.com',
  'indeed.com',
  'glassdoor.com',
  'dice.com',
  'monster.com',
  'ziprecruiter.com',
  'simplyhired.com',
  'careerbuilder.com',
  'jobsdb.com',
  'jobthai.com',
  'th.indeed.com',
  'greenhouse.io',
  'lever.co',
  'workday.com',
  'myworkdayjobs.com',
  'smartrecruiters.com',
  'wd1.myworkdaysite.com',
  'wd5.myworkdayjobs.com',
  'ashbyhq.com',
  'jobvite.com',
  'hireclout.com',
  'tvinna.is'
];

/**
 * Check if domain is in trusted list
 */
function isTrustedDomain(hostname: string): boolean {
  const lowerHostname = hostname.toLowerCase();

  return TRUSTED_JOB_DOMAINS.some(trustedDomain => {
    // Exact match or subdomain match
    return lowerHostname === trustedDomain ||
           lowerHostname.endsWith(`.${trustedDomain}`);
  });
}

/**
 * Validate URL against SSRF attacks
 * Enhanced version with allowlist checking
 */
export function validateUrlSecurity(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);

    // Protocol validation
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { valid: false, error: 'Only HTTP(S) protocols allowed' };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Domain allowlist check
    if (!isTrustedDomain(hostname)) {
      return {
        valid: false,
        error: `Domain ${hostname} is not in trusted job sites list`
      };
    }

    // Block localhost variations
    const localhostPatterns = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1',
      '::',
      '::ffff:127.0.0.1',
      'ip6-localhost',
      'ip6-loopback'
    ];

    if (localhostPatterns.includes(hostname)) {
      return { valid: false, error: 'Localhost URLs not allowed' };
    }

    // Block IPv4 private ranges
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(hostname)) {
      const parts = hostname.split('.').map(Number);

      if (parts.some(p => p < 0 || p > 255)) {
        return { valid: false, error: 'Invalid IP address' };
      }

      // Private ranges
      if (parts[0] === 10) return { valid: false, error: 'Private IP range' };
      if (parts[0] === 192 && parts[1] === 168) return { valid: false, error: 'Private IP range' };
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return { valid: false, error: 'Private IP range' };
      if (parts[0] === 169 && parts[1] === 254) return { valid: false, error: 'Link-local IP' };
      if (parts[0] === 127) return { valid: false, error: 'Loopback IP' };
      if (parts[0] === 0) return { valid: false, error: 'Invalid IP range' };
    }

    // Block IPv6 private addresses
    if (hostname.includes(':')) {
      if (hostname.startsWith('fc') || hostname.startsWith('fd')) {
        return { valid: false, error: 'Private IPv6 range' };
      }
      if (hostname.startsWith('fe80')) {
        return { valid: false, error: 'Link-local IPv6' };
      }
      if (hostname.startsWith('ff')) {
        return { valid: false, error: 'Multicast IPv6' };
      }
    }

    // Block cloud metadata endpoints
    const blockedHosts = [
      'metadata.google.internal',
      'metadata.goog',
      '169.254.169.254'
    ];

    if (blockedHosts.includes(hostname)) {
      return { valid: false, error: 'Blocked metadata endpoint' };
    }

    // URL length check
    if (url.length > 2000) {
      return { valid: false, error: 'URL too long' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Safely fetch URL with redirect validation
 * Validates each redirect hop to prevent SSRF via redirects
 */
export async function safeFetch(
  url: string,
  options: RequestInit = {},
  maxRedirects = 5
): Promise<Response> {
  // Validate initial URL
  const initialValidation = validateUrlSecurity(url);
  if (!initialValidation.valid) {
    throw new Error(`SSRF protection: ${initialValidation.error}`);
  }

  let currentUrl = url;
  let redirectCount = 0;

  while (redirectCount < maxRedirects) {
    // Fetch with redirect: manual to validate each hop
    const response = await fetch(currentUrl, {
      ...options,
      redirect: 'manual'
    });

    // If not a redirect, return the response
    if (!response.redirected && response.status < 300 || response.status >= 400) {
      return response;
    }

    // Get redirect location
    const location = response.headers.get('location');
    if (!location) {
      return response;
    }

    // Resolve relative URLs
    const redirectUrl = new URL(location, currentUrl).href;

    // Validate redirect destination
    const validation = validateUrlSecurity(redirectUrl);
    if (!validation.valid) {
      throw new Error(`SSRF protection on redirect: ${validation.error}`);
    }

    currentUrl = redirectUrl;
    redirectCount++;
  }

  throw new Error('Too many redirects (possible redirect loop)');
}

/**
 * Add domain to trusted list (for admin use)
 */
export function addTrustedDomain(domain: string): boolean {
  const normalized = domain.toLowerCase().replace(/^www\./, '');

  if (!TRUSTED_JOB_DOMAINS.includes(normalized)) {
    TRUSTED_JOB_DOMAINS.push(normalized);
    return true;
  }

  return false;
}

/**
 * Get list of trusted domains
 */
export function getTrustedDomains(): string[] {
  return [...TRUSTED_JOB_DOMAINS];
}
