import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from '../../utils/logger';
import { router } from './routes';

export function createApp(): Hono {
  const app = new Hono();

  // Middleware
  app.use('*', cors());
  app.use('*', async (c, next) => {
    try {
      return await next();
    } catch (error) {
      logger.error('Middleware error:', { error });
      return c.json({
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  // Mount banking routes
  app.route('/api/banking', router);

  return app;
}
