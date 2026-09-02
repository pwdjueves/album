import type { UserRole } from '@prisma/client';
import type { RequestHandler } from 'express';
import { AppError } from '../utils/app-error.js';

/**
 * Restricts a route to authenticated users with one of the supplied roles.
 * It must be placed after requireAuth, which loads the current role from the
 * database instead of trusting a role embedded in the JWT.
 */
export function requireRole(...roles: readonly UserRole[]): RequestHandler {
  if (roles.length === 0) {
    throw new Error('requireRole requires at least one role');
  }

  return (request, _response, next) => {
    if (!request.auth) {
      next(new AppError('Authentication is required', 401));
      return;
    }

    if (!roles.includes(request.auth.role)) {
      next(new AppError('You do not have permission to perform this action', 403));
      return;
    }

    next();
  };
}
