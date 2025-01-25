import { Request, Response, NextFunction } from 'express';
import { BankingError } from '../types/errors';

type UserRole = 'PARENT' | 'CHILD';

export const validateRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new BankingError('Unauthorized', 401);
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new BankingError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware to validate family membership
export const validateFamilyAccess = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { familyId } = req.params;
    
    if (!req.user) {
      throw new BankingError('Unauthorized', 401);
    }

    if (req.user.familyId !== familyId) {
      throw new BankingError('Access denied', 403, 'USER_NOT_IN_FAMILY');
    }

    next();
  } catch (error) {
    next(error);
  }
};
