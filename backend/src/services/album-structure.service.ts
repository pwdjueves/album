import type { Prisma } from '@prisma/client';
import { albumStructureRepository } from '../repositories/album-structure.repository.js';
import {
  canManageAlbumStructure,
  getAlbumAuthorizationContext,
  type AuthorizationActor,
} from './authorization.service.js';
import { AppError } from '../utils/app-error.js';
import type {
  CreateSlotInput,
  ReorderSlotsInput,
  UpdateSlotInput,
} from '../validators/album-structure.validator.js';

async function assertStructureAccess(albumId: string, actor: AuthorizationActor): Promise<void> {
  const context = await getAlbumAuthorizationContext(albumId, actor);
  if (!context) {
    throw new AppError('Album not found', 404);
  }
  if (!canManageAlbumStructure(context)) {
    throw new AppError('You do not have permission to modify this album structure', 403);
  }
}

async function assertPageInAlbum(albumId: string, pageId: string): Promise<void> {
  if (!(await albumStructureRepository.findPage(albumId, pageId))) {
    throw new AppError('Page not found', 404);
  }
}

function translateStructureError(error: unknown): never {
  if (error instanceof Error) {
    if (error.message === 'PAGE_NOT_FOUND') {
      throw new AppError('Page not found', 404);
    }
    if (error.message === 'SLOT_NOT_FOUND') {
      throw new AppError('Photo slot not found', 404);
    }
    if (error.message === 'INVALID_PAGE_POSITION' || error.message === 'INVALID_SLOT_POSITION') {
      throw new AppError('Position is outside the allowed range', 400);
    }
    if (error.message === 'INVALID_SLOT_ORDER') {
      throw new AppError('slotIds must contain every slot in the page exactly once', 400);
    }
  }

  throw error;
}

export const albumStructureService = {
  async createPage(albumId: string, actor: AuthorizationActor) {
    await assertStructureAccess(albumId, actor);
    return albumStructureRepository.createPage(albumId);
  },

  async updatePage(albumId: string, pageId: string, pageNumber: number, actor: AuthorizationActor) {
    await assertStructureAccess(albumId, actor);
    try {
      return await albumStructureRepository.movePage(albumId, pageId, pageNumber);
    } catch (error) {
      return translateStructureError(error);
    }
  },

  async deletePage(albumId: string, pageId: string, actor: AuthorizationActor): Promise<void> {
    await assertStructureAccess(albumId, actor);
    try {
      await albumStructureRepository.deletePage(albumId, pageId);
    } catch (error) {
      translateStructureError(error);
    }
  },

  async createSlot(albumId: string, pageId: string, input: CreateSlotInput, actor: AuthorizationActor) {
    await assertStructureAccess(albumId, actor);
    await assertPageInAlbum(albumId, pageId);
    try {
      return await albumStructureRepository.createSlot(
        pageId,
        { prompt: input.prompt, status: input.status },
        input.position,
      );
    } catch (error) {
      return translateStructureError(error);
    }
  },

  async updateSlot(
    albumId: string,
    pageId: string,
    slotId: string,
    input: UpdateSlotInput,
    actor: AuthorizationActor,
  ) {
    await assertStructureAccess(albumId, actor);
    await assertPageInAlbum(albumId, pageId);
    try {
      if (input.position !== undefined) {
        await albumStructureRepository.moveSlot(pageId, slotId, input.position);
      }

      const data: Prisma.PhotoSlotUncheckedUpdateInput = {};
      if (input.prompt !== undefined) data.prompt = input.prompt;
      if (input.status !== undefined) data.status = input.status;
      if (Object.keys(data).length > 0) {
        return await albumStructureRepository.updateSlot(pageId, slotId, data);
      }

      const page = await albumStructureRepository.findPage(albumId, pageId);
      const slot = page?.photoSlots.find(({ id }) => id === slotId);
      if (!slot) throw new Error('SLOT_NOT_FOUND');
      return slot;
    } catch (error) {
      return translateStructureError(error);
    }
  },

  async deleteSlot(albumId: string, pageId: string, slotId: string, actor: AuthorizationActor): Promise<void> {
    await assertStructureAccess(albumId, actor);
    await assertPageInAlbum(albumId, pageId);
    try {
      await albumStructureRepository.deleteSlot(pageId, slotId);
    } catch (error) {
      translateStructureError(error);
    }
  },

  async reorderSlots(
    albumId: string,
    pageId: string,
    input: ReorderSlotsInput,
    actor: AuthorizationActor,
  ) {
    await assertStructureAccess(albumId, actor);
    await assertPageInAlbum(albumId, pageId);
    try {
      return await albumStructureRepository.reorderSlots(pageId, input.slotIds);
    } catch (error) {
      return translateStructureError(error);
    }
  },
};
