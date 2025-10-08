/**
 * Security Utilities
 *
 * Common security functions for the application including
 * sanitization, validation, and safe operations.
 */

/**
 * DOM Security
 */

/**
 * Safely sets text content without HTML injection risk
 * Always prefer this over innerHTML for user-provided content
 */
export function safeSetText(element: HTMLElement, text: string): void {
  element.textContent = text;
}

/**
 * Safely creates a text node from user input
 */
export function createSafeTextNode(text: string): Text {
  return document.createTextNode(text);
}

/**
 * Escapes HTML special characters to prevent XSS
 */
export function escapeHtml(unsafe: string): string {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return unsafe.replace(/[&<>"'/]/g, (char) => escapeMap[char] || char);
}

/**
 * Strips all HTML tags from a string
 * Uses DOMParser for safe HTML parsing without XSS risks
 */
export function stripHtmlTags(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

/**
 * URL Security
 */

/**
 * Validates if a URL is safe to navigate to
 * Prevents javascript:, data:, and other dangerous protocols
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Allow only http(s) and mailto protocols
    const safeProtocols = ['http:', 'https:', 'mailto:'];

    return safeProtocols.includes(parsed.protocol);
  } catch {
    // If URL parsing fails, assume it's a relative URL
    // Check if it starts with dangerous patterns
    const dangerousPatterns = [
      /^javascript:/i,
      /^data:/i,
      /^vbscript:/i,
      /^file:/i,
    ];

    return !dangerousPatterns.some(pattern => pattern.test(url));
  }
}

/**
 * Sanitizes a URL for safe use in href attributes
 * Returns '#' if URL is unsafe
 */
export function sanitizeUrl(url: string): string {
  return isSafeUrl(url) ? url : '#';
}

/**
 * Opens URL in new tab with security measures
 * Prevents tabnabbing attacks
 */
export function safeOpenUrl(url: string): void {
  if (!isSafeUrl(url)) {
    console.warn(`Blocked unsafe URL: ${url}`);
    return;
  }

  const newWindow = window.open(url, '_blank', 'noopener,noreferrer');

  if (newWindow) {
    // Prevent tabnabbing
    newWindow.opener = null;
  }
}

/**
 * Data Validation
 */

/**
 * Validates if a value is a valid UUID
 */
export function isValidUuid(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Validates if a value is a valid email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validates if a string contains only alphanumeric characters
 */
export function isAlphanumeric(value: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(value);
}

/**
 * Validates if a string is safe for use in a filename
 */
export function isSafeFilename(filename: string): boolean {
  // Prevent path traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return false;
  }

  // Must have valid characters only
  const safeFilenameRegex = /^[a-zA-Z0-9._-]+$/;
  return safeFilenameRegex.test(filename);
}

/**
 * Storage Security
 */

/**
 * Safely stores data in localStorage with validation
 */
export function safeLocalStorage(key: string, value: any): boolean {
  try {
    // Validate key
    if (!key || typeof key !== 'string') {
      console.error('Invalid localStorage key');
      return false;
    }

    // Serialize value
    const serialized = JSON.stringify(value);

    // Check size (most browsers limit to 5-10MB)
    if (serialized.length > 5 * 1024 * 1024) {
      console.error('Data too large for localStorage');
      return false;
    }

    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
    return false;
  }
}

/**
 * Safely retrieves data from localStorage with validation
 */
export function safeGetLocalStorage<T>(key: string, defaultValue?: T): T | undefined {
  try {
    const item = localStorage.getItem(key);

    if (item === null) {
      return defaultValue;
    }

    return JSON.parse(item) as T;
  } catch (error) {
    console.error('Failed to retrieve from localStorage:', error);
    return defaultValue;
  }
}

/**
 * Safely removes item from localStorage
 */
export function safeRemoveLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove from localStorage:', error);
  }
}

/**
 * Clears all localStorage with confirmation
 */
export function safeClearLocalStorage(): void {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
}

/**
 * Rate Limiting
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Simple client-side rate limiting
 * Returns true if action is allowed, false if rate limit exceeded
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // No entry or window expired, create new entry
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (entry.count >= maxAttempts) {
    // Rate limit exceeded
    return false;
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);
  return true;
}

/**
 * Resets rate limit for a key
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * CSRF Protection
 */

/**
 * Generates a CSRF token for form submissions
 * Store this in a hidden field and validate on the server
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Content Security Policy
 */

/**
 * Checks if CSP is properly configured
 */
export function checkCspConfiguration(): boolean {
  const metaTags = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');

  if (metaTags.length === 0) {
    console.warn('No CSP meta tag found. Ensure CSP is configured via HTTP headers.');
    return false;
  }

  return true;
}

/**
 * Error Handling
 */

/**
 * Sanitizes error message before displaying to user
 * Prevents information leakage
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (import.meta.env.DEV) {
    // In development, show full error
    return error instanceof Error ? error.message : String(error);
  }

  // In production, show generic error
  return 'An error occurred. Please try again.';
}

/**
 * Safely logs error without exposing sensitive information
 */
export function safeLogError(error: unknown, context?: string): void {
  if (import.meta.env.DEV) {
    console.error(context ? `[${context}]` : '', error);
  } else {
    // In production, you might want to send to an error tracking service
    // Example: Sentry.captureException(error);
    console.error(context ? `[${context}]` : '', 'Error occurred');
  }
}
