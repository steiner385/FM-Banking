import { EventBus } from '../../../../core/events/EventBus';
import { PrismaClient, User, Family } from '@prisma/client';
import bcrypt from 'bcrypt';
import { UserRole } from '../../types/user-role';
import { generateToken } from '../../utils/auth';
import { Hono } from 'hono';
import bankingRouter from '../../routes';

// Initialize Prisma client with test config
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'file:./test.db'
    }
  },
  log: ['error']
});

// Export prisma instance
export { prisma };

export interface TestAppOptions {
  enableLogging?: boolean;
}

export function createTestApp(options: TestAppOptions = {}) {
  const app = new Hono();

  if (options.enableLogging) {
    app.use('*', async (c, next) => {
      console.log(`[Test] ${c.req.method} ${c.req.path}`);
      await next();
    });
  }

  app.route('/api/banking', bankingRouter);

  return app;
}

async function ensureConnection() {
  if (!isConnected) {
    await prisma.$connect();
    isConnected = true;
  }
}

export interface CreateUserData {
  email: string;
  password?: string;
  role: string;
  firstName: string;
  lastName: string;
  username: string;
  familyId?: string;
}

export interface TestContext {
  user: User;
  family: Family;
  token: string;
  cleanup: () => Promise<void>;
}

let isConnected = false;

export async function setupTestDb() {
  if (!isConnected) {
    await prisma.$connect();
    isConnected = true;
  }
  await cleanupTestData();
  return prisma;
}

export async function disconnect() {
  if (isConnected) {
    await prisma.$disconnect();
    isConnected = false;
  }
}

export async function cleanupTestData() {
  try {
    // Clear event bus first
    EventBus.getInstance().clearAllSubscribers();
    
    // Break up deletions to prevent memory spikes
    const cleanupSteps = [
      () => prisma.transaction.deleteMany(),
      () => new Promise(resolve => setTimeout(resolve, 100)),
      () => prisma.bankAccount.deleteMany(),
      () => new Promise(resolve => setTimeout(resolve, 100)),
      () => prisma.loan.deleteMany(),
      () => new Promise(resolve => setTimeout(resolve, 100)),
      () => prisma.marketplaceListing.deleteMany(),
      () => new Promise(resolve => setTimeout(resolve, 100)),
      () => prisma.user.updateMany({
        where: { familyId: { not: null } },
        data: { familyId: null }
      }),
      () => new Promise(resolve => setTimeout(resolve, 100)),
      () => prisma.user.deleteMany(),
      () => new Promise(resolve => setTimeout(resolve, 100)),
      () => prisma.family.deleteMany(),
      () => new Promise(resolve => setTimeout(resolve, 100))
    ];

    for (const step of cleanupSteps) {
      await step();
    }
  } catch (error) {
    console.error('Database cleanup failed:', error);
    await disconnect();
    throw error;
  } finally {
    await disconnect();
    // Force cleanup after disconnection
    if (global.gc) {
      global.gc();
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

export async function resetTestEnvironment() {
  try {
    await cleanupTestData();
    await disconnect();
    EventBus.getInstance().clearAllSubscribers();
    await new Promise(resolve => setTimeout(resolve, 100)); // Allow time for cleanup
  } catch (error) {
    console.error('Failed to reset test environment:', error);
    throw error;
  } finally {
    // Force cleanup
    if (global.gc) {
      global.gc();
    }
  }
}

export async function createTestUser(data: CreateUserData): Promise<TestUserResult> {
  await ensureConnection();
  try {
    const hashedPassword = await bcrypt.hash(data.password || 'testpassword', 10);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: data.role,
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        familyId: data.familyId
      }
    });
    return { user };
  } catch (error) {
    await disconnect();
    throw error;
  }
}

export async function createTestFamily(userId: string) {
  return prisma.family.create({
    data: {
      name: 'Test Family',
      members: {
        connect: [{ id: userId }]
      }
    }
  });
}

export function getTestUsers() {
  const timestamp = Date.now();
  return {
    parent: {
      email: `parent_${timestamp}@test.com`,
      password: 'testpassword',
      role: UserRole.PARENT,
      firstName: 'Parent',
      lastName: 'Test',
      username: `parent_${timestamp}`
    },
    member: {
      email: `member_${timestamp}@test.com`,
      password: 'testpassword',
      role: UserRole.MEMBER,
      firstName: 'Member',
      lastName: 'Test',
      username: `member_${timestamp}`
    }
  };
}
