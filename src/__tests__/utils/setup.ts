import { PrismaClient, Prisma, User, Family } from '@prisma/client';
import { UserRole } from '../../../../types/user-role';
import { Hono } from 'hono';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { generateToken, verifyToken } from '../../utils/auth';
import { EventBus } from '../../../../core/events/EventBus';
import { cleanupMemory } from './memory-utils';
import bankingRouter from '../../routes';

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'file:./test.db';

// Prisma setup
let prismaInstance: PrismaClient | null = null;

function getTestDatabaseConfig(): Prisma.PrismaClientOptions {
  return {
    datasources: {
      db: {
        url: TEST_DATABASE_URL
      }
    },
    log: process.env.DEBUG ? ['query', 'error', 'warn'] as Prisma.LogLevel[] : ['error'] as Prisma.LogLevel[]
  };
}

export function getPrisma(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient(getTestDatabaseConfig());
  }
  return prismaInstance;
}

export type { Prisma };

async function resetPrismaConnection() {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}

// Database initialization
async function initializeTestDb() {
  try {
    const prisma = getPrisma();
    await prisma.$disconnect();

    const testDbPath = './test.db';
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: 'file:./test.db'
      }
    });

    await prisma.$connect();
    return true;
  } catch (error) {
    console.error('Failed to initialize test database:', error);
    throw error;
  }
}

// Initialize schema when module loads
initializeTestDb().catch(console.error);

// Types
export type BankingEnv = {
  Variables: {
    userId: string;
    userRole: string;
  };
};

export interface TestAppOptions {
  enableLogging?: boolean;
  enableAuth?: boolean;
}

export interface TestContext {
  user: User;
  family: Family;
  token: string;
  cleanup: () => Promise<void>;
}

export interface TestRequestOptions {
  method?: string;
  path: string;
  token?: string;
  userId?: string;
  userRole?: string;
  body?: any;
  headers?: Record<string, string>;
}

// Test app setup
export function createTestApp<T extends { Variables: any } = { Variables: BankingEnv }>(
  options: TestAppOptions = {}
): Hono<T> {
  const app = new Hono<T>();
  app.route('/api/banking', bankingRouter);

  if (options.enableLogging) {
    app.use('*', async (c, next) => {
      console.log(`[Test App] ${c.req.method} ${c.req.path}`);
      console.log('[Test App] Headers:', c.req.header());
      await next();
    });
  }

  if (options.enableAuth !== false) {
    app.use('*', async (c, next) => {
      const userId = c.req.header('X-User-Id');
      const userRole = c.req.header('X-User-Role');
      const authHeader = c.req.header('Authorization');

      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const decoded = await verifyToken(token);
          c.set('Variables', { 
            userId: decoded.userId,
            userRole: decoded.role 
          });
        } catch (error) {
          console.error('[Test App] Token verification failed:', error);
        }
      } else if (userId && userRole) {
        c.set('Variables', { userId, userRole });
      }

      await next();
    });
  }

  return app;
}

// Database management
let isConnected = false;

async function ensureConnection() {
  if (!isConnected) {
    const prisma = getPrisma();
    await prisma.$connect();
    isConnected = true;
  }
}

export async function disconnect() {
  if (isConnected) {
    const prisma = getPrisma();
    await prisma.$disconnect();
    isConnected = false;
  }
}

export async function setupTestDb() {
  try {
    await resetPrismaConnection();
    
    const testDbPath = './test.db';
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: 'file:./test.db'
      }
    });

    prismaInstance = getPrisma();
    await prismaInstance.$connect();
    
    return prismaInstance;
  } catch (error) {
    console.error('Test database setup failed:', error);
    throw error;
  }
}

export async function cleanupTestData(preserveContext?: boolean) {
  const prisma = getPrisma();
  try {
    EventBus.getInstance().clearAllSubscribers();
    
    // Clean up all transactions
    await prisma.transaction.deleteMany();
    await cleanupMemory();
    
    // Clean up all bank accounts
    await prisma.bankAccount.deleteMany();
    await cleanupMemory();
    
    // Clean up all loans
    await prisma.loan.deleteMany();
    await cleanupMemory();
    
    // Clean up all marketplace listings
    await prisma.marketplaceListing.deleteMany();
    await cleanupMemory();

    if (!preserveContext) {
      // Only clean up users and families if not preserving context
      await prisma.user.deleteMany();
      await cleanupMemory();
      
      await prisma.family.deleteMany();
      await cleanupMemory();
    }
  } catch (error) {
    console.warn('Cleanup warning:', error);
    await resetPrismaConnection();
  }
}

// Test data helpers
export async function createTestUser(data: {
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  familyId?: string;
  password?: string;
  username?: string;
}) {
  const timestamp = Date.now();
  const prisma = getPrisma();
  return prisma.user.create({
    data: {
      ...data,
      password: data.password || 'test-password',
      username: data.username || `test_${timestamp}`,
      updatedAt: new Date()
    }
  });
}

export async function createTestFamily(name: string = 'Test Family') {
  const prisma = getPrisma();
  return prisma.family.create({
    data: {
      name,
      updatedAt: new Date()
    }
  });
}

export async function createTestContext(options?: {
  userRole?: string;
  familyName?: string;
}): Promise<TestContext> {
  try {
    const timestamp = Date.now();
    const prisma = getPrisma();

    // Create family and user in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      const family = await tx.family.create({
        data: {
          name: options?.familyName || `Test Family ${timestamp}`,
          updatedAt: new Date()
        }
      });

      const user = await tx.user.create({
        data: {
          email: `test_${timestamp}@example.com`,
          role: options?.userRole || UserRole.PARENT,
          firstName: 'Test',
          lastName: 'User',
          username: `test_${timestamp}`,
          password: 'test-password',
          familyId: family.id,
          updatedAt: new Date()
        },
        include: {
          family: true
        }
      });

      return { family, user };
    });

    const { family, user } = result;
    
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return {
      user,
      family,
      token,
      cleanup: async () => {
        try {
          await cleanupTestData();
        } catch (error) {
          console.warn('[Test Context] Cleanup warning:', error);
        }
      }
    };
  } catch (error) {
    console.error('[Test Context] Setup failed:', error);
    await cleanupTestData();
    throw error;
  }
}

export async function makeTestRequest<T extends { Variables: any } = { Variables: BankingEnv }>(
  app: Hono<T>,
  options: TestRequestOptions
): Promise<Response> {
  try {
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...options.headers
    });

    if (options.token) {
      headers.set('Authorization', `Bearer ${options.token}`);
    }

    const response = await app.request(options.path, {
      method: options.method || 'GET',
      headers,
      ...(options.body ? { body: JSON.stringify(options.body) } : {})
    });

    const status = response.status;
    const responseData = await response.json();
    
    return new Response(JSON.stringify(responseData), { status });
  } catch (error) {
    console.error('[Test Request] Failed:', error);
    throw error;
  } finally {
    await cleanupMemory();
  }
}

export async function assertSuccessResponse(response: Response, status = 200) {
  expect(response.status).toBe(status);
  const data = await response.json();
  expect(data.success).toBe(true);
  return data;
}

export async function assertErrorResponse(
  response: Response,
  status: number,
  errorCode: string
) {
  expect(response.status).toBe(status);
  const data = await response.json();
  expect(data.success).toBe(false);
  expect(data.error.code).toBe(errorCode);
  return data;
}