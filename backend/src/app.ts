import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { errorHandler } from './middleware/error-handler.middleware.js';
import { notFoundHandler } from './middleware/not-found.middleware.js';
import { apiRouter } from './routes/index.js';
import { env } from './config/env.js';

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigins,
  }),
);
app.use(express.json());
app.use('/uploads', express.static(env.uploadDir));

app.use('/api', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);
