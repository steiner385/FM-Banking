import { describe, expect, it, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { setupTestContext, cleanupTestContext, cleanupTestDatabase } from '../../../__tests__/core/utils/test-setup';
import { createTestUser, createTestFamily } from '../../../__tests__/core/utils/test-helpers';
import { BankAccountService } from '../services/account.service';
import { prisma } from '../../../lib/prisma';

describe('BankAccountService', () => {
  let accountService: BankAccountService;
  let testUser: any;
  let testFamily: any;

  beforeAll(async () => {
    accountService = new BankAccountService();
  });

  afterAll(async () => {
    await cleanupTestContext();
  });

  beforeEach(async () => {
    console.log('Setting up test database...');
    try {
      await cleanupTestDatabase();
      console.log('Test database setup complete');
      
      accountService = new BankAccountService();
      console.log('Account service initialized');
      
      // Create test user with unique email
      const timestamp = Date.now();
      console.log('Creating test user...');
      testUser = await createTestUser({ 
        email: `parent_${timestamp}@test.com`,
        role: 'PARENT',
        firstName: 'Test',
        lastName: 'Parent'
      });
      console.log('Test user created successfully');
      
      if (!testUser?.id) {
        throw new Error('Failed to create test user');
      }
      
      testFamily = await createTestFamily(testUser.id);
      
      if (!testFamily?.id) {
        throw new Error('Failed to create test family');
      }
    } catch (error) {
      console.error('Test setup failed:', error);
      await cleanupTestDatabase().catch(console.error);
      throw error;
    }
  });

  afterEach(async () => {
    try {
      await prisma.$transaction([
        prisma.bankingAccount.deleteMany(),
        prisma.user.deleteMany(),
        prisma.family.deleteMany()
      ]);
    } catch (error) {
      console.error('Test cleanup failed:', error);
      throw error;
    }
  });

  describe('createAccount', () => {
    it('should create a new bank account', async () => {
      const accountData = {
        name: 'Test Account',
        type: 'SAVINGS',
        familyId: testFamily.id,
        userId: testUser.id,
        initialBalance: 100
      };

      const account = await accountService.createAccount(accountData);

      expect(account).toBeDefined();
      expect(account.name).toBe(accountData.name);
      expect(account.balance).toBe(accountData.initialBalance);
      
      // Verify account was created in database
      const savedAccount = await prisma.bankingAccount.findUnique({
        where: { id: account.id }
      });
      expect(savedAccount).toBeDefined();
      expect(savedAccount?.balance).toBe(accountData.initialBalance);
    }, 10000); // Add timeout for this specific test
  });
});
