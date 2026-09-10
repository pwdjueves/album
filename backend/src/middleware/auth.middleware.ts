import type { RequestHandler } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../utils/app-error.js';

export const requireAuth: RequestHandler = async (request, _response, next) => {
  const authorization = request.header('authorization');

  const match = authorization?.match(/^Bearer\s+(\S+)$/i);
  if (!match) {
    next(new AppError('Authentication is required', 401));
    return;
  }

  const token = match[1];

  let payload: JwtPayload | string;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    next(new AppError('Invalid authentication token', 401));
    return;
  }

  if (typeof payload === 'string' || !isValidPayload(payload)) {
    next(new AppError('Invalid authentication token', 401));
    return;
  }

  const user = await userRepository.findById(payload.sub);
  if (!user || !user.isActive) {
    next(new AppError('Invalid authentication token', 401));
    return;
  }

  request.auth = { userId: user.id, role: user.role };
  next();
};

export function requireRole(...roles: Array<'USER' | 'MODERATOR' | 'ADMIN'>): RequestHandler {
  return (request, _response, next) => {
    if (!request.auth || !roles.includes(request.auth.role)) {
      next(new AppError('Insufficient permissions', 403));
      return;
    }

    next();
  };
}

export const requireModerator: RequestHandler = requireRole('MODERATOR', 'ADMIN');

/** Leaves requests without credentials anonymous, but rejects malformed credentials. */
export const optionalAuth: RequestHandler = (request, response, next) => {
  if (!request.header('authorization')) {
    next();
    return;
  }

  void requireAuth(request, response, next);
};

function isValidPayload(payload: JwtPayload): payload is JwtPayload & { sub: string } {
  return typeof payload.sub === 'string' && payload.sub.length > 0;
}
