import type { RequestHandler } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

export const requireAuth: RequestHandler = (request, _response, next) => {
  const authorization = request.header('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    next(new AppError('Authentication is required', 401));
    return;
  }

  const token = authorization.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    if (typeof payload === 'string' || !isValidPayload(payload)) {
      next(new AppError('Invalid authentication token', 401));
      return;
    }

    request.auth = { userId: payload.sub };
    next();
  } catch {
    next(new AppError('Invalid authentication token', 401));
  }
};

function isValidPayload(payload: JwtPayload): payload is JwtPayload & { sub: string } {
  return typeof payload.sub === 'string' && payload.sub.length > 0;
}
