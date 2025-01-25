import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../../../lib/prisma';
import { UserRole } from '../../../types/user-role';
import { Account } from '../domain/Account';
import { BankingError } from '../errors/BankingError';


describe('Banking System - Current Functionality', () => {
  let testUser: any;
  let testFamily: any;

  beforeAll(async () => {
    // Create test family
    testFamily = await prisma.family.create({
      data: {
        name: 'Test Family'
      }
    });

    // Create test user (PARENT)
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'test-password',
        firstName: 'Test',
        lastName: 'User',
        username: 'test_user',
        role: UserRole.PARENT,
        familyId: testFamily.id
      }
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.bankAccount.deleteMany({
      where: { familyId: testFamily.id }
    });
    await prisma.user.deleteMany({
      where: { familyId: testFamily.id }
    });
    await prisma.family.delete({
      where: { id: testFamily.id }
    });
  });

  describe('Account Creation', () => {
    it('validates required fields', async () => {
      // Use Account domain model validation
      const invalidData = {
        name: '',  // Invalid: empty name
        type: 'SAVINGS',
        familyId: testFamily.id,
        userId: testUser.id,
        balance: 0
      };

      expect(() => Account.create(invalidData)).toThrow(BankingError);
    });

    it('validates account type', async () => {
      // Use Account domain model validation
      const invalidData = {
        name: 'Test Account',
        type: 'INVALID_TYPE', // Invalid type
        familyId: testFamily.id,
        userId: testUser.id,
        balance: 100
      };

      expect(() => Account.create(invalidData)).toThrow(BankingError);
    });

    it('creates account with valid data', async () => {
      const account = await prisma.bankAccount.create({
        data: {
          name: 'Test Account',
          type: 'SAVINGS',
          familyId: testFamily.id,
          userId: testUser.id,
          balance: 100
        }
      });

      expect(account).toBeDefined();
      expect(account.name).toBe('Test Account');
      expect(account.type).toBe('SAVINGS');
      expect(account.balance).toBe(100);
      expect(account.familyId).toBe(testFamily.id);
      expect(account.userId).toBe(testUser.id);
    });
  });
});
