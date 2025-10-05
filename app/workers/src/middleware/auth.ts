import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { decode, verify } from 'hono/jwt';

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

    // Verify JWT with Supabase public key
    const supabaseUrl = c.env.SUPABASE_URL;
    const jwksResponse = await fetch(`${supabaseUrl}/rest/v1/auth/jwks`);
    const jwks = await jwksResponse.json();

    try {
      // Verify and decode token
      const decoded = await verify(token, jwks);
      const user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role
      };

      // Add user to context
      c.set('user', user);

      // Continue to next middleware/route handler
      await next();
    } catch (err) {
      throw new HTTPException(401, { message: 'Invalid or expired token' });
    }
  } catch (err) {
    if (err instanceof HTTPException) {
      throw err;
    }
    throw new HTTPException(500, { message: 'Internal server error' });
  }
}