import { Hono } from 'hono';
import { serve, type ServerType } from '@hono/node-server';
import { logger } from '../utils/logger';

export interface ServerInstance {
  server: ServerType;
  app: Hono;
}

let activeServer: ServerInstance | null = null;

export function setActiveServer(server: ServerInstance | null) {
  activeServer = server;
}

export function getActiveServer(): ServerInstance | null {
  return activeServer;
}

export async function startServer(app: Hono): Promise<ServerInstance> {
  if (activeServer) {
    logger.info('Server already running');
    return activeServer;
  }

  return new Promise((resolve, reject) => {
    try {
      const port = process.env.PORT || 3000;
      const server = serve({
        fetch: app.fetch,
        port: Number(port)
      });
      
      const instance: ServerInstance = {
        server,
        app
      };
      
      setActiveServer(instance);
      logger.info(`Server running on port ${port}`);
      resolve(instance);
    } catch (error) {
      logger.error('Failed to start server:', { error });
      reject(error);
    }
  });
}
