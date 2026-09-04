import type { RequestHandler } from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { z } from 'zod';
import { AppError } from '../utils/app-error.js';

export type ValidatedQueryLocals<T> = {
  validatedQuery: T;
};

export function validateQuery<T extends z.ZodType>(
  schema: T,
): RequestHandler<
  ParamsDictionary,
  unknown,
  unknown,
  ParsedQs,
  ValidatedQueryLocals<z.output<T>>
> {
  return (request, response, next) => {
    const result = schema.safeParse(request.query);
    if (!result.success) {
      next(new AppError('Invalid query parameters', 400, result.error.issues));
      return;
    }
    response.locals.validatedQuery = result.data;
    next();
  };
}
