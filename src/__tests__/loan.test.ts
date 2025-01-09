import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import { setupTestDatabase, cleanupTestDatabase } from '../../../__tests__/core/utils/test-setup';
import { createTestUser, createTestFamily, createTestBankAccount } from '../../../__tests__/core/utils/test-helpers';
import { BankAccountService } from '../services/account.service';
import { LoanService } from '../services/loan.service';
import { TransactionService } from '../services/transaction.service';
import { prisma } from '../../../lib/prisma';

describe('LoanService', () => {
  let loanService: LoanService;
  let transactionService: TransactionService;
  let testLender: any;
  let testBorrower: any;
  let testFamily: any;
  let lenderAccount: any;
  let borrowerAccount: any;

  beforeEach(async () => {
    await setupTestDatabase();
    transactionService = new TransactionService(new BankAccountService());
    loanService = new LoanService(transactionService);

    testLender = await createTestUser({ 
      email: `lender_${Date.now()}@test.com`,
      role: 'TEEN',
      firstName: 'Test',
      lastName: 'Lender'
    });

    testBorrower = await createTestUser({ 
      email: `borrower_${Date.now()}@test.com`,
      role: 'TEEN',
      firstName: 'Test',
      lastName: 'Borrower'
    });
    testFamily = await createTestFamily(testLender.id);
    
    lenderAccount = await createTestBankAccount({
      userId: testLender.id,
      familyId: testFamily.id,
      type: 'SAVINGS',
      balance: 1000
    });
    
    borrowerAccount = await createTestBankAccount({
      userId: testBorrower.id,
      familyId: testFamily.id,
      type: 'SAVINGS',
      balance: 100
    });
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  describe('requestLoan', () => {
    it('should create a pending loan request', async () => {
      const loanData = {
        borrowerId: testBorrower.id,
        lenderId: testLender.id,
        amount: 100,
        interestRate: 5,
        termDays: 30,
        purpose: 'Test loan',
        repaymentSchedule: 'MONTHLY'
      };

      const loan = await loanService.requestLoan(loanData);

      expect(loan).toBeDefined();
      expect(loan.status).toBe('PENDING');
      expect(loan.amount).toBe(loanData.amount);
      expect(loan.interestRate).toBe(loanData.interestRate);
    });
  });

  describe('approveLoan', () => {
    it('should process loan and create disbursement transaction when approved', async () => {
      // Create bank accounts first
      const lenderAccount = await prisma.bankAccount.create({
        data: {
          name: 'Lender Account',
          type: 'SAVINGS',
          balance: 1000,
          userId: testLender.id,
          familyId: testFamily.id
        }
      });

      const borrowerAccount = await prisma.bankAccount.create({
        data: {
          name: 'Borrower Account',
          type: 'SAVINGS',
          balance: 100,
          userId: testBorrower.id,
          familyId: testFamily.id
        }
      });

      // Create loan with user IDs
      const loan = await prisma.loan.create({
        data: {
          borrowerId: testBorrower.id,  // Use user ID
          lenderId: testLender.id,      // Use user ID
          amount: 100,
          interestRate: 5,
          termDays: 30,
          status: 'PENDING',
          purpose: 'Test loan',
          repaymentSchedule: 'MONTHLY'
        }
      });

      const approvalData = {
        parentApproval: true,
        lenderApproval: true,
      };

      // We need to modify LoanService to handle the account lookup
      const approvedLoan = await loanService.approveLoan(loan.id, approvalData);

      expect(approvedLoan.status).toBe('ACTIVE');

      // Verify disbursement transaction was created
      const transaction = await prisma.transaction.findFirst({
        where: {
          fromAccountId: lenderAccount.id,
          toAccountId: borrowerAccount.id,
          amount: loan.amount,
          category: 'LOAN_DISBURSEMENT'
        }
      });

      expect(transaction).toBeDefined();
    });
  });
});
