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

app.use(notFoundHandler);
app.use(errorHandler);
