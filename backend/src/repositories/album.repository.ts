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
  return userId
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
}

export const albumRepository = {
  create(data: Prisma.AlbumUncheckedCreateInput): Promise<PublicAlbum> {
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

  findByIds(ids: string[]): Promise<PublicAlbum[]> {
    return prisma.album.findMany({ where: { id: { in: ids } }, select: albumSelect });
  },

  update(id: string, data: Prisma.AlbumUncheckedUpdateInput): Promise<PublicAlbum> {
    return prisma.album.update({ where: { id }, data, select: albumSelect });
  },

  delete(id: string): Promise<void> {
    return prisma.album.delete({ where: { id } }).then(() => undefined);
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
