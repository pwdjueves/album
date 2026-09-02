import type { RequestHandler } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../utils/app-error.js';

export const requireAuth: RequestHandler = async (request, _response, next) => {
  const authorization = request.header('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    next(new AppError('Authentication is required', 401));
    return;
  }

  const token = authorization.slice('Bearer '.length);

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
  if (!user) {
    next(new AppError('Invalid authentication token', 401));
    return;
  }

  request.auth = { userId: user.id, role: user.role };
  next();
};

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
