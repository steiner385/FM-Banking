import { Context, Next } from 'hono';
import { verifyToken } from '../utils/auth';

export async function setUserContext(c: Context, next: Next) {
  console.log('[Auth] Middleware called for path:', c.req.path);
  
  try {
    // First try JWT token auth
    const authHeader = c.req.header('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = await verifyToken(token);
      
      console.log('[Auth] JWT token verified:', decoded);
      
      c.set('Variables', { 
        userId: decoded.userId,
        userRole: decoded.role 
      });
      c.set('user', { 
        id: decoded.userId,
        role: decoded.role 
      });
      
      return await next();
    }
    
    // Fallback to header-based auth
    const userId = c.req.header('X-User-Id');
    const userRole = c.req.header('X-User-Role');

    console.log('[Auth] Headers:', {
      userId,
      userRole,
      raw: c.req.raw.headers
    });

    if (userId && userRole) {
      console.log('[Auth] Setting user context from headers');
      c.set('Variables', { userId, userRole });
      c.set('user', { id: userId, role: userRole });
      return await next();
    }

    console.log('[Auth] No valid authentication found');
    return c.json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid authentication',
        entity: 'MODULE'
      }
    }, 401);

  } catch (error) {
    console.error('[Auth] Error:', error);
    return c.json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: error instanceof Error ? error.message : 'Authentication failed',
        entity: 'MODULE'
      }
    }, 401);
  } finally {
    const status = c.res?.status;
    console.log('[Auth] Response status:', status);
  }
}
