import { prisma } from '../../../lib/prisma';
import { Transaction, User } from '@prisma/client';
import { BankAccountService } from './account.service';

export class TransactionService {
  constructor(private accountService: BankAccountService) {}

  private async verifyAccount(tx: any, accountId: string) {
    try {
      const account = await tx.bankAccount.findUnique({
        where: { id: accountId },
        include: {
          user: true
        }
      });

      if (!account) {
        throw new Error(`Account not found: ${accountId}`);
      }

      return account;
    } catch (error) {
      console.error(`Error verifying account ${accountId}:`, error);
      throw error;
    }
  }

  async requestTransaction(data: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    description?: string;
    category: string;
  }): Promise<Transaction> {
    try {
      return await prisma.$transaction(async (tx) => {
        console.log('Verifying accounts...');
        // Verify both accounts exist
        const [fromAccount, toAccount] = await Promise.all([
          this.verifyAccount(tx, data.fromAccountId),
          this.verifyAccount(tx, data.toAccountId)
        ]);
        console.log('Accounts verified');

        if (fromAccount.balance < data.amount) {
          throw new Error(`Insufficient funds: available ${fromAccount.balance}, required ${data.amount}`);
        }

        console.log('Creating transaction...');
        const transaction = await tx.transaction.create({
          data: {
            ...data,
            status: 'PENDING_APPROVAL'
          }
        });
        console.log('Transaction created:', transaction.id);

        return transaction;
      });
    } catch (error) {
      console.error('Error in requestTransaction:', error);
      throw error;
    }
  }

  async approveTransaction(id: string, approverNotes?: string): Promise<Transaction> {
    try {
      return await prisma.$transaction(async (tx) => {
        console.log('Finding transaction:', id);
        const transaction = await tx.transaction.findUnique({ 
          where: { id },
          include: {
            fromAccount: true,
            toAccount: true
          }
        });
        
        if (!transaction) {
          throw new Error(`Transaction not found: ${id}`);
        }
        console.log('Transaction found:', transaction.id);

        console.log('Updating account balances...');
        // Update balances atomically
        const [fromAccount, toAccount] = await Promise.all([
          tx.bankAccount.update({
            where: { id: transaction.fromAccountId },
            data: { balance: { decrement: transaction.amount } }
          }),
          tx.bankAccount.update({
            where: { id: transaction.toAccountId },
            data: { balance: { increment: transaction.amount } }
          })
        ]);
        console.log('Account balances updated');

        console.log('Completing transaction...');
        const updatedTransaction = await tx.transaction.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            description: approverNotes ? 
              `${transaction.description || ''}\nApprover notes: ${approverNotes}` : 
              transaction.description
          }
        });
        console.log('Transaction completed:', updatedTransaction.id);

        return updatedTransaction;
      });
    } catch (error) {
      console.error('Error in approveTransaction:', error);
      throw error;
    }
  }

  async rejectTransaction(id: string, rejectionReason: string): Promise<Transaction> {
    try {
      return await prisma.$transaction(async (tx) => {
        console.log('Finding transaction:', id);
        const transaction = await tx.transaction.findUnique({ where: { id } });
        if (!transaction) {
          throw new Error(`Transaction not found: ${id}`);
        }
        console.log('Transaction found:', transaction.id);

        console.log('Rejecting transaction...');
        const updatedTransaction = await tx.transaction.update({
          where: { id },
          data: {
            status: 'REJECTED',
            description: `Rejected: ${rejectionReason}`
          }
        });
        console.log('Transaction rejected:', updatedTransaction.id);

        return updatedTransaction;
      });
    } catch (error) {
      console.error('Error in rejectTransaction:', error);
      throw error;
    }
  }
}
