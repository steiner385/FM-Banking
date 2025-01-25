import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { BankingError } from '../types/errors';

interface JwtPayload {
  userId: string;
  familyId: string;
  role: 'PARENT' | 'CHILD';
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        familyId: string;
        role: 'PARENT' | 'CHILD';
      };
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new BankingError('Unauthorized', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new BankingError('Unauthorized', 401);
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new BankingError('Server configuration error', 500);
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    
    req.user = {
      id: decoded.userId,
      familyId: decoded.familyId,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new BankingError('Invalid token', 401));
    } else {
      next(error);
    }
  }
};
