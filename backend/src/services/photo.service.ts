import { PhotoSourceType, type Photo } from '@prisma/client';
import { imageStorage } from '../storage/cloudinary.storage.js';
import type { StorageUpload } from '../storage/storage.provider.js';
import { photoRepository } from '../repositories/photo.repository.js';
import { canCompleteAlbum, canModerate, getAlbumAuthorizationContext, type AuthorizationActor } from './authorization.service.js';
import { AppError } from '../utils/app-error.js';
import { withImageUrl } from '../utils/photo-metadata.js';

function toPhotoMetadata(photo: Photo) {
  return withImageUrl(photo);
}

function translatePhotoError(error: unknown): never {
  if (error instanceof Error) {
    if (error.message === 'SLOT_NOT_FOUND') throw new AppError('Photo slot not found', 404);
    if (error.message === 'SLOT_ALREADY_COMPLETED') {
      throw new AppError('This photo slot has already been completed', 409);
    }
  }
  throw error;
}

async function assertCanComplete(albumId: string, actor: AuthorizationActor): Promise<void> {
  const context = await getAlbumAuthorizationContext(albumId, actor);
  if (!context) throw new AppError('Album not found', 404);
  if (!canCompleteAlbum(context)) {
    throw new AppError('You do not have permission to complete this photo slot', 403);
  }
}

export const photoService = {
  async completeFromUrl(albumId: string, pageId: string, slotId: string, imageUrl: string, actor: AuthorizationActor) {
    await assertCanComplete(albumId, actor);
    try {
      const photo = await photoRepository.completeSlot(albumId, pageId, slotId, actor.userId, imageUrl, PhotoSourceType.URL);
      return toPhotoMetadata(photo);
    } catch (error) {
      return translatePhotoError(error);
    }
  },

  async completeFromUpload(
    albumId: string,
    pageId: string,
    slotId: string,
    upload: StorageUpload,
    actor: AuthorizationActor,
  ) {
    await assertCanComplete(albumId, actor);
    const imageUrl = await imageStorage.uploadImage(upload);
    try {
      const photo = await photoRepository.completeSlot(albumId, pageId, slotId, actor.userId, imageUrl, PhotoSourceType.UPLOAD);
      return toPhotoMetadata(photo);
    } catch (error) {
      return translatePhotoError(error);
    }
  },

  async removePhoto(albumId: string, pageId: string, slotId: string, actor: AuthorizationActor): Promise<void> {
    if (!canModerate(actor)) throw new AppError('Moderation role required', 403);
    try {
      await photoRepository.removeFromSlot(albumId, pageId, slotId);
    } catch (error) {
      return translatePhotoError(error);
    }
  },
};
