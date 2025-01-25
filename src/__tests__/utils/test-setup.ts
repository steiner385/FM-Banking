import { PrismaClient } from '@prisma/client';
import { EventBus } from '../../../../core/events/EventBus';

// Initialize Prisma client with test config
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'file:./test.db'
    }
  },
  log: ['error']
});

// Export prisma instance and disconnect function
export { prisma };

export async function disconnect() {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('Failed to disconnect:', error);
  }
}

// Export resetTestEnvironment function
export async function resetTestEnvironment() {
  try {
    await cleanupTestData();
    await prisma.$disconnect();
    EventBus.getInstance().clearAllSubscribers();
    await new Promise(resolve => setTimeout(resolve, 100)); // Allow time for cleanup
  } catch (error) {
    console.error('Failed to reset test environment:', error);
    throw error;
  }
}

// Export cleanupTestData function
export async function cleanupTestData() {
  try {
    // Clear event subscribers first
    EventBus.getInstance().clearAllSubscribers();
    
    // Use individual deletes instead of transaction to reduce memory usage
    await prisma.transaction.deleteMany();
    await prisma.bankAccount.deleteMany();
    await prisma.loan.deleteMany();
    await prisma.marketplaceListing.deleteMany();
    
    // Clear family associations first
    await prisma.user.updateMany({
      where: { familyId: { not: null } },
      data: { familyId: null }
    });
    
    await prisma.user.deleteMany();
    await prisma.family.deleteMany();
    
  } catch (error) {
    console.error('Database cleanup failed:', error);
    throw error;
  }
}

// Re-export test utilities
export * from './test-utils';
