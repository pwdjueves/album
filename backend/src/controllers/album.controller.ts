import type { Request, Response } from 'express';
import { albumService } from '../services/album.service.js';
import { AppError } from '../utils/app-error.js';
import { withImageUrl } from '../utils/photo-metadata.js';
import type { CreateAlbumInput, UpdateAlbumInput } from '../validators/album.validator.js';

function getActor(request: Request) {
  return { userId: request.auth!.userId, role: request.auth!.role };
}

function getOptionalActor(request: Request) {
  return request.auth ? { userId: request.auth.userId, role: request.auth.role } : null;
}

function getAlbumId(request: Request): string {
  const { id } = request.params;
  if (typeof id !== 'string') {
    throw new AppError('Invalid album id', 400);
  }

  return id;
}

function withPhotoMetadata<T extends { pages: Array<{ photoSlots: Array<{ photo: { imageUrl: string } | null }> }> }>(album: T) {
  return {
    ...album,
    pages: album.pages.map((page) => ({
      ...page,
      photoSlots: page.photoSlots.map((slot) =>
        slot.photo ? { ...slot, photo: withImageUrl(slot.photo) } : slot,
      ),
    })),
  };
}

export const albumController = {
  async create(request: Request, response: Response): Promise<void> {
    const album = await albumService.create(request.body as CreateAlbumInput, getActor(request));
    response.status(201).json({ album });
  },

  async list(request: Request, response: Response): Promise<void> {
    const albums = await albumService.list(getOptionalActor(request));
    response.status(200).json({ albums });
  },

  async getById(request: Request, response: Response): Promise<void> {
    const album = await albumService.getById(getAlbumId(request), getOptionalActor(request));
    response.status(200).json({ album: withPhotoMetadata(album) });
  },

  async update(request: Request, response: Response): Promise<void> {
    const album = await albumService.update(
      getAlbumId(request),
      request.body as UpdateAlbumInput,
      getActor(request),
    );
    response.status(200).json({ album });
  },

  async delete(request: Request, response: Response): Promise<void> {
    await albumService.delete(getAlbumId(request), getActor(request));
    response.status(204).send();
  },
};
