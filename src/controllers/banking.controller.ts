import { Context } from 'hono';
import { prisma } from '../../../core/utils/prisma';
import { UserRole } from '../../../core/types/user-role';
import type { BankAccount, Prisma } from '@prisma/client';

export class BankingController {
  static async createAccount(c: Context): Promise<Response> {
    try {
      // Get authenticated user from context (role already checked by middleware)
      const user = c.get('user');

      const body = await c.req.json();
      const { name, type, familyId, userId, initialBalance } = body;

      // Validate input
      if (!name || !type || !familyId || !userId) {
        console.log('Missing required fields:', { name, type, familyId, userId });
        return c.json({ 
          error: { 
            message: 'Missing required fields',
            details: {
              name: !name ? 'Name is required' : undefined,
              type: !type ? 'Type is required' : undefined,
              familyId: !familyId ? 'Family ID is required' : undefined,
              userId: !userId ? 'User ID is required' : undefined
            }
          } 
        }, 400);
      }

      // Define valid account types
      const VALID_ACCOUNT_TYPES = ['SAVINGS', 'CHECKING', 'ALLOWANCE'] as const;
      type AccountType = typeof VALID_ACCOUNT_TYPES[number];

      // Validate account type
      if (!VALID_ACCOUNT_TYPES.includes(type as AccountType)) {
        return c.json({
          error: {
            message: 'Invalid account type',
            details: `Type must be one of: ${VALID_ACCOUNT_TYPES.join(', ')}`
          }
        }, 400);
      }

      // Verify family exists and user has access
      const family = await prisma.family.findUnique({
        where: { id: familyId },
        include: { members: true }
      });

      if (!family) {
        return c.json({ error: { message: 'Family not found' } }, 404);
      }

      // Verify target user exists and belongs to family
      const targetUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!targetUser || targetUser.familyId !== familyId) {
        return c.json({ error: { message: 'Invalid user ID' } }, 400);
      }

      // Create account with validated type
      const result = await prisma.bankAccount.create({
        data: {
          name,
          type,
          balance: initialBalance || 0,
          user: { connect: { id: userId } },
          family: { connect: { id: familyId } }
        }
      });

      return c.json({ data: result }, 201);
    } catch (error) {
      console.error('Create account error:', error);
      return c.json({ 
        error: { 
          message: 'Failed to create account',
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      }, 500);
    }
  }
}
