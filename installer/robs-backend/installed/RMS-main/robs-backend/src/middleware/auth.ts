
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole, JWTPayload } from '@/types';
import { AppError } from './errorHandler';
import prisma from '@/utils/database';
import { verifyToken } from '@/utils/jwt';
import logger from '@/utils/logger';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new AppError('Access denied. No token provided.', 401);
    }

    const decoded = verifyToken(token);

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, active: true },
    });

    if (!user || !user.active) {
      throw new AppError('User not found or inactive.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired.', 401));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token.', 401));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required.', 401));
      return;
    }


    if (!roles.includes(req.user.role)) {
      logger.warn(`Authorization failed: role mismatch for user ${req.user.id}. User role: ${req.user.role}, Required roles: ${roles.join(', ')}`);
      next(new AppError('Insufficient permissions', 403));
      return;
    }

    next();
  };
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      next();
      return;
    }

    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, active: true },
    });

    if (user && user.active) {
      req.user = user;
    }

    next();
  } catch (error) {
    // For optional auth, we don't throw errors, just continue without user
    next();
  }
};
