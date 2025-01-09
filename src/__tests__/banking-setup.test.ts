import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import { UserRole } from '../../../types/user-role';
import { prisma, createTestUser, createTestFamily, cleanupTestData } from './setup/test-setup';

describe('Banking Module Setup', () => {
  // Define types for test data
  type TestUser = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    familyId: string | null;
  };

  // Match Prisma's return type
  type TestFamily = {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  };

  let testUser: TestUser;
  let testFamily: TestFamily & { members?: TestUser[] };

  beforeAll(async () => {
    try {
      // Step 1: Create test user first (PARENT role)
      testUser = await createTestUser({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.PARENT
      }) as TestUser;
      console.log('[Test Setup] Created test user:', { id: testUser.id, role: testUser.role });

      // Step 2: Create test family with the user as PARENT
      testFamily = await createTestFamily(testUser.id);
      console.log('[Test Setup] Created test family:', { id: testFamily.id });

      // Step 3: Update user with family ID to establish bidirectional relationship
      testUser = await prisma.user.update({
        where: { id: testUser.id },
        data: { familyId: testFamily.id }
      }) as TestUser;
      console.log('[Test Setup] Updated user with family:', { userId: testUser.id, familyId: testUser.familyId });
    } catch (error) {
      console.error('[Test Setup] Failed to setup test data:', error);
      // Ensure cleanup happens even if setup fails
      await cleanupTestData();
      await prisma.$disconnect();
      throw error;
    }
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  describe('Test Environment Setup', () => {
    it('should setup test user with correct properties', () => {
      expect(testUser).toBeDefined();
      expect(testUser.email).toBe('test@example.com');
      expect(testUser.firstName).toBe('Test');
      expect(testUser.lastName).toBe('User');
      expect(testUser.role).toBe(UserRole.PARENT);
      expect(testUser.familyId).toBe(testFamily.id);
    });

    it('should verify database connection and data persistence', async () => {
      // Query user data
      const savedUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      });
      expect(savedUser).toBeDefined();
      expect(savedUser?.id).toBe(testUser.id);
      expect(savedUser?.email).toBe('test@example.com');
      expect(savedUser?.role).toBe(UserRole.PARENT);

      // Query family data
      const savedFamily = await prisma.family.findUnique({
        where: { id: testFamily.id },
        include: { members: true }
      });
      expect(savedFamily).toBeDefined();
      expect(savedFamily?.name).toBe('Test Family');
      expect(savedFamily?.members).toHaveLength(1);
      expect(savedFamily?.members?.[0].role).toBe(UserRole.PARENT);
    });
  });

  describe('Family-User Relationships', () => {
    it('should maintain proper bidirectional relationship', async () => {
      // Query family with members
      const family = await prisma.family.findUnique({
        where: { id: testFamily.id },
        include: { members: true }
      });
      expect(family).toBeDefined();
      expect(family?.members).toHaveLength(1);
      expect(family?.members?.[0].id).toBe(testUser.id);

      // Query user with family
      const userWithFamily = await prisma.user.findUnique({
        where: { id: testUser.id },
        include: { family: true }
      });
      expect(userWithFamily?.family).toBeDefined();
      expect(userWithFamily?.family?.id).toBe(testFamily.id);
    });

    it('should not allow non-PARENT users to create families', async () => {
      const nonParentUser = await createTestUser({
        email: 'child@example.com',
        firstName: 'Child',
        lastName: 'User',
        role: UserRole.CHILD
      });

      await expect(createTestFamily(nonParentUser.id)).rejects.toThrow(
        'Only PARENT users can create families'
      );

      // Cleanup the test user
      await prisma.user.delete({ where: { id: nonParentUser.id } });
    });

    it('should handle missing user gracefully', async () => {
      const nonExistentUserId = 'non-existent-id';
      await expect(createTestFamily(nonExistentUserId)).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('Data Cleanup', () => {
    it('should handle cleanup properly', async () => {
      // Create temporary test data
      const tempUser = await createTestUser({
        email: 'temp@example.com',
        firstName: 'Temp',
        lastName: 'User',
        role: UserRole.PARENT
      });
      const tempFamily = await createTestFamily(tempUser.id);

      // Verify data exists
      expect(await prisma.user.findUnique({ where: { id: tempUser.id } })).toBeDefined();
      expect(await prisma.family.findUnique({ where: { id: tempFamily.id } })).toBeDefined();

      // Clean up
      await cleanupTestData();

      // Verify data is cleaned up
      expect(await prisma.user.findUnique({ where: { id: tempUser.id } })).toBeNull();
      expect(await prisma.family.findUnique({ where: { id: tempFamily.id } })).toBeNull();
    });
  });
});
