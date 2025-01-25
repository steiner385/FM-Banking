import { prisma } from '../../lib/prisma';
import { Loan } from '@prisma/client';
import { TransactionService } from './transaction.service';

export class LoanService {
  constructor(private transactionService: TransactionService) {}

  async requestLoan(data: {
    borrowerId: string;
    lenderId: string;
    amount: number;
    interestRate: number;
    termDays: number;
    purpose: string;
    repaymentSchedule?: string;
  }): Promise<Loan> {
    return prisma.loan.create({
      data: {
        ...data,
        status: 'PENDING',
        repaymentSchedule: data.repaymentSchedule || 'MONTHLY'
      }
    });
  }

  async approveLoan(id: string, data: {
    parentApproval: boolean;
    lenderApproval: boolean;
    adjustedTerms?: {
      interestRate: number;
      termDays: number;
    };
  }): Promise<Loan> {
    const loan = await prisma.loan.findUnique({ 
      where: { id },
      include: {
        borrower: true,
        lender: true
      }
    });
    if (!loan) throw new Error('Loan not found');

    if (data.parentApproval && data.lenderApproval) {
      // Find the accounts for both users
      const [lenderAccount, borrowerAccount] = await Promise.all([
        prisma.bankAccount.findFirst({
          where: { userId: loan.lenderId }
        }),
        prisma.bankAccount.findFirst({
          where: { userId: loan.borrowerId }
        })
      ]);

      if (!lenderAccount || !borrowerAccount) {
        throw new Error('Bank accounts not found for lender or borrower');
      }

      // Create initial loan disbursement transaction
      await this.transactionService.requestTransaction({
        fromAccountId: lenderAccount.id,
        toAccountId: borrowerAccount.id,
        amount: loan.amount,
        category: 'LOAN_DISBURSEMENT',
        description: `Loan disbursement: ${loan.purpose}`
      });

      return prisma.loan.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          ...(data.adjustedTerms && {
            interestRate: data.adjustedTerms.interestRate,
            termDays: data.adjustedTerms.termDays
          })
        }
      });
    } else {
      return prisma.loan.update({
        where: { id },
        data: {
          status: 'CANCELLED'
        }
      });
    }
  }
}
