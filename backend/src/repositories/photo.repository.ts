import { ModerationStatus, PhotoSlotStatus, type Photo, type PhotoSourceType } from '@prisma/client';
import { prisma } from '../config/prisma.js';

export const photoRepository = {
  async completeSlot(
    albumId: string,
    pageId: string,
    slotId: string,
    uploadedById: string,
    imageUrl: string,
    sourceType: PhotoSourceType,
  ): Promise<Photo> {
    return prisma.$transaction(async (transaction) => {
      const slot = await transaction.photoSlot.findFirst({
        where: { id: slotId, pageId, page: { albumId } },
        select: { id: true, status: true },
      });
      if (!slot) throw new Error('SLOT_NOT_FOUND');
      if (slot.status !== PhotoSlotStatus.EMPTY) throw new Error('SLOT_ALREADY_COMPLETED');

      const existingPhoto = await transaction.photo.findUnique({ where: { photoSlotId: slotId } });
      if (existingPhoto) throw new Error('SLOT_ALREADY_COMPLETED');

      const photo = await transaction.photo.create({
        data: {
          photoSlotId: slotId,
          uploadedById,
          imageUrl,
          sourceType,
          moderationStatus: ModerationStatus.PENDING,
        },
      });
      await transaction.photoSlot.update({
        where: { id: slotId },
        data: { status: PhotoSlotStatus.COMPLETED },
      });
      return photo;
    });
  },
};
