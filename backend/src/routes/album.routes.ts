import { Router } from 'express';
import { albumController } from '../controllers/album.controller.js';
import { optionalAuth, requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate-body.middleware.js';
import { createAlbumSchema, moderationSchema, updateAlbumSchema } from '../validators/album.validator.js';
import { albumStructureRouter } from './album-structure.routes.js';
import { photoRouter } from './photo.routes.js';
import { voteController } from '../controllers/vote.controller.js';
import { validateQuery } from '../middleware/validate-query.middleware.js';
import { rankingQuerySchema } from '../validators/vote.validator.js';

export const albumRouter = Router();

albumRouter.get('/ranking', optionalAuth, validateQuery(rankingQuerySchema), voteController.ranking);
albumRouter.get('/mine/created', requireAuth, albumController.listCreated);
albumRouter.get('/mine/collaborated', requireAuth, albumController.listCollaborated);
albumRouter.get('/:id/votes', optionalAuth, voteController.getVotes);
albumRouter.get('/', optionalAuth, albumController.list);
albumRouter.get('/:id', optionalAuth, albumController.getById);

albumRouter.use(requireAuth);
albumRouter.use('/:albumId', albumStructureRouter);
albumRouter.use('/:albumId/pages/:pageId/slots/:slotId/photo', photoRouter);
albumRouter.post('/', validateBody(createAlbumSchema), albumController.create);
albumRouter.post('/:id/vote', voteController.vote);
albumRouter.delete('/:id/vote', voteController.removeVote);
albumRouter.patch('/:id', validateBody(updateAlbumSchema), albumController.update);
albumRouter.patch('/:id/moderation', validateBody(moderationSchema), albumController.moderate);
albumRouter.delete('/:id', albumController.delete);
