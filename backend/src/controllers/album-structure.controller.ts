import type { Request, Response } from 'express';
import { albumStructureService } from '../services/album-structure.service.js';
import { AppError } from '../utils/app-error.js';
import type {
  CreateSlotInput,
  ReorderSlotsInput,
  UpdateSlotInput,
} from '../validators/album-structure.validator.js';

function getParam(request: Request, name: string): string {
  const value = request.params[name];
  if (typeof value !== 'string') throw new AppError(`Invalid ${name}`, 400);
  return value;
}

function getActor(request: Request) {
  return { userId: request.auth!.userId, role: request.auth!.role };
}

export const albumStructureController = {
  async createPage(request: Request, response: Response): Promise<void> {
    const page = await albumStructureService.createPage(getParam(request, 'albumId'), getActor(request));
    response.status(201).json({ page });
  },

  async updatePage(request: Request, response: Response): Promise<void> {
    const page = await albumStructureService.updatePage(
      getParam(request, 'albumId'),
      getParam(request, 'pageId'),
      request.body.pageNumber as number,
      getActor(request),
    );
    response.status(200).json({ page });
  },

  async deletePage(request: Request, response: Response): Promise<void> {
    await albumStructureService.deletePage(
      getParam(request, 'albumId'),
      getParam(request, 'pageId'),
      getActor(request),
    );
    response.status(204).send();
  },

  async createSlot(request: Request, response: Response): Promise<void> {
    const slot = await albumStructureService.createSlot(
      getParam(request, 'albumId'),
      getParam(request, 'pageId'),
      request.body as CreateSlotInput,
      getActor(request),
    );
    response.status(201).json({ slot });
  },

  async updateSlot(request: Request, response: Response): Promise<void> {
    const slot = await albumStructureService.updateSlot(
      getParam(request, 'albumId'),
      getParam(request, 'pageId'),
      getParam(request, 'slotId'),
      request.body as UpdateSlotInput,
      getActor(request),
    );
    response.status(200).json({ slot });
  },

  async deleteSlot(request: Request, response: Response): Promise<void> {
    await albumStructureService.deleteSlot(
      getParam(request, 'albumId'),
      getParam(request, 'pageId'),
      getParam(request, 'slotId'),
      getActor(request),
    );
    response.status(204).send();
  },

  async reorderSlots(request: Request, response: Response): Promise<void> {
    const slots = await albumStructureService.reorderSlots(
      getParam(request, 'albumId'),
      getParam(request, 'pageId'),
      request.body as ReorderSlotsInput,
      getActor(request),
    );
    response.status(200).json({ slots });
  },
};
