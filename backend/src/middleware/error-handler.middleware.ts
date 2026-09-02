import type { ErrorRequestHandler } from 'express';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const message =
    error instanceof AppError || env.nodeEnv !== 'production'
      ? error.message
      : 'Internal server error';

  const body: {
    error: {
      message: string;
      details?: unknown;
    };
  } = {
    error: {
      message,
    },
  };

  if (error instanceof AppError && error.details !== undefined) {
    body.error.details = error.details;
  }

  response.status(statusCode).json(body);
};
