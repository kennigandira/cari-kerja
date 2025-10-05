import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware, AuthBindings } from './middleware/auth';
import { handleCron } from './cron';

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

export default {
  fetch: app.fetch,

  // Cron trigger handler
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    ctx.waitUntil(handleCron(env));
  },
};