/**
 * Environment Variable Validation and Configuration
 *
 * Validates required environment variables at runtime to prevent
 * application crashes due to missing or invalid configuration.
 */

interface EnvConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  app: {
    env: 'development' | 'production' | 'test';
    isDevelopment: boolean;
    isProduction: boolean;
  };
}

/**
 * Validates that a string is a valid URL
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Must be https in production
    if (import.meta.env.PROD && parsed.protocol !== 'https:') {
      console.warn(`Insecure protocol detected: ${parsed.protocol}`);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates that a string is not empty and meets minimum length requirements
 */
function isValidKey(key: string, minLength = 20): boolean {
  return typeof key === 'string' && key.length >= minLength;
}

/**
 * Validates and returns environment configuration
 * Throws an error if required variables are missing or invalid
 */
function validateEnv(): EnvConfig {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const nodeEnv = import.meta.env.MODE || 'development';

  // Validate Supabase URL
  if (!supabaseUrl) {
    throw new Error(
      'Missing required environment variable: VITE_SUPABASE_URL\n' +
      'Please add it to your .env file or Cloudflare Pages environment variables.'
    );
  }

  if (!isValidUrl(supabaseUrl)) {
    throw new Error(
      `Invalid VITE_SUPABASE_URL: ${supabaseUrl}\n` +
      'URL must be a valid HTTPS URL.'
    );
  }

  // Validate Supabase URL domain (should be supabase.co)
  const urlObj = new URL(supabaseUrl);
  if (!urlObj.hostname.endsWith('.supabase.co')) {
    console.warn(
      `Warning: Supabase URL does not match expected domain pattern: ${urlObj.hostname}\n` +
      'Expected: *.supabase.co'
    );
  }

  // Validate Supabase Anon Key
  if (!supabaseAnonKey) {
    throw new Error(
      'Missing required environment variable: VITE_SUPABASE_ANON_KEY\n' +
      'Please add it to your .env file or Cloudflare Pages environment variables.'
    );
  }

  if (!isValidKey(supabaseAnonKey)) {
    throw new Error(
      'Invalid VITE_SUPABASE_ANON_KEY: Key must be at least 20 characters long.'
    );
  }

  // Warn about development mode in production build
  if (import.meta.env.PROD && nodeEnv === 'development') {
    console.warn(
      'Warning: Production build is running in development mode.\n' +
      'This may expose debug information or development features.'
    );
  }

  return {
    supabase: {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
    },
    app: {
      env: nodeEnv as 'development' | 'production' | 'test',
      isDevelopment: nodeEnv === 'development',
      isProduction: nodeEnv === 'production',
    },
  };
}

// Validate environment variables at module load time
// This ensures the app fails fast if configuration is invalid
let config: EnvConfig;

try {
  config = validateEnv();
} catch (error) {
  console.error('Environment validation failed:', error);
  throw error;
}

// Export validated configuration
export const env = config;

// Export individual values for convenience
export const { supabase, app } = config;

// Type guards for runtime validation
export function isProduction(): boolean {
  return app.isProduction;
}

export function isDevelopment(): boolean {
  return app.isDevelopment;
}
