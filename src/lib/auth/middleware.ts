// Authentication Middleware for Hono
import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { JWTManager } from './jwt';

export interface AuthenticatedUser {
  userId: number;
  email: string;
  name: string;
  provider: 'google' | 'naver' | 'kakao';
}

// Extend Context to include user property
declare module 'hono' {
  interface ContextVariableMap {
    user: AuthenticatedUser;
  }
}

export function authMiddleware(jwtSecret: string) {
  return async (c: Context, next: Next) => {
    // Get token from cookie
    const token = getCookie(c, 'auth_token');
    
    if (!token) {
      return c.json({ error: 'Unauthorized: No token provided' }, 401);
    }

    // Verify token
    const jwtManager = new JWTManager(jwtSecret);
    const payload = await jwtManager.verify(token);
    
    if (!payload) {
      return c.json({ error: 'Unauthorized: Invalid or expired token' }, 401);
    }

    // Set user in context
    c.set('user', {
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      provider: payload.provider,
    });

    await next();
  };
}

// Optional auth middleware (doesn't fail if no token)
export function optionalAuthMiddleware(jwtSecret: string) {
  return async (c: Context, next: Next) => {
    const token = getCookie(c, 'auth_token');
    
    if (token) {
      const jwtManager = new JWTManager(jwtSecret);
      const payload = await jwtManager.verify(token);
      
      if (payload) {
        c.set('user', {
          userId: payload.userId,
          email: payload.email,
          name: payload.name,
          provider: payload.provider,
        });
      }
    }

    await next();
  };
}
