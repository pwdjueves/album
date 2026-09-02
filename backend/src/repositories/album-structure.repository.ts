import { Prisma, type Page, type PhotoSlot } from '@prisma/client';
import { prisma } from '../config/prisma.js';

type PageWithSlots = Page & { photoSlots: PhotoSlot[] };

export const albumStructureRepository = {
  findPage(albumId: string, pageId: string): Promise<PageWithSlots | null> {
    return prisma.page.findFirst({
      where: { id: pageId, albumId },
      include: { photoSlots: { orderBy: { position: 'asc' } } },
    });
  },

  async createPage(albumId: string): Promise<Page> {
    return prisma.$transaction(async (transaction) => {
      const lastPage = await transaction.page.findFirst({
        where: { albumId },
        orderBy: { pageNumber: 'desc' },
        select: { pageNumber: true },
      });

      return transaction.page.create({
        data: { albumId, pageNumber: (lastPage?.pageNumber ?? 0) + 1 },
      });
    });
  },

  async movePage(albumId: string, pageId: string, pageNumber: number): Promise<Page> {
    return prisma.$transaction(async (transaction) => {
      const pages = await transaction.page.findMany({
        where: { albumId },
        orderBy: { pageNumber: 'asc' },
      });
      const page = pages.find(({ id }) => id === pageId);
      if (!page) {
        throw new Error('PAGE_NOT_FOUND');
      }
      if (pageNumber > pages.length) {
        throw new Error('INVALID_PAGE_POSITION');
      }
      if (page.pageNumber === pageNumber) {
        return page;
      }

      await transaction.page.update({ where: { id: pageId }, data: { pageNumber: 0 } });
      const affected = pages.filter(({ pageNumber: current }) =>
        pageNumber < page.pageNumber
          ? current >= pageNumber && current < page.pageNumber
          : current <= pageNumber && current > page.pageNumber,
      );
      const ordered = pageNumber < page.pageNumber ? affected.reverse() : affected;
      for (const affectedPage of ordered) {
        await transaction.page.update({
          where: { id: affectedPage.id },
          data: { pageNumber: affectedPage.pageNumber + (pageNumber < page.pageNumber ? 1 : -1) },
        });
      }

      return transaction.page.update({ where: { id: pageId }, data: { pageNumber } });
    });
  },

  async deletePage(albumId: string, pageId: string): Promise<void> {
    await prisma.$transaction(async (transaction) => {
      const page = await transaction.page.findFirst({ where: { id: pageId, albumId } });
      if (!page) {
        throw new Error('PAGE_NOT_FOUND');
      }
      const followingPages = await transaction.page.findMany({
        where: { albumId, pageNumber: { gt: page.pageNumber } },
        orderBy: { pageNumber: 'asc' },
      });
      await transaction.page.delete({ where: { id: pageId } });
      for (const followingPage of followingPages) {
        await transaction.page.update({
          where: { id: followingPage.id },
          data: { pageNumber: followingPage.pageNumber - 1 },
        });
      }
    });
  },

  async createSlot(
    pageId: string,
    data: Pick<Prisma.PhotoSlotUncheckedCreateInput, 'prompt' | 'status'>,
    position: number | undefined,
  ): Promise<PhotoSlot> {
    return prisma.$transaction(async (transaction) => {
      const slots = await transaction.photoSlot.findMany({
        where: { pageId },
        orderBy: { position: 'asc' },
      });
      const targetPosition = position ?? slots.length + 1;
      if (targetPosition > slots.length + 1) {
        throw new Error('INVALID_SLOT_POSITION');
      }

      for (const slot of slots.filter((slot) => slot.position >= targetPosition).reverse()) {
        await transaction.photoSlot.update({
          where: { id: slot.id },
          data: { position: slot.position + 1 },
        });
      }

      return transaction.photoSlot.create({ data: { pageId, ...data, position: targetPosition } });
    });
  },

  async updateSlot(pageId: string, slotId: string, data: Prisma.PhotoSlotUncheckedUpdateInput): Promise<PhotoSlot> {
    const slot = await prisma.photoSlot.findFirst({ where: { id: slotId, pageId } });
    if (!slot) {
      throw new Error('SLOT_NOT_FOUND');
    }
    return prisma.photoSlot.update({ where: { id: slotId }, data });
  },

  async moveSlot(pageId: string, slotId: string, position: number): Promise<PhotoSlot> {
    return prisma.$transaction(async (transaction) => {
      const slots = await transaction.photoSlot.findMany({ where: { pageId }, orderBy: { position: 'asc' } });
      const slot = slots.find(({ id }) => id === slotId);
      if (!slot) {
        throw new Error('SLOT_NOT_FOUND');
      }
      if (position > slots.length) {
        throw new Error('INVALID_SLOT_POSITION');
      }
      if (slot.position === position) {
        return slot;
      }

      await transaction.photoSlot.update({ where: { id: slotId }, data: { position: 0 } });
      const affected = slots.filter(({ position: current }) =>
        position < slot.position
          ? current >= position && current < slot.position
          : current <= position && current > slot.position,
      );
      const ordered = position < slot.position ? affected.reverse() : affected;
      for (const affectedSlot of ordered) {
        await transaction.photoSlot.update({
          where: { id: affectedSlot.id },
          data: { position: affectedSlot.position + (position < slot.position ? 1 : -1) },
        });
      }

      return transaction.photoSlot.update({ where: { id: slotId }, data: { position } });
    });
  },

  async deleteSlot(pageId: string, slotId: string): Promise<void> {
    await prisma.$transaction(async (transaction) => {
      const slot = await transaction.photoSlot.findFirst({ where: { id: slotId, pageId } });
      if (!slot) {
        throw new Error('SLOT_NOT_FOUND');
      }
      const followingSlots = await transaction.photoSlot.findMany({
        where: { pageId, position: { gt: slot.position } },
        orderBy: { position: 'asc' },
      });
      await transaction.photoSlot.delete({ where: { id: slotId } });
      for (const followingSlot of followingSlots) {
        await transaction.photoSlot.update({
          where: { id: followingSlot.id },
          data: { position: followingSlot.position - 1 },
        });
      }
    });
  },

  async reorderSlots(pageId: string, slotIds: string[]): Promise<PhotoSlot[]> {
    return prisma.$transaction(async (transaction) => {
      const slots = await transaction.photoSlot.findMany({ where: { pageId }, orderBy: { position: 'asc' } });
      if (slots.length !== slotIds.length || !slots.every((slot) => slotIds.includes(slot.id))) {
        throw new Error('INVALID_SLOT_ORDER');
      }

      for (const slot of slots) {
        await transaction.photoSlot.update({ where: { id: slot.id }, data: { position: -slot.position } });
      }
      for (const [index, slotId] of slotIds.entries()) {
        await transaction.photoSlot.update({ where: { id: slotId }, data: { position: index + 1 } });
      }

      return transaction.photoSlot.findMany({ where: { pageId }, orderBy: { position: 'asc' } });
    });
  },
};
