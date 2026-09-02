import type { RequestHandler } from 'express';
import type { z } from 'zod';
import { AppError } from '../utils/app-error.js';

export function validateQuery(schema: z.ZodType): RequestHandler {
  return (request, _response, next) => {
    const result = schema.safeParse(request.query);
    if (!result.success) {
      next(new AppError('Invalid query parameters', 400, result.error.issues));
      return;
    }
    request.query = result.data as typeof request.query;
    next();
  };
}
