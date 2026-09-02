import { Router } from 'express';
import { albumRouter } from './album.routes.js';
import { authRouter } from './auth.routes.js';
import { healthRouter } from './health.routes.js';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/albums', albumRouter);
