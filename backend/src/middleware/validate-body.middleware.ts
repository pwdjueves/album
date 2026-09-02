import type { RequestHandler } from 'express';
import type { z } from 'zod';
import { AppError } from '../utils/app-error.js';

export function validateBody(schema: z.ZodType): RequestHandler {
  return (request, _response, next) => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      next(new AppError('Invalid request body', 400, result.error.issues));
      return;
    }

    request.body = result.data;
    next();
  };
}
