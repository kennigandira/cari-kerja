import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';

interface User {
  id: string;
  email: string;
  role: string;
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

    // Verify token by calling Supabase API
    const supabaseUrl = c.env.SUPABASE_URL;
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': c.env.SUPABASE_SERVICE_KEY
      }
    });

    if (!response.ok) {
      throw new HTTPException(401, { message: 'Invalid or expired token' });
    }

    const userData = await response.json() as { id: string; email: string; role?: string };
    const user = {
      id: userData.id,
      email: userData.email,
      role: userData.role || 'authenticated'
    };

    // Add user to context
    c.set('user', user);

    // Continue to next middleware/route handler
    await next();
  } catch (err) {
    if (err instanceof HTTPException) {
      throw err;
    }
    throw new HTTPException(500, { message: 'Internal server error' });
  }
}