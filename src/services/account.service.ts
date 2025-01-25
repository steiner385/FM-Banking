import { prisma } from '../../lib/prisma';
import { BankAccount } from '@prisma/client';

export class BankAccountService {
  async createAccount(data: {
    name: string;
    type: string;
    familyId: string;
    userId: string;
    initialBalance: number;
  }): Promise<BankAccount> {
    return prisma.bankAccount.create({
      data: {
        name: data.name,
        type: data.type as any,
        familyId: data.familyId,
        userId: data.userId,
        balance: data.initialBalance
      }
    });
  }

  async getAccount(id: string): Promise<BankAccount> {
    const account = await prisma.bankAccount.findUnique({
      where: { id },
      include: {
        sentTransactions: {
          orderBy: { createdAt: 'desc' }
        },
        receivedTransactions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!account) throw new Error('Account not found');
    return account;
  }

  async getFamilyAccounts(familyId: string, options: {
    type?: string;
    userId?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }): Promise<BankAccount[]> {
    return prisma.bankAccount.findMany({
      where: {
        familyId,
        ...(options.type && { type: options.type as any }),
        ...(options.userId && { userId: options.userId })
      },
      orderBy: {
        [options.sortBy || 'createdAt']: options.order || 'desc'
      }
    });
  }

  async updateBalance(id: string, amount: number): Promise<BankAccount> {
    return prisma.bankAccount.update({
      where: { id },
      data: {
        balance: {
          increment: amount
        }
      }
    });
  }
}
