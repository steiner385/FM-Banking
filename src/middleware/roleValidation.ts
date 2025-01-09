import { Context, Next } from 'hono';
import { PrismaClient, User } from '@prisma/client';
import { BankingError } from '../errors/BankingError';
import { getPrismaClient } from '../../../lib/prisma';

/**
 * Middleware to validate that the user has a PARENT role
 * Returns 401 if user is not authenticated
 * Returns 403 if user is not a parent
 */
export const validateParentRole = async (c: Context, next: Next) => {
  const user = c.get('user');
  
  if (!user) {
    return c.json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
        entity: 'MODULE'
      }
    }, 401);
  }

  if (user.role !== 'PARENT') {
    return c.json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Only parents can perform this operation',
        entity: 'MODULE',
        details: {
          requiredRole: 'PARENT',
          userRole: user.role
        }
      }
    }, 403);
  }

  return await next();
};

/**
 * Middleware to validate that the user belongs to the requested family
 * Returns:
 * - 401 if user is not authenticated
 * - 403 if user is not a family member or tries to access another family
 * - 404 if family doesn't exist
 */
export const validateFamilyMemberRole = async (c: Context, next: Next) => {
  console.log('[Family Validation] Starting validation for request:', {
    path: c.req.path,
    method: c.req.method
  });

  const user = c.get('user');
  if (!user) {
    console.log('[Family Validation] User not authenticated');
    return c.json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
        entity: 'MODULE'
      }
    }, 401);
  }

  const { familyId } = c.req.param();
  
  if (!['PARENT', 'CHILD'].includes(user.role)) {
    console.log('[Family Validation] Invalid user role:', user.role);
    return c.json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Only family members can perform this operation',
        entity: 'MODULE',
        details: {
          requiredRoles: ['PARENT', 'CHILD'],
          userRole: user.role
        }
      }
    }, 403);
  }

  // Only validate family membership if familyId is present in route params
  if (familyId) {
    try {
      // Get prisma client
      const prisma = getPrismaClient();

      // Verify family exists and include its members for validation
      const family = await prisma.family.findUnique({
        where: { id: familyId },
        include: { members: true }
      });

      if (!family) {
        console.log('[Family Validation] Family not found:', familyId);
        return c.json({
          success: false,
          error: {
            code: 'FAMILY_NOT_FOUND',
            message: 'Family not found',
            entity: 'FAMILY'
          }
        }, 404);
      }

      // Verify user belongs to family by checking members list
      const userBelongsToFamily = family.members.some((member: User) => member.id === user.id);
      if (!userBelongsToFamily) {
        console.log('[Family Validation] User not in family:', {
          userId: user.id,
          familyId: family.id
        });
        return c.json({
          success: false,
          error: {
            code: 'USER_NOT_IN_FAMILY',
            message: 'User does not belong to this family',
            entity: 'USER'
          }
        }, 403);
      }

      console.log('[Family Validation] Validation successful:', {
        userId: user.id,
        familyId: family.id
      });
    } catch (error) {
      console.error('[Family Validation] Error:', error);
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Internal server error',
          entity: 'MODULE'
        }
      }, 500);
    }
  }

  return await next();
};
