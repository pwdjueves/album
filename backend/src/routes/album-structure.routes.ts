import { Router } from 'express';
import { albumStructureController } from '../controllers/album-structure.controller.js';
import { validateBody } from '../middleware/validate-body.middleware.js';
import {
  createPageSchema,
  createSlotSchema,
  reorderSlotsSchema,
  updatePageSchema,
  updateSlotSchema,
} from '../validators/album-structure.validator.js';

export const albumStructureRouter = Router({ mergeParams: true });

albumStructureRouter.post('/pages', validateBody(createPageSchema), albumStructureController.createPage);
albumStructureRouter.patch('/pages/:pageId', validateBody(updatePageSchema), albumStructureController.updatePage);
albumStructureRouter.delete('/pages/:pageId', albumStructureController.deletePage);
albumStructureRouter.post('/pages/:pageId/slots', validateBody(createSlotSchema), albumStructureController.createSlot);
albumStructureRouter.patch(
  '/pages/:pageId/slots/:slotId',
  validateBody(updateSlotSchema),
  albumStructureController.updateSlot,
);
albumStructureRouter.delete('/pages/:pageId/slots/:slotId', albumStructureController.deleteSlot);
albumStructureRouter.put(
  '/pages/:pageId/slots/reorder',
  validateBody(reorderSlotsSchema),
  albumStructureController.reorderSlots,
);
