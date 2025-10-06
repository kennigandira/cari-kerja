import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware, AuthBindings } from './middleware/auth';
import { handleCron } from './cron';
import { parseJobPost, ParseJobRequest, ParseJobResponse, ParseJobError } from './tasks/parse-job-post';

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  ANTHROPIC_API_KEY: string;
  ENVIRONMENT: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS middleware with proper configuration
app.use('/*', cors({
  origin: ['https://cari-kerja.pages.dev'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Authorization', 'Content-Type'],
  maxAge: 86400,
  credentials: true,
}));

// Health check endpoint (no auth required)
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
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
  try {
    const body = await c.req.json<ParseJobRequest>();
    const env = c.env;

    // Call parse function
    const result = await parseJobPost(body, env);

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
      errorType: error.constructor.name,
      message: error.message?.substring(0, 200), // Truncate for security
      // Never log: stack traces, API keys, user content
    });

    return c.json<ParseJobError>(
      {
        error: 'An error occurred processing your request.',
        code: 'INTERNAL_ERROR',
        requestId // For support correlation
      },
      500
    );
  }
});

export default {
  fetch: app.fetch,

  // Cron trigger handler
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    ctx.waitUntil(handleCron(env));
  },
};