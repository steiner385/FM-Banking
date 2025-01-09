import { PrismaClient, User, Prisma } from '@prisma/client';
import { BankingError } from '../errors/BankingError';
import { AccountTypeEnum } from '../types';

export class AccountService {
  constructor(private readonly prisma: PrismaClient) {}

  async createAccount(data: {
    name: string;
    type: string;
    familyId: string;
    userId: string;
    initialBalance?: number;
  }, requestingUserId: string) {
    try {
      // Validate account type
      const accountTypeResult = AccountTypeEnum.safeParse(data.type);
      if (!accountTypeResult.success) {
        throw new BankingError({
          code: 'VALIDATION_ERROR',
          message: 'Invalid account type',
          entity: 'ACCOUNT',
          details: { allowedTypes: AccountTypeEnum.options }
        });
      }

      // Validate family exists and include its members with roles for validation
      const family = await this.prisma.family.findUnique({
        where: { id: data.familyId },
        include: { 
          members: {
            select: {
              id: true,
              role: true
            }
          }
        }
      });

      if (!family) {
        throw new BankingError({
          code: 'FAMILY_NOT_FOUND',
          message: 'Family not found',
          entity: 'FAMILY'
        });
      }

      // Validate requesting user belongs to family and has appropriate role
      const requestingMember = family.members.find(member => member.id === requestingUserId);
      if (!requestingMember) {
        throw new BankingError({
          code: 'USER_NOT_IN_FAMILY',
          message: 'Requesting user does not belong to this family',
          entity: 'USER'
        });
      }

      // Only parents can create accounts
      if (requestingMember.role !== 'PARENT') {
        throw new BankingError({
          code: 'FORBIDDEN',
          message: 'Only parents can create accounts',
          entity: 'USER',
          details: { requiredRole: 'PARENT', actualRole: requestingMember.role }
        });
      }

      // Validate target user belongs to family
      const targetMember = family.members.find(member => member.id === data.userId);
      if (!targetMember) {
        throw new BankingError({
          code: 'USER_NOT_IN_FAMILY',
          message: 'Target user does not belong to this family',
          entity: 'USER'
        });
      }

      const account = await this.prisma.bankAccount.create({
        data: {
          name: data.name,
          type: data.type,
          familyId: data.familyId,
          userId: data.userId,
          balance: data.initialBalance || 0
        }
      });
      return account;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BankingError({
          code: 'VALIDATION_ERROR',
          message: 'Invalid account data',
          entity: 'ACCOUNT',
          details: { prismaError: error.code }
        });
      }
      if (error instanceof BankingError) {
        throw error;
      } else {
        throw new BankingError({
          code: 'CREATE_ACCOUNT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create account',
          entity: 'ACCOUNT'
        });
      }
    }
  }

  async getAccount(id: string) {
    const account = await this.prisma.bankAccount.findUnique({
      where: { id }
    });
    if (!account) {
      throw new BankingError({
        code: 'NOT_FOUND',
        message: 'Account not found',
        entity: 'ACCOUNT'
      });
    }
    return account;
  }

  async getFamilyAccounts(familyId: string, userId: string, options?: {
    type?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }) {
    try {
      // Validate account type if provided
      if (options?.type) {
        const accountTypeResult = AccountTypeEnum.safeParse(options.type);
        if (!accountTypeResult.success) {
          throw new BankingError({
            code: 'VALIDATION_ERROR',
            message: 'Invalid account type in filter',
            entity: 'ACCOUNT',
            details: { allowedTypes: AccountTypeEnum.options }
          });
        }
      }

      // Get user with family info to check role and membership
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          family: true
        }
      });

      if (!user) {
        throw new BankingError({
          code: 'NOT_FOUND',
          message: 'User not found',
          entity: 'USER'
        });
      }

      // Verify user belongs to requested family
      if (user.familyId !== familyId) {
        throw new BankingError({
          code: 'USER_NOT_IN_FAMILY',
          message: 'User does not belong to this family',
          entity: 'USER'
        });
      }

      // Build where clause based on user role and filters
      const whereClause: Prisma.BankAccountWhereInput = {
        AND: [
          { familyId },
          // For child users, only show their own accounts
          ...(user.role === 'CHILD' ? [{ userId }] : []),
          // Apply type filter if provided
          ...(options?.type ? [{ type: options.type }] : [])
        ]
      };

      console.log('Query where clause:', whereClause);

      // Get accounts with user info
      const accounts = await this.prisma.bankAccount.findMany({
        where: whereClause,
        orderBy: options?.sortBy ? {
          [options.sortBy]: options.order || 'asc'
        } : undefined,
        include: {
          user: {
            select: {
              id: true,
              role: true
            }
          }
        }
      });

      console.log('Found accounts:', accounts);
      return accounts;
    } catch (error) {
      if (error instanceof BankingError) {
        throw error;
      }
      throw new BankingError({
        code: 'INTERNAL_ERROR',
        message: 'Failed to get family accounts',
        entity: 'ACCOUNT',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  }

  async updateBalance(id: string, amount: number) {
    const account = await this.getAccount(id);
    const newBalance = account.balance + amount;
    
    if (newBalance < 0) {
      throw new BankingError({
        code: 'INSUFFICIENT_FUNDS',
        message: 'Insufficient funds for this operation',
        entity: 'ACCOUNT'
      });
    }

    return this.prisma.bankAccount.update({
      where: { id },
      data: { balance: newBalance }
    });
  }
}
