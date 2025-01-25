import { PrismaClient } from '@prisma/client';
import { UserRole } from '../../../../types/user-role';

// Initialize test database
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test.db'
    }
  }
});

/**
 * Creates a test user with the given properties
 * @param data User properties
 * @returns Created test user
 */
export async function createTestUser(data: {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}) {
  return prisma.user.create({
    data: {
      ...data,
      password: 'test-password',
      username: `test_${Date.now()}`
    }
  });
}

/**
 * Creates a test family and associates it with a user
 * @param userId The ID of the user to associate with the family
 * @returns Created test family
 */
export async function createTestFamily(userId: string) {
  // First check if user exists and has correct role
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.role !== UserRole.PARENT) {
    throw new Error('Only PARENT users can create families');
  }

  return prisma.family.create({
    data: {
      name: 'Test Family',
      members: {
        connect: [{ id: userId }]
      }
    }
  });
}

/**
 * Cleans up test data from the database
 */
export async function cleanupTestData() {
  try {
    await prisma.$transaction([
      prisma.bankAccount.deleteMany(),
      prisma.user.deleteMany(),
      prisma.family.deleteMany()
    ]);
    console.log('[Test Utils] Successfully cleaned up test data');
  } catch (error) {
    console.error('[Test Utils] Failed to clean up test data:', error);
    throw error;
  }
}
