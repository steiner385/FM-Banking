import { Context } from 'hono';
import { AccountService } from '../services/AccountService';
import { BankingError } from '../errors/BankingError';

export class AccountController {
  constructor(private readonly service: AccountService) {}

  async createAccount(c: Context) {
    try {
      const { familyId, name, type, initialBalance } = await c.req.json();
      const user = c.get('user');

      const account = await this.service.createAccount({
        familyId,
        userId: user.id,
        name,
        type,
        initialBalance
      });

      return c.json({ success: true, data: account }, 201);
    } catch (error) {
      if (error instanceof BankingError) {
        return c.json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            entity: error.entity,
            details: error.details
          }
        }, error.code === 'FAMILY_NOT_FOUND' ? 404 : 400);
      }
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Internal server error'
        }
      }, 500);
    }
  }

  async getAccount(c: Context) {
    try {
      const { id } = c.req.param();
      const account = await this.service.getAccount(id);
      return c.json({ success: true, data: account });
    } catch (error) {
      if (error instanceof BankingError) {
        return c.json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            entity: error.entity,
            details: error.details
          }
        }, error.code === 'NOT_FOUND' ? 404 : 400);
      }
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Internal server error'
        }
      }, 500);
    }
  }

  async getFamilyAccounts(c: Context) {
    try {
      const { familyId } = c.req.param();
      const user = c.get('user');
      const { type, sortBy, order } = c.req.query();

      const accounts = await this.service.getFamilyAccounts(familyId, user.id, {
        type,
        sortBy,
        order: order as 'asc' | 'desc'
      });

      return c.json({ success: true, data: accounts });
    } catch (error) {
      if (error instanceof BankingError) {
        switch (error.code) {
          case 'FAMILY_NOT_FOUND':
            return c.json({
              success: false,
              error: {
                code: error.code,
                message: error.message,
                entity: error.entity,
                details: error.details
              }
            }, 404);
          case 'USER_NOT_IN_FAMILY':
            return c.json({
              success: false,
              error: {
                code: error.code,
                message: error.message,
                entity: error.entity,
                details: error.details
              }
            }, 403);
          default:
            return c.json({
              success: false,
              error: {
                code: error.code,
                message: error.message,
                entity: error.entity,
                details: error.details
              }
            }, 400);
        }
      }
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Internal server error'
        }
      }, 500);
    }
  }
}