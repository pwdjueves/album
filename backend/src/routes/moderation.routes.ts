import { Router } from 'express';
import { moderationController } from '../controllers/moderation.controller.js';
import { requireAuth, requireModerator } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate-body.middleware.js';
import { moderationStatusSchema } from '../validators/moderation.validator.js';

export const moderationRouter = Router();
moderationRouter.use(requireAuth, requireModerator);
moderationRouter.get('/albums', moderationController.listAlbums);
moderationRouter.get('/albums/:id/collaborators', moderationController.collaborators);
moderationRouter.patch('/albums/:id/status', validateBody(moderationStatusSchema), moderationController.updateStatus);
moderationRouter.delete('/albums/:id', moderationController.deleteAlbum);
