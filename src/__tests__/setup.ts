import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';

// Initialize test database
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test.db'
    }
  }
});

// Define environment type
type BankingEnv = {
  Variables: {
    userId: string;
    userRole: string;
  };
};

// Create test app
export function createTestApp() {
  const app = new Hono<{ Variables: BankingEnv }>();

  // Add test-specific middleware to ensure headers are properly set
  app.use('*', async (c, next) => {
    // Ensure headers exist and are properly initialized
    if (!c.req.raw.headers) {
      c.req.raw.headers = new Headers();
    }
    
    // Get headers from request
    const userId = c.req.header('X-User-Id');
    const userRole = c.req.header('X-User-Role');

    if (userId && userRole) {
      // Set variables in context
      c.set('Variables', { userId, userRole });
    }

    console.log('[Test App] Request headers:', {
      userId,
      userRole,
      raw: c.req.raw.headers
    });

    await next();
  });

  return app;
}

// Cleanup test data
export async function cleanupTestData() {
  await prisma.bankAccount.deleteMany();
  await prisma.user.deleteMany();
  await prisma.family.deleteMany();
}

// Create test user
export async function createTestUser(data: {
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  familyId?: string;
}) {
  return prisma.user.create({
    data: {
      ...data,
      password: 'test-password',
      username: `test_${Date.now()}`
    }
  });
}

// Create test family
export async function createTestFamily(name: string = 'Test Family') {
  return prisma.family.create({
    data: { name }
  });
}
