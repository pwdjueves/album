import type { ErrorRequestHandler } from 'express';
import multer from 'multer';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE' ? 'Image upload exceeds the 5 MB limit' : error.message;
    response.status(400).json({ error: { message } });
    return;
  }

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
