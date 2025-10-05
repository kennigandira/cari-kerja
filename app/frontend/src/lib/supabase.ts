import { createClient } from '@supabase/supabase-js';
import { supabase as supabaseConfig } from '../config/env';

/**
 * Supabase Client Configuration
 *
 * Creates a secure, validated Supabase client with proper security settings.
 * Environment variables are validated at import time to fail fast on misconfiguration.
 */
export const supabase = createClient(
  supabaseConfig.url,
  supabaseConfig.anonKey,
  {
    auth: {
      // Persist session in localStorage for convenience
      // For higher security, use 'session' storage or implement custom storage
      persistSession: true,
      storageKey: 'cari-kerja-auth',
      autoRefreshToken: true,
      detectSessionInUrl: true,

      // Security: Flow type should be PKCE for maximum security
      flowType: 'pkce',
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'X-Client-Info': 'cari-kerja-frontend',
      },
    },
    // Realtime is disabled by default for security
    // Enable only if needed with proper authorization
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);
