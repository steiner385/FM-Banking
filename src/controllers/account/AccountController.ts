import { Context } from 'hono';
import { CustomPrismaClient } from '../../prisma/client';
import { BankingError } from '../../errors/BankingError';
import { AccountType, AccountStatus, CreateAccountInput, UserCreatedEvent, FamilyUpdatedEvent } from '../../types';
import { errorResponse, successResponse } from '../../utils/response';

export class AccountController {
  constructor(private readonly prisma: CustomPrismaClient) {}

  async handleUserCreated(data: UserCreatedEvent): Promise<void> {
    try {
      // Create default checking account for new users
      await this.prisma.createAccount({
        name: 'Primary Checking',
        type: AccountType.CHECKING,
        userId: data.userId,
        familyId: data.familyId
      });
    } catch (error) {
      throw new BankingError({
        code: 'CREATE_ACCOUNT_ERROR',
        message: 'Failed to create default account for new user',
        entity: 'ACCOUNT',
        details: { userId: data.userId, error }
      });
    }
  }

  async handleFamilyUpdated(data: FamilyUpdatedEvent): Promise<void> {
    try {
      // Update account access based on family membership changes
      const accounts = await this.prisma.findAccountsByFamilyId(data.familyId);
      const memberIds = new Set(data.members.map(m => m.id));

      for (const account of accounts) {
        if (!memberIds.has(account.userId)) {
          // User no longer in family, close their accounts
          await this.prisma.$queryRaw`
            UPDATE "BankAccount"
            SET status = ${AccountStatus.CLOSED}
            WHERE id = ${account.id}
          `;
        }
      }
    } catch (error) {
      throw new BankingError({
        code: 'UPDATE_ACCOUNT_ERROR',
        message: 'Failed to update accounts for family change',
        entity: 'ACCOUNT',
        details: { familyId: data.familyId, error }
      });
    }
  }

  async createAccount(c: Context): Promise<Response> {
    try {
      const user = c.get('user');
      if (!user?.id) {
        throw new BankingError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
          entity: 'ACCOUNT'
        });
      }

      const body = await c.req.json();
      const { name, type, familyId, userId: targetUserId, initialBalance } = body;

      // Validate required fields
      if (!name || !type || !familyId || !targetUserId) {
        throw new BankingError({
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields',
          entity: 'ACCOUNT',
          details: { 
            missing: ['name', 'type', 'familyId', 'userId'].filter(field => !body[field])
          }
        });
      }

      // Verify account type is valid
      if (!Object.values(AccountType).includes(type)) {
        throw new BankingError({
          code: 'VALIDATION_ERROR',
          message: 'Invalid account type',
          entity: 'ACCOUNT',
          details: { 
            type,
            validTypes: Object.values(AccountType)
          }
        });
      }

      const account = await this.prisma.createAccount({
        name,
        type: type as AccountType,
        balance: initialBalance,
        userId: targetUserId,
        familyId
      });

      return successResponse(c, account, 201);
    } catch (error) {
      console.error('[AccountController] Create account error:', error);
      return errorResponse(c, error);
    }
  }

  async getAccount(c: Context): Promise<Response> {
    try {
      const user = c.get('user');
      if (!user?.id) {
        throw new BankingError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
          entity: 'ACCOUNT'
        });
      }

      const { id } = c.req.param();
      if (!id) {
        throw new BankingError({
          code: 'VALIDATION_ERROR',
          message: 'Account ID is required',
          entity: 'ACCOUNT'
        });
      }

      const account = await this.prisma.findAccountById(id);
      if (!account) {
        throw new BankingError({
          code: 'NOT_FOUND',
          message: 'Account not found',
          entity: 'ACCOUNT'
        });
      }

      // Verify user has access to this account
      if (account.userId !== user.id && account.familyId !== user.familyId) {
        throw new BankingError({
          code: 'FORBIDDEN',
          message: 'User does not have access to this account',
          entity: 'ACCOUNT'
        });
      }

      return successResponse(c, account);
    } catch (error) {
      console.error('[AccountController] Get account error:', error);
      return errorResponse(c, error);
    }
  }

  async getFamilyAccounts(c: Context): Promise<Response> {
    try {
      const user = c.get('user');
      if (!user?.id) {
        throw new BankingError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
          entity: 'ACCOUNT'
        });
      }

      const { familyId } = c.req.param();
      const { type } = c.req.query();

      // Verify user belongs to the family
      if (user.familyId !== familyId) {
        throw new BankingError({
          code: 'FORBIDDEN',
          message: 'User does not have access to this family',
          entity: 'ACCOUNT'
        });
      }

      let accounts = await this.prisma.findAccountsByFamilyId(familyId);

      // Filter by type if specified
      if (type && Object.values(AccountType).includes(type as AccountType)) {
        accounts = accounts.filter(account => account.type === type);
      }

      return successResponse(c, accounts);
    } catch (error) {
      console.error('[AccountController] Get family accounts error:', error);
      return errorResponse(c, error);
    }
  }
}
