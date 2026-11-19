import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { errorHandler } from './middleware/error-handler.middleware.js';
import { notFoundHandler } from './middleware/not-found.middleware.js';
import { apiRouter } from './routes/index.js';
import { env } from './config/env.js';

export const app = express();

const imageSources = [
  "'self'",
  'data:',
  'blob:',
  'https:',
  `http://localhost:${env.port}`,
  `http://127.0.0.1:${env.port}`,
];

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        imgSrc: imageSources,
        upgradeInsecureRequests: env.nodeEnv === 'production' ? [] : null,
      },
    },
  }),
);
app.use(
  cors({
    origin: env.corsOrigins,
  }),
);
app.use(express.json());
app.use('/uploads', (request, response, next) => {
  response.once('finish', () => {
    if (response.statusCode >= 400) {
      console.error('Stored image request failed', {
        method: request.method,
        path: request.originalUrl,
        status: response.statusCode,
      });
    }
  });
  next();
});
app.use('/uploads', express.static(env.uploadDir, { index: false }));

app.use('/api', apiRouter);

const frontendDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');
const frontendIndex = path.join(frontendDist, 'index.html');

if (existsSync(frontendIndex)) {
  app.use(express.static(frontendDist));
  app.get('/{*path}', (request, response, next) => {
    if (
      request.path === '/api' ||
      request.path.startsWith('/api/') ||
      request.path === '/uploads' ||
      request.path.startsWith('/uploads/')
    ) {
      next();
      return;
    }

    response.sendFile(frontendIndex, (error) => {
      if (error) next(error);
    });
  });
}

app.use(notFoundHandler);
app.use(errorHandler);
