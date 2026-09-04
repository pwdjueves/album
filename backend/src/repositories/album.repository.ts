import { AlbumPrivacy, AlbumStatus, Prisma, type Album } from '@prisma/client';
import { prisma } from '../config/prisma.js';

const albumSelect = {
  id: true,
  title: true,
  description: true,
  categoryId: true,
  creatorId: true,
  groupId: true,
  privacy: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true } },
  creator: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.AlbumSelect;

export type PublicAlbum = Prisma.AlbumGetPayload<{ select: typeof albumSelect }>;

const albumDetailSelect = {
  ...albumSelect,
  pages: {
    orderBy: { pageNumber: 'asc' },
    select: {
      id: true,
      title: true,
      pageNumber: true,
      createdAt: true,
      updatedAt: true,
      photoSlots: {
        orderBy: { position: 'asc' },
        select: {
          id: true,
          prompt: true,
          position: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          photo: {
            select: {
              id: true,
              imageUrl: true,
              sourceType: true,
              moderationStatus: true,
              uploadedById: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.AlbumSelect;

export type PublicAlbumWithStructure = Prisma.AlbumGetPayload<{ select: typeof albumDetailSelect }>;

export function visibleAlbumWhere(userId?: string): Prisma.AlbumWhereInput {
  const access: Prisma.AlbumWhereInput = userId
    ? {
        OR: [
          { creatorId: userId, privacy: AlbumPrivacy.PRIVATE },
          { privacy: AlbumPrivacy.PUBLIC },
          {
            privacy: AlbumPrivacy.GROUP,
            group: { members: { some: { userId } } },
          },
        ],
      }
    : { privacy: AlbumPrivacy.PUBLIC };
  return { AND: [access, { status: AlbumStatus.ACTIVE }] };
}

export const albumRepository = {
  create(data: Prisma.AlbumCreateInput): Promise<PublicAlbum> {
    return prisma.album.create({ data, select: albumSelect });
  },

  findById(id: string): Promise<Album | null> {
    return prisma.album.findUnique({ where: { id } });
  },

  findPublicById(id: string): Promise<PublicAlbum | null> {
    return prisma.album.findUnique({ where: { id }, select: albumSelect });
  },

  findDetailedById(id: string): Promise<PublicAlbumWithStructure | null> {
    return prisma.album.findUnique({ where: { id }, select: albumDetailSelect });
  },

  findVisibleTo(userId?: string): Promise<PublicAlbum[]> {
    const where = visibleAlbumWhere(userId);

    return prisma.album.findMany({
      where,
      select: albumSelect,
      orderBy: { createdAt: 'desc' },
    });
  },

  findCreatedBy(userId: string): Promise<PublicAlbum[]> {
    return prisma.album.findMany({ where: { creatorId: userId }, select: albumSelect, orderBy: { createdAt: 'desc' } });
  },

  findCollaboratedBy(userId: string): Promise<PublicAlbum[]> {
    return prisma.album.findMany({ where: { collaborators: { some: { userId } } }, select: albumSelect, orderBy: { createdAt: 'desc' } });
  },

  findAllForModeration() {
    return prisma.album.findMany({
      select: {
        ...albumSelect,
        collaborators: {
          select: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  },

  findCollaborators(id: string) {
    return prisma.album.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        collaborators: {
          select: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  },

  findByIds(ids: string[]): Promise<PublicAlbum[]> {
    return prisma.album.findMany({ where: { id: { in: ids } }, select: albumSelect });
  },

  update(id: string, data: Prisma.AlbumUncheckedUpdateInput): Promise<PublicAlbum> {
    return prisma.album.update({ where: { id }, data, select: albumSelect });
  },

  delete(id: string): Promise<void> {
    return prisma.album.delete({ where: { id } }).then(() => undefined);
  },

  async replaceStructure(
    albumId: string,
    pages: Array<{ id?: string; title: string; slots: Array<{ id?: string; prompt: string }> }>,
  ): Promise<void> {
    await prisma.$transaction(async (transaction) => {
      const existingPages = await transaction.page.findMany({
        where: { albumId },
        include: { photoSlots: true },
      });
      const existingPageIds = new Set(existingPages.map((page) => page.id));
      const requestedPageIds = pages.filter((page) => page.id).map((page) => page.id as string);
      if (requestedPageIds.some((pageId) => !existingPageIds.has(pageId))) throw new Error('INVALID_PAGE_ID');

      const existingSlots = new Map(existingPages.flatMap((page) => page.photoSlots.map((slot) => [slot.id, slot])));
      const requestedSlotIds = pages.flatMap((page) => page.slots.filter((slot) => slot.id).map((slot) => slot.id as string));
      if (requestedSlotIds.some((slotId) => !existingSlots.has(slotId))) throw new Error('INVALID_SLOT_ID');

      await transaction.page.updateMany({ where: { albumId }, data: { pageNumber: { increment: 1000000 } } });
      await transaction.photoSlot.updateMany({
        where: { page: { albumId } },
        data: { position: { increment: 1000000 } },
      });

      const requestedPageIdSet = new Set(requestedPageIds);
      await transaction.page.deleteMany({ where: { albumId, id: { notIn: [...requestedPageIdSet] } } });

      for (const [pageIndex, pageInput] of pages.entries()) {
        const page = pageInput.id
          ? await transaction.page.update({
              where: { id: pageInput.id },
              data: { title: pageInput.title, pageNumber: pageIndex + 1 },
            })
          : await transaction.page.create({
              data: { albumId, title: pageInput.title, pageNumber: pageIndex + 1 },
            });
        const requestedIds = pageInput.slots.filter((slot) => slot.id).map((slot) => slot.id as string);
        await transaction.photoSlot.deleteMany({
          where: { pageId: page.id, id: { notIn: requestedIds } },
        });
        for (const [slotIndex, slotInput] of pageInput.slots.entries()) {
          if (slotInput.id) {
            if (existingSlots.get(slotInput.id)?.pageId !== page.id) throw new Error('INVALID_SLOT_ID');
            await transaction.photoSlot.update({
              where: { id: slotInput.id },
              data: { prompt: slotInput.prompt, position: slotIndex + 1 },
            });
          } else {
            await transaction.photoSlot.create({
              data: { pageId: page.id, prompt: slotInput.prompt, position: slotIndex + 1 },
            });
          }
        }
      }
    });
  },

  categoryExists(id: string): Promise<boolean> {
    return prisma.category.findUnique({ where: { id }, select: { id: true } }).then(Boolean);
  },

  isGroupMember(groupId: string, userId: string): Promise<boolean> {
    return prisma.groupMember
      .findUnique({ where: { groupId_userId: { groupId, userId } }, select: { id: true } })
      .then(Boolean);
  },
};
