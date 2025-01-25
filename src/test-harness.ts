import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { prisma } from '../../lib/prisma';
import bankingRouter from './index';

// Create test app
const app = new Hono();

// Add user context middleware for testing
app.use('*', async (c, next) => {
  // Simulate user context from headers
  const userId = c.req.header('X-User-Id');
  const userRole = c.req.header('X-User-Role');

  if (userId && userRole) {
    c.set('userId', userId);
    c.set('userRole', userRole);
  }

  await next();
});

// Mount banking module
app.route('/api/banking', bankingRouter);

// Start test server
const port = 3333;
console.log(`Test server running on port ${port}`);
console.log(`
Test URLs:
POST http://localhost:${port}/api/banking/accounts
Headers:
  X-User-Id: <user-id>
  X-User-Role: PARENT
Body:
{
  "name": "Test Account",
  "type": "SAVINGS",
  "familyId": "<family-id>",
  "userId": "<user-id>",
  "initialBalance": 100
}
`);

serve({
  fetch: app.fetch,
  port
});