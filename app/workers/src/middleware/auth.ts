import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import jwt from '@tsndr/cloudflare-worker-jwt';

interface User {
  id: string;
  email: string;
  role: string;
}

interface JWTPayload {
  sub: string;
  email?: string;
  role?: string;
  aud?: string;
  exp?: number;
}

export interface AuthBindings extends Context {
  user: User;
}

export async function authMiddleware(c: Context, next: Next) {
  try {
    // Get Authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HTTPException(401, { message: 'Missing or invalid authorization header' });
    }

    // Extract JWT token
    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new HTTPException(401, { message: 'Missing token' });
    }

    // Verify token locally using JWT secret
    // Note: SUPABASE_JWT_SECRET should be set via: wrangler secret put SUPABASE_JWT_SECRET
    // This is the JWT Secret from Supabase Project Settings > API
    const jwtSecret = c.env.SUPABASE_JWT_SECRET;
    if (!jwtSecret) {
      console.error('SUPABASE_JWT_SECRET not configured');
      throw new HTTPException(500, { message: 'Server configuration error' });
    }

    // Verify and decode JWT
    const isValid = await jwt.verify(token, jwtSecret, {
      algorithm: 'HS256',
      throwError: false
    });

    if (!isValid) {
      throw new HTTPException(401, { message: 'Invalid or expired token' });
    }

    // Decode token to get payload
    const payload = jwt.decode<JWTPayload>(token);
    if (!payload || !payload.payload) {
      throw new HTTPException(401, { message: 'Invalid token payload' });
    }

    const tokenData = payload.payload;

    // Extract user information from JWT payload
    const user = {
      id: tokenData.sub,
      email: tokenData.email || '',
      role: tokenData.role || 'authenticated'
    };

    // Add user to context
    c.set('user', user);

    // Continue to next middleware/route handler
    await next();
  } catch (err) {
    if (err instanceof HTTPException) {
      throw err;
    }
    console.error('Auth middleware error:', err);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
}