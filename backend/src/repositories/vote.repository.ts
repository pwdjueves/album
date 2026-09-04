import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { visibleAlbumWhere } from './album.repository.js';

export const voteRepository = {
  create(albumId: string, userId: string) {
    return prisma.vote.create({ data: { albumId, userId } });
  },

  remove(albumId: string, userId: string): Promise<void> {
    return prisma.vote.deleteMany({ where: { albumId, userId } }).then(() => undefined);
  },

  countByAlbum(albumId: string): Promise<number> {
    return prisma.vote.count({ where: { albumId } });
  },

  ranking(
    userId: string | undefined,
    skip: number,
    take: number,
    filters: { title?: string; categoryId?: string },
  ) {
    return prisma.vote.groupBy({
      by: ['albumId'],
      where: {
        album: {
          AND: [
            visibleAlbumWhere(userId),
            filters.title ? { title: { contains: filters.title } } : {},
            filters.categoryId ? { categoryId: filters.categoryId } : {},
          ],
        },
      },
      _count: { albumId: true },
      orderBy: [{ _count: { albumId: 'desc' } }, { albumId: 'asc' }],
      skip,
      take,
    });
  },
};
