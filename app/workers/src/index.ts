import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { AuthBindings } from './middleware/auth';
import { authMiddleware } from './middleware/auth';
import { handleCron } from './cron';
import { parseJobPost } from './tasks/parse-job-post';
import type { ParseJobRequest, ParseJobResponse, ParseJobError } from './tasks/parse-job-post';

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  ANTHROPIC_API_KEY: string;
  ENVIRONMENT: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_GATEWAY_ID: string;
};

type Variables = {
  user: {
    id: string;
    email: string;
    role: string;
  };
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// CORS middleware with proper configuration
app.use('/*', cors({
  origin: ['https://cari-kerja.pages.dev', 'http://localhost:5173', 'http://localhost:5174'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Authorization', 'Content-Type'],
  maxAge: 86400,
  credentials: true,
}));

// Health check endpoint (no auth required)
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug endpoint to check environment variables (no auth required - remove after debugging)
app.get('/debug/env', (c) => {
  return c.json({
    hasSupabaseUrl: !!c.env.SUPABASE_URL,
    hasSupabaseKey: !!c.env.SUPABASE_SERVICE_KEY,
    hasAnthropicKey: !!c.env.ANTHROPIC_API_KEY,
    hasJinaKey: !!c.env.JINA_API_KEY,
    environment: c.env.ENVIRONMENT || 'not set'
  });
});

// Protected API routes
app.use('/api/*', authMiddleware);

// API routes requiring authentication
app.get('/api/jobs', async (c) => {
  const user = c.get('user');
  return c.json({
    message: 'Use Supabase client directly for job fetching',
    userId: user.id
  });
});

// Job Parser endpoint - Parse job from URL or manual text
app.post('/api/parse-job', async (c) => {
  console.log('[DEBUG] /api/parse-job request received:', {
    hasAuth: !!c.req.header('Authorization'),
    authPrefix: c.req.header('Authorization')?.substring(0, 20),
    user: c.get('user')?.id
  })

  try {
    const body = await c.req.json<ParseJobRequest>();
    const env = c.env;

    console.log('[DEBUG] Request body:', {
      hasUrl: !!body.url,
      hasText: !!body.text,
      urlLength: body.url?.length,
      textLength: body.text?.length
    })

    // Call parse function
    const result = await parseJobPost(body, env);

    console.log('[DEBUG] Parse successful:', {
      company: result.company_name,
      position: result.position_title,
      confidence: result.confidence
    })

    return c.json<ParseJobResponse>(result, 200);
  } catch (error: any) {
    // Handle validation errors (low confidence, missing fields)
    if (error.code === 'LOW_CONFIDENCE' || error.code === 'MISSING_REQUIRED_FIELDS') {
      return c.json<ParseJobError>(
        {
          error: error.error || error.message,
          code: error.code,
          extracted: error.extracted
        },
        422
      );
    }

    // Handle fetch errors (Jina AI failed)
    if (error.message?.includes('Unable to fetch') || error.message?.includes('Site blocked')) {
      return c.json<ParseJobError>(
        {
          error: error.message,
          fallback: 'manual_paste',
          code: 'FETCH_FAILED'
        },
        400
      );
    }

    // Handle invalid input
    if (error.message?.includes('must be provided') || error.message?.includes('Invalid URL')) {
      return c.json<ParseJobError>(
        {
          error: error.message,
          code: 'INVALID_INPUT'
        },
        400
      );
    }

    // Generic server error - sanitize logging
    const requestId = crypto.randomUUID();
    console.error('Parse job error:', {
      requestId,
      timestamp: new Date().toISOString(),
      userId: c.get('user')?.id,
      errorType: error.constructor?.name || 'Unknown',
      message: error.message?.substring(0, 200) || 'No message', // Truncate for security
      stack: error.stack?.substring(0, 500), // Include stack trace for debugging
      // Never log: API keys, user content
    });

    // In development, return actual error for debugging
    const isDev = c.env.ENVIRONMENT === 'development' || !c.env.ENVIRONMENT;

    // Ensure error response is never empty
    const errorMessage = error.message || error.toString() || 'Unknown error occurred';

    return c.json<ParseJobError>(
      {
        error: isDev ? `Error: ${errorMessage}` : 'Server error occurred. Please try again or use manual entry.',
        code: error.code || 'INTERNAL_ERROR',
        requestId, // For support correlation
        fallback: 'manual_paste', // Always suggest fallback for 500 errors
        ...(isDev && { debug: { type: error.constructor?.name || 'Unknown', message: errorMessage } })
      },
      500
    );
  }
});

export default {
  fetch: app.fetch,

  // Cron trigger handler
  async scheduled(event: any, env: Bindings, ctx: any) {
    ctx.waitUntil(handleCron(env));
  },
};