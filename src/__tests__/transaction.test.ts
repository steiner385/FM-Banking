import { describe, expect, it, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { prisma, setupTestContext, cleanupTestContext, cleanupTestDatabase } from '../../../__tests__/core/utils/test-setup';
import { UserRole } from '../../../types/user-role';
import { TransactionService } from '../services/transaction.service';
import { BankAccountService } from '../services/account.service';
import { createTestUser, createTestFamily } from '../../../__tests__/core/utils/test-helpers';

describe('TransactionService', () => {
  let parentId: string;
  let childId: string;
  let familyId: string;
  let parentAccount: any;
  let childAccount: any;

  beforeAll(async () => {
    try {
      console.log('Setting up test data...');

      // Create family
      const family = await prisma.family.create({
        data: { name: 'Test Family' }
      });
      familyId = family.id;
      console.log('Family created:', familyId);

      // Create parent
      const parent = await prisma.user.create({
        data: {
          email: `parent_${Date.now()}@test.com`,
          password: 'hashedPassword',
          firstName: 'Parent',
          lastName: 'User',
          role: UserRole.PARENT,
          familyId,
          username: `parent_${Date.now()}`
        }
      });
      parentId = parent.id;
      console.log('Parent created:', parentId);

      // Create child
      const child = await prisma.user.create({
        data: {
          email: `child_${Date.now()}@test.com`,
          password: 'hashedPassword',
          firstName: 'Child',
          lastName: 'User',
          role: UserRole.CHILD,
          familyId,
          username: `child_${Date.now()}`
        }
      });
      childId = child.id;
      console.log('Child created:', childId);

      // Create accounts
      parentAccount = await prisma.bankingAccount.create({
        data: {
          name: 'Parent Account',
          type: 'CHECKING',
          balance: 1000,
          userId: parentId,
          familyId
        }
      });
      console.log('Parent account created:', parentAccount.id);

      childAccount = await prisma.bankingAccount.create({
        data: {
          name: 'Child Account',
          type: 'ALLOWANCE',
          balance: 100,
          userId: childId,
          familyId
        }
      });
      console.log('Child account created:', childAccount.id);

      console.log('Test setup complete');
    } catch (error) {
      console.error('Test setup error:', error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
      console.log('Starting cleanup...');
      await prisma.$transaction([
        prisma.transaction.deleteMany(),
        prisma.bankingAccount.deleteMany(),
        prisma.user.updateMany({
          where: { familyId: { not: null } },
          data: { familyId: null }
        }),
        prisma.user.deleteMany(),
        prisma.family.deleteMany()
      ]);
      console.log('Cleanup complete');
    } catch (error) {
      console.error('Test cleanup error:', error);
      throw error;
    }
  });

  beforeEach(async () => {
    try {
      console.log('Cleaning up transactions...');
      await prisma.transaction.deleteMany();
      console.log('Transactions cleaned up');
    } catch (error) {
      console.error('Transaction cleanup error:', error);
      throw error;
    }
  });

  it('should create a pending transaction for child account', async () => {
    console.log('Starting transaction test...');
    const accountService = new BankAccountService();
    const transactionService = new TransactionService(accountService);

    const transactionData = {
      fromAccountId: childAccount.id,
      toAccountId: parentAccount.id,
      amount: 50,
      description: 'Test transaction',
      category: 'TEST'
    };

    console.log('Creating transaction with data:', transactionData);
    const transaction = await transactionService.requestTransaction(transactionData);
    console.log('Transaction created:', transaction);

    expect(transaction).toBeDefined();
    expect(transaction.status).toBe('PENDING_APPROVAL');
    expect(transaction.amount).toBe(transactionData.amount);

    // Verify in database
    const savedTransaction = await prisma.transaction.findUnique({
      where: { id: transaction.id }
    });

    expect(savedTransaction).toBeDefined();
    expect(savedTransaction?.status).toBe('PENDING_APPROVAL');
    expect(savedTransaction?.amount).toBe(transactionData.amount);
    console.log('Transaction test completed successfully');
  });
});
