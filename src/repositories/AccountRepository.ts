import { PrismaClient, Prisma } from '@prisma/client';
import { AccountInterface, AccountRepositoryInterface } from '../interfaces/AccountInterface';
import { Account } from '../domain/Account';
import { BankingError } from '../errors/BankingError';
import { AccountFilters } from '../types';

export class AccountRepository implements AccountRepositoryInterface {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: Omit<AccountInterface, 'id'>): Promise<AccountInterface> {
    try {
      const account = await this.prisma.bankAccount.create({
        data: {
          name: data.name,
          type: data.type,
          familyId: data.familyId,
          userId: data.userId,
          balance: data.balance
        }
      });

      return Account.create(account);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BankingError({
          code: 'DATABASE_ERROR',
          message: 'Failed to create account',
          entity: 'ACCOUNT',
          details: { error: error.message }
        });
      }
      throw error;
    }
  }

  async findById(id: string): Promise<AccountInterface | null> {
    try {
      const account = await this.prisma.bankAccount.findUnique({
        where: { id }
      });

      if (!account) {
        return null;
      }

      return Account.create(account);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BankingError({
          code: 'DATABASE_ERROR',
          message: 'Failed to find account',
          entity: 'ACCOUNT',
          details: { error: error.message }
        });
      }
      throw error;
    }
  }

  async findByFamily(familyId: string, options?: AccountFilters): Promise<AccountInterface[]> {
    try {
      console.log('[AccountRepository] Finding family accounts:', { familyId, options });
      const accounts = await this.prisma.bankAccount.findMany({
          where: {
            familyId,
            ...(options?.type && { type: options.type }),
            ...(options?.userId && { userId: options.userId })
          },
          orderBy: options?.sortBy ? {
            [options.sortBy]: options.order || 'desc'
          } : undefined
        });

      console.log('[AccountRepository] Found accounts:', accounts);
      const mappedAccounts = accounts.map(account => Account.create(account));
      console.log('[AccountRepository] Mapped accounts:', mappedAccounts);
      return mappedAccounts;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BankingError({
          code: 'DATABASE_ERROR',
          message: 'Failed to find family accounts',
          entity: 'ACCOUNT',
          details: { error: error.message }
        });
      }
      throw error;
    }
  }

  async updateBalance(id: string, amount: number): Promise<AccountInterface> {
    return this.prisma.$transaction(async (tx) => {
      try {
        // First get current account to validate balance
        const currentAccount = await tx.bankAccount.findUnique({
          where: { id }
        });

        if (!currentAccount) {
          throw new BankingError({
            code: 'NOT_FOUND',
            message: 'Account not found',
            entity: 'ACCOUNT'
          });
        }

        // Use domain model to validate operation
        const account = Account.create(currentAccount);
        if (amount < 0 && !account.canWithdraw(Math.abs(amount))) {
          throw new BankingError({
            code: 'INSUFFICIENT_FUNDS',
            message: `Insufficient funds: available ${account.balance}, required ${Math.abs(amount)}`,
            entity: 'ACCOUNT'
          });
        }

        // Update balance
        const updatedAccount = await tx.bankAccount.update({
          where: { id },
          data: {
            balance: {
              increment: amount
            }
          }
        });

        return Account.create(updatedAccount);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw new BankingError({
            code: 'DATABASE_ERROR',
            message: 'Failed to update account balance',
            entity: 'ACCOUNT',
            details: { error: error.message }
          });
        }
        throw error;
      }
    });
  }
}
