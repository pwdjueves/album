import { Router } from 'express';
import { albumRouter } from './album.routes.js';
import { authRouter } from './auth.routes.js';
import { healthRouter } from './health.routes.js';
import { categoryRouter } from './category.routes.js';
import { adminRouter } from './admin.routes.js';
import { moderationRouter } from './moderation.routes.js';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use('/categories', categoryRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/moderation', moderationRouter);
apiRouter.use('/albums', albumRouter);
