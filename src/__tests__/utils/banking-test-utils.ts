import { prisma } from '../../../../lib/prisma';
import { PrismaClient } from '@prisma/client';

// Banking test utilities
/**
 * Clean up all banking-related test data
 */
export async function cleanupBankingData() {
  await prisma.$transaction([
    prisma.transaction.deleteMany(),
    prisma.bankAccount.deleteMany(),
    prisma.loan.deleteMany(),
    prisma.marketplaceListing.deleteMany(),
  ]);
}

/**
 * Create a test bank account
 */
export async function createTestBankAccount(data: {
  userId: string;
  familyId: string;
  type: 'SAVINGS' | 'CHECKING' | 'ALLOWANCE';
  balance?: number;
  name?: string;
}) {
  return prisma.bankAccount.create({
    data: {
      userId: data.userId,
      familyId: data.familyId,
      type: data.type,
      balance: data.balance || 0,
      name: data.name || `Test ${data.type} Account`
    }
  });
}

/**
 * Create a test transaction
 */
export async function createTestTransaction(data: {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  category?: 'ALLOWANCE' | 'REWARD' | 'TRANSFER' | 'PAYMENT';
  description?: string;
  status?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
}) {
  return prisma.transaction.create({
    data: {
      fromAccountId: data.fromAccountId,
      toAccountId: data.toAccountId,
      amount: data.amount,
      category: data.category || 'TRANSFER',
      description: data.description,
      status: data.status || 'PENDING_APPROVAL'
    }
  });
}

/**
 * Create a test loan
 */
export async function createTestLoan(data: {
  borrowerId: string;
  lenderId: string;
  amount: number;
  interestRate?: number;
  termDays?: number;
  purpose?: string;
  repaymentSchedule?: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'ONCE';
  status?: 'PENDING' | 'ACTIVE' | 'LATE' | 'DEFAULTED' | 'COMPLETED' | 'CANCELLED';
}) {
  return prisma.loan.create({
    data: {
      borrowerId: data.borrowerId,
      lenderId: data.lenderId,
      amount: data.amount,
      interestRate: data.interestRate || 0,
      termDays: data.termDays || 30,
      purpose: data.purpose || 'Test loan',
      repaymentSchedule: data.repaymentSchedule || 'ONCE',
      status: data.status || 'PENDING'
    }
  });
}
